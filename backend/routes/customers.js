const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 创建客户
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, id_card, address, driver_license } = req.body;

    console.log('收到创建客户请求:', { name, email, phone, id_card, driver_license, address });

    // 验证必填字段
    if (!name || !email || !phone || !id_card || !driver_license) {
      console.log('缺少必填字段:', { name: !!name, email: !!email, phone: !!phone, id_card: !!id_card, driver_license: !!driver_license });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // 执行插入
    const [result] = await db.query(
      'INSERT INTO customers (name, email, phone, id_card, address, driver_license) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim(), phone.trim(), id_card.trim(), address ? address.trim() : null, driver_license.trim()]
    );

    console.log('客户创建成功，ID:', result.insertId);

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Customer created successfully' 
    });
  } catch (error) {
    console.error('创建客户错误详情:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        error: 'Customer with this email, ID card, or driver license already exists' 
      });
    }
    res.status(500).json({ 
      error: 'Failed to create customer: ' + (error.message || 'Unknown error') 
    });
  }
});

// 获取所有客户
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [customers] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM customers WHERE 1=1';
    const countParams = [];
    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      customers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// 获取单个客户详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [customers] = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json(customers[0]);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// 更新客户信息
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const [result] = await db.query(
      'UPDATE customers SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?',
      [name, email, phone, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// 删除客户
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;

    // 检查是否有未完成的租赁订单（只检查 pending 和 active 状态的订单）
    const [activeRentals] = await connection.query(
      'SELECT COUNT(*) as count FROM rentals WHERE customer_id = ? AND status IN ("pending", "active")',
      [id]
    );

    if (activeRentals[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete customer with active rental orders. Please complete or cancel all active orders first.' 
      });
    }

    // 检查是否有任何订单记录（包括已完成的订单）
    // 如果有订单记录，不允许删除，因为订单是重要的业务数据，需要保留历史记录
    const [allRentals] = await connection.query(
      'SELECT COUNT(*) as count FROM rentals WHERE customer_id = ?',
      [id]
    );

    if (allRentals[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete customer with rental history. Customer has existing rental records that must be preserved for business purposes.' 
      });
    }

    // 只有没有任何订单记录的客户才能删除
    const [result] = await connection.query(
      'DELETE FROM customers WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Customer not found' });
    }

    await connection.commit();
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting customer:', error);
    // 返回更详细的错误信息
    const errorMessage = error.code === 'ER_ROW_IS_REFERENCED_2' 
      ? 'Cannot delete customer with rental history. Customer has existing rental records that must be preserved.'
      : error.message || 'Failed to delete customer';
    res.status(500).json({ error: errorMessage });
  } finally {
    connection.release();
  }
});

module.exports = router;
