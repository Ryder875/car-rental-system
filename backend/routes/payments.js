const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 创建支付记录
router.post('/', async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { rental_id, amount, payment_method, transaction_id } = req.body;

    if (!rental_id || !amount || !payment_method) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 验证订单存在
    const [rentals] = await connection.query('SELECT * FROM rentals WHERE id = ?', [rental_id]);
    if (rentals.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Rental not found' });
    }

    // 创建支付记录
    const [result] = await connection.query(
      `INSERT INTO payments (rental_id, amount, payment_method, payment_status, transaction_id, payment_date)
       VALUES (?, ?, ?, 'completed', ?, NOW())`,
      [rental_id, amount, payment_method, transaction_id || null]
    );

    // 如果支付成功，更新订单状态为active
    await connection.query(
      'UPDATE rentals SET status = "active" WHERE id = ?',
      [rental_id]
    );

    await connection.commit();

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Payment recorded successfully' 
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  } finally {
    connection.release();
  }
});

// 获取订单的支付记录
router.get('/rental/:rental_id', async (req, res) => {
  try {
    const { rental_id } = req.params;
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE rental_id = ? ORDER BY created_at DESC',
      [rental_id]
    );

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// 获取所有支付记录
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, payment_status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*, r.id as rental_id, r.total_amount, r.start_date, r.end_date,
             c.name as customer_name, car.brand, car.model
      FROM payments p
      JOIN rentals r ON p.rental_id = r.id
      JOIN customers c ON r.customer_id = c.id
      JOIN cars car ON r.car_id = car.id
      WHERE 1=1
    `;
    const params = [];

    if (payment_status) {
      query += ' AND p.payment_status = ?';
      params.push(payment_status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [payments] = await db.query(query, params);

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;

