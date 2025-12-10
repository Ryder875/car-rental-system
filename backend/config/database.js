const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: "123456",
  database: process.env.DB_NAME || 'car_rental',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

