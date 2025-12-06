const express = require('express');
const router = express.Router();
const db = require('../config/database');

// 获取仪表板统计数据
router.get('/dashboard', async (req, res) => {
  try {
    // 总车辆数
    const [totalCars] = await db.query('SELECT COUNT(*) as count FROM cars');
    
    // 可用车辆数
    const [availableCars] = await db.query('SELECT COUNT(*) as count FROM cars WHERE status = "available"');
    
    // 已租赁车辆数
    const [rentedCars] = await db.query('SELECT COUNT(*) as count FROM cars WHERE status = "rented"');
    
    // 总客户数
    const [totalCustomers] = await db.query('SELECT COUNT(*) as count FROM customers');
    
    // 活跃订单数
    const [activeRentals] = await db.query('SELECT COUNT(*) as count FROM rentals WHERE status IN ("pending", "active")');
    
    // 本月总收入
    const [monthlyRevenue] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as revenue 
       FROM payments 
       WHERE payment_status = 'completed' 
       AND MONTH(payment_date) = MONTH(CURRENT_DATE())
       AND YEAR(payment_date) = YEAR(CURRENT_DATE())`
    );
    
    // 总收入
    const [totalRevenue] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as revenue 
       FROM payments 
       WHERE payment_status = 'completed'`
    );

    // 本月订单数
    const [monthlyRentals] = await db.query(
      `SELECT COUNT(*) as count 
       FROM rentals 
       WHERE MONTH(created_at) = MONTH(CURRENT_DATE())
       AND YEAR(created_at) = YEAR(CURRENT_DATE())`
    );

    // 最受欢迎的车辆品牌
    const [popularBrands] = await db.query(
      `SELECT car.brand, COUNT(*) as rental_count
       FROM rentals r
       JOIN cars car ON r.car_id = car.id
       GROUP BY car.brand
       ORDER BY rental_count DESC
       LIMIT 5`
    );

    // 最近7天的收入趋势
    const [revenueTrend] = await db.query(
      `SELECT DATE(payment_date) as date, SUM(amount) as revenue
       FROM payments
       WHERE payment_status = 'completed'
       AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
       GROUP BY DATE(payment_date)
       ORDER BY date ASC`
    );

    res.json({
      overview: {
        totalCars: totalCars[0].count,
        availableCars: availableCars[0].count,
        rentedCars: rentedCars[0].count,
        totalCustomers: totalCustomers[0].count,
        activeRentals: activeRentals[0].count,
        monthlyRevenue: parseFloat(monthlyRevenue[0].revenue),
        totalRevenue: parseFloat(totalRevenue[0].revenue),
        monthlyRentals: monthlyRentals[0].count
      },
      popularBrands,
      revenueTrend
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
});

// 获取收入统计（按时间段）
router.get('/revenue', async (req, res) => {
  try {
    const { period = 'month' } = req.query; // day, week, month, year

    let dateFormat, interval;
    switch (period) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        interval = 'DAY';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        interval = 'WEEK';
        break;
      case 'year':
        dateFormat = '%Y';
        interval = 'YEAR';
        break;
      default:
        dateFormat = '%Y-%m';
        interval = 'MONTH';
    }

    const [revenue] = await db.query(
      `SELECT DATE_FORMAT(payment_date, ?) as period, SUM(amount) as revenue, COUNT(*) as transaction_count
       FROM payments
       WHERE payment_status = 'completed'
       AND payment_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 ${interval})
       GROUP BY DATE_FORMAT(payment_date, ?)
       ORDER BY period ASC`,
      [dateFormat, dateFormat]
    );

    res.json(revenue);
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ error: 'Failed to fetch revenue statistics' });
  }
});

// 获取车辆利用率统计
router.get('/car-utilization', async (req, res) => {
  try {
    const [utilization] = await db.query(
      `SELECT 
        car.id,
        car.brand,
        car.model,
        car.license_plate,
        COUNT(r.id) as rental_count,
        SUM(r.total_days) as total_rental_days,
        SUM(r.total_amount) as total_revenue
       FROM cars car
       LEFT JOIN rentals r ON car.id = r.car_id AND r.status = 'completed'
       GROUP BY car.id, car.brand, car.model, car.license_plate
       ORDER BY rental_count DESC, total_revenue DESC`
    );

    res.json(utilization);
  } catch (error) {
    console.error('Error fetching car utilization:', error);
    res.status(500).json({ error: 'Failed to fetch car utilization statistics' });
  }
});

module.exports = router;
