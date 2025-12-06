const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 创建租赁订单
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { customer_id, car_id, start_date, end_date, pickup_location, return_location, notes } = req.body;

    if (!customer_id || !car_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 检查车辆是否可用
    const [cars] = await connection.query('SELECT * FROM cars WHERE id = ? AND status = "available"', [car_id]);
    if (cars.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Car is not available for rental' });
    }

    const car = cars[0];
    const daily_rate = car.daily_rate;

    // 计算租赁天数
    const start = new Date(start_date);
    const end = new Date(end_date);
    const total_days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (total_days <= 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid date range' });
    }

    const total_amount = daily_rate * total_days;

    // 检查日期冲突
    const [conflicts] = await connection.query(
      `SELECT * FROM rentals 
       WHERE car_id = ? 
       AND status IN ('pending', 'active')
       AND (
         (start_date <= ? AND end_date >= ?) OR
         (start_date <= ? AND end_date >= ?) OR
         (start_date >= ? AND end_date <= ?)
       )`,
      [car_id, start_date, start_date, end_date, end_date, start_date, end_date]
    );

    if (conflicts.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'Car is already booked for the selected dates' });
    }

    // 创建订单
    const [result] = await connection.query(
      `INSERT INTO rentals (customer_id, car_id, start_date, end_date, daily_rate, total_days, total_amount, pickup_location, return_location, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [customer_id, car_id, start_date, end_date, daily_rate, total_days, total_amount, pickup_location, return_location, notes]
    );

    // 更新车辆状态为已租赁
    await connection.query('UPDATE cars SET status = "rented" WHERE id = ?', [car_id]);

    await connection.commit();

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Rental order created successfully',
      total_amount,
      total_days
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating rental:', error);
    res.status(500).json({ error: 'Failed to create rental order' });
  } finally {
    connection.release();
  }
});

// 获取所有订单
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, customer_id, car_id } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT r.*, 
             c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
             car.brand, car.model, car.license_plate, car.image_url
      FROM rentals r
      JOIN customers c ON r.customer_id = c.id
      JOIN cars car ON r.car_id = car.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND r.status = ?';
      params.push(status);
    }

    if (customer_id) {
      query += ' AND r.customer_id = ?';
      params.push(customer_id);
    }

    if (car_id) {
      query += ' AND r.car_id = ?';
      params.push(car_id);
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [rentals] = await db.query(query, params);

    // 获取总数
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM rentals r
      WHERE 1=1
    `;
    const countParams = [];
    
    if (status) {
      countQuery += ' AND r.status = ?';
      countParams.push(status);
    }
    if (customer_id) {
      countQuery += ' AND r.customer_id = ?';
      countParams.push(customer_id);
    }
    if (car_id) {
      countQuery += ' AND r.car_id = ?';
      countParams.push(car_id);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      rentals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching rentals:', error);
    res.status(500).json({ error: 'Failed to fetch rentals' });
  }
});

// 获取单个订单详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rentals] = await db.query(
      `SELECT r.*, 
              c.name as customer_name, c.email as customer_email, c.phone as customer_phone, c.id_card,
              car.brand, car.model, car.license_plate, car.image_url, car.color, car.year
       FROM rentals r
       JOIN customers c ON r.customer_id = c.id
       JOIN cars car ON r.car_id = car.id
       WHERE r.id = ?`,
      [id]
    );
    
    if (rentals.length === 0) {
      return res.status(404).json({ error: 'Rental not found' });
    }

    res.json(rentals[0]);
  } catch (error) {
    console.error('Error fetching rental:', error);
    res.status(500).json({ error: 'Failed to fetch rental' });
  }
});

// 更新订单状态
router.patch('/:id/status', async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'completed', 'cancelled'].includes(status)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid status' });
    }

    // 获取订单信息
    const [rentals] = await connection.query('SELECT * FROM rentals WHERE id = ?', [id]);
    if (rentals.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Rental not found' });
    }

    const rental = rentals[0];

    // 如果要完成订单，需要检查是否有支付记录
    if (status === 'completed') {
      // 检查是否有支付记录
      const [payments] = await connection.query(
        'SELECT SUM(amount) as total_paid FROM payments WHERE rental_id = ? AND payment_status = "completed"',
        [id]
      );

      const totalPaid = parseFloat(payments[0].total_paid || 0);
      const totalAmount = parseFloat(rental.total_amount);

      if (totalPaid < totalAmount) {
        await connection.rollback();
        return res.status(400).json({ 
          error: `Cannot complete order. Payment required. Total amount: ¥${totalAmount.toFixed(2)}, Paid: ¥${totalPaid.toFixed(2)}` 
        });
      }
    }

    // 更新订单状态
    await connection.query('UPDATE rentals SET status = ? WHERE id = ?', [status, id]);

    // 根据状态更新车辆状态
    if (status === 'completed' || status === 'cancelled') {
      await connection.query('UPDATE cars SET status = "available" WHERE id = ?', [rental.car_id]);
    } else if (status === 'active') {
      await connection.query('UPDATE cars SET status = "rented" WHERE id = ?', [rental.car_id]);
    }

    await connection.commit();
    res.json({ message: 'Rental status updated successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error updating rental status:', error);
    res.status(500).json({ error: 'Failed to update rental status' });
  } finally {
    connection.release();
  }
});

module.exports = router;
