const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
  let connection;
  
  try {
    // 连接到MySQL服务器（不指定数据库）
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
    });

    console.log('Connected to MySQL server');

    // 读取SQL文件
    const sqlFile = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    // 分割SQL语句
    const statements = sqlFile
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // 执行每个SQL语句
    for (const statement of statements) {
      if (statement) {
        await connection.query(statement);
      }
    }

    console.log('Database schema created successfully!');
    console.log('You can now run the scraper to populate initial data.');

  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();

