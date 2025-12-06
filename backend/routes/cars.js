const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取所有车辆（支持分页和筛选）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, status, brand, minPrice, maxPrice, search } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (minPrice) {
      query += ' AND daily_rate >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND daily_rate <= ?';
      params.push(maxPrice);
    }

    if (search) {
      query += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [cars] = await db.query(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM cars WHERE 1=1';
    const countParams = [];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    if (brand) {
      countQuery += ' AND brand = ?';
      countParams.push(brand);
    }
    if (minPrice) {
      countQuery += ' AND daily_rate >= ?';
      countParams.push(minPrice);
    }
    if (maxPrice) {
      countQuery += ' AND daily_rate <= ?';
      countParams.push(maxPrice);
    }
    if (search) {
      countQuery += ' AND (brand LIKE ? OR model LIKE ? OR description LIKE ?)';
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      cars,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// 获取单个车辆详情
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [cars] = await db.query('SELECT * FROM cars WHERE id = ?', [id]);
    
    if (cars.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }

    res.json(cars[0]);
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Failed to fetch car' });
  }
});

// 获取所有品牌（用于筛选）
router.get('/meta/brands', async (req, res) => {
  try {
    const [brands] = await db.query('SELECT DISTINCT brand FROM cars ORDER BY brand');
    res.json(brands.map(b => b.brand));
  } catch (error) {
    console.error('Error fetching brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// 删除车辆
router.delete('/:id', async (req, res) => {
  const connection = await db.getConnection();
  await connection.beginTransaction();

  try {
    const { id } = req.params;

    // 检查是否有未完成的租赁订单（只检查 pending 和 active 状态的订单）
    const [activeRentals] = await connection.query(
      'SELECT COUNT(*) as count FROM rentals WHERE car_id = ? AND status IN ("pending", "active")',
      [id]
    );

    if (activeRentals[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete car with active rental orders. Please complete or cancel all active orders first.' 
      });
    }

    // 检查是否有任何订单记录（包括已完成的订单）
    // 如果有订单记录，不允许删除，因为订单是重要的业务数据，需要保留历史记录
    const [allRentals] = await connection.query(
      'SELECT COUNT(*) as count FROM rentals WHERE car_id = ?',
      [id]
    );

    if (allRentals[0].count > 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Cannot delete car with rental history. Car has existing rental records that must be preserved for business purposes.' 
      });
    }

    // 只有没有任何订单记录的车辆才能删除
    const [result] = await connection.query(
      'DELETE FROM cars WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Car not found' });
    }

    await connection.commit();
    res.json({ message: 'Car deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting car:', error);
    // 返回更详细的错误信息
    const errorMessage = error.code === 'ER_ROW_IS_REFERENCED_2' 
      ? 'Cannot delete car with rental history. Car has existing rental records that must be preserved.'
      : error.message || 'Failed to delete car';
    res.status(500).json({ error: errorMessage });
  } finally {
    connection.release();
  }
});

module.exports = router;
