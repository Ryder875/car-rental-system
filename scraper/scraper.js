const axios = require('axios');
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 从项目根目录加载 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 模拟车辆数据（由于实际爬取可能涉及法律问题，这里使用模拟数据）
const carBrands = ['Toyota', 'Honda', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Ford', 'Chevrolet', 'Nissan', 'Hyundai'];
const carModels = {
  'Toyota': ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Prius'],
  'Honda': ['Accord', 'Civic', 'CR-V', 'Pilot', 'Odyssey'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5', '7 Series'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE'],
  'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A8'],
  'Volkswagen': ['Passat', 'Jetta', 'Tiguan', 'Atlas', 'Golf'],
  'Ford': ['Fusion', 'Escape', 'Explorer', 'F-150', 'Mustang'],
  'Chevrolet': ['Malibu', 'Equinox', 'Tahoe', 'Silverado', 'Camaro'],
  'Nissan': ['Altima', 'Sentra', 'Rogue', 'Pathfinder', 'Maxima'],
  'Hyundai': ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Genesis']
};

const colors = ['白色', '黑色', '银色', '红色', '蓝色', '灰色', '金色'];
const fuelTypes = ['gasoline', 'diesel', 'electric', 'hybrid'];
const transmissions = ['manual', 'automatic'];

// 生成随机车牌号
function generateLicensePlate() {
  const provinces = ['京', '沪', '粤', '浙', '苏', '川', '鲁', '豫'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const letter = letters[Math.floor(Math.random() * letters.length)];
  const num1 = numbers[Math.floor(Math.random() * numbers.length)];
  const num2 = numbers[Math.floor(Math.random() * numbers.length)];
  const num3 = numbers[Math.floor(Math.random() * numbers.length)];
  const num4 = numbers[Math.floor(Math.random() * numbers.length)];
  const num5 = numbers[Math.floor(Math.random() * numbers.length)];
  
  return `${province}${letter}${num1}${num2}${num3}${num4}${num5}`;
}

// 获取车辆图片URL（使用占位图片服务）
async function getCarImage(brand, model) {
  // 使用 Unsplash API 获取车辆图片（免费，无需API key）
  try {
    const query = encodeURIComponent(`${brand} ${model} car`);
    return `https://source.unsplash.com/800x600/?${query}`;
  } catch (error) {
    // 如果失败，返回默认图片
    return `https://via.placeholder.com/800x600?text=${encodeURIComponent(brand + ' ' + model)}`;
  }
}

// 生成车辆描述
function generateDescription(brand, model, year) {
  const descriptions = [
    `这是一辆${year}年的${brand} ${model}，车况良好，保养得当。`,
    `${brand} ${model} ${year}款，性能稳定，适合日常代步和长途旅行。`,
    `精品${brand} ${model}，${year}年上牌，无重大事故，欢迎试驾。`,
    `${year}年${brand} ${model}，配置丰富，驾驶舒适，性价比高。`
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// 创建车辆数据
async function createCarData() {
  const brand = carBrands[Math.floor(Math.random() * carBrands.length)];
  const models = carModels[brand];
  const model = models[Math.floor(Math.random() * models.length)];
  const year = 2018 + Math.floor(Math.random() * 6); // 2018-2023
  const color = colors[Math.floor(Math.random() * colors.length)];
  const licensePlate = generateLicensePlate();
  const mileage = Math.floor(Math.random() * 100000) + 5000; // 5000-105000
  const dailyRate = Math.floor(Math.random() * 500) + 100; // 100-600
  const seats = [4, 5, 7][Math.floor(Math.random() * 3)];
  const fuelType = fuelTypes[Math.floor(Math.random() * fuelTypes.length)];
  const transmission = transmissions[Math.floor(Math.random() * transmissions.length)];
  const imageUrl = await getCarImage(brand, model);
  const description = generateDescription(brand, model, year);
  
  return {
    brand,
    model,
    year,
    color,
    license_plate: licensePlate,
    mileage,
    daily_rate: dailyRate,
    status: 'available',
    seats,
    fuel_type: fuelType,
    transmission,
    image_url: imageUrl,
    description
  };
}

// 主函数
async function main() {
  let connection;
  
  try {
    // 连接数据库
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'car_rental',
    });

    console.log('Connected to database');
    console.log('Starting to scrape car data...');

    // 检查是否已有数据
    const [existing] = await connection.query('SELECT COUNT(*) as count FROM cars');
    if (existing[0].count > 0) {
      console.log(`Found ${existing[0].count} existing cars. Do you want to add more? (This script will add 20 more cars)`);
    }

    // 创建20辆车
    const carsToInsert = [];
    for (let i = 0; i < 20; i++) {
      const carData = await createCarData();
      carsToInsert.push(carData);
      console.log(`Created car data: ${carData.brand} ${carData.model} - ${carData.license_plate}`);
      
      // 添加延迟以避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 批量插入数据库
    console.log('\nInserting cars into database...');
    for (const car of carsToInsert) {
      try {
        await connection.query(
          `INSERT INTO cars (brand, model, year, color, license_plate, mileage, daily_rate, status, seats, fuel_type, transmission, image_url, description)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            car.brand,
            car.model,
            car.year,
            car.color,
            car.license_plate,
            car.mileage,
            car.daily_rate,
            car.status,
            car.seats,
            car.fuel_type,
            car.transmission,
            car.image_url,
            car.description
          ]
        );
        console.log(`✓ Inserted: ${car.brand} ${car.model} (${car.license_plate})`);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⚠ Skipped duplicate: ${car.license_plate}`);
        } else {
          console.error(`✗ Error inserting ${car.license_plate}:`, error.message);
        }
      }
    }

    // 获取最终统计
    const [finalCount] = await connection.query('SELECT COUNT(*) as count FROM cars');
    console.log(`\n✓ Scraping completed! Total cars in database: ${finalCount[0].count}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// 运行爬虫
main();

