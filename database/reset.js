const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function resetDatabase() {
  let connection;
  
  try {
    // 连接到数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'car_rental',
    });

    console.log('Connected to database');

    // 禁用外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 按照依赖关系顺序删除所有数据
    console.log('Clearing payments table...');
    await connection.query('DELETE FROM payments');
    
    console.log('Clearing maintenance table...');
    await connection.query('DELETE FROM maintenance');
    
    console.log('Clearing rentals table...');
    await connection.query('DELETE FROM rentals');
    
    console.log('Clearing customers table...');
    await connection.query('DELETE FROM customers');
    
    console.log('Clearing cars table...');
    await connection.query('DELETE FROM cars');

    // 重置自增ID（可选，让ID从1开始）
    console.log('Resetting auto-increment IDs...');
    await connection.query('ALTER TABLE payments AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE maintenance AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE rentals AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE customers AUTO_INCREMENT = 1');
    await connection.query('ALTER TABLE cars AUTO_INCREMENT = 1');

    // 重新启用外键检查
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\n✅ Database reset successfully!');
    console.log('All data has been cleared. Tables are empty and ready for new data.');
    console.log('You can now run the scraper to populate initial data: npm run scrape');

  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

resetDatabase();


