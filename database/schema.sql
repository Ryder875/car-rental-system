-- 车辆租赁管理系统数据库结构

CREATE DATABASE IF NOT EXISTS car_rental CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE car_rental;

-- 车辆表
CREATE TABLE IF NOT EXISTS cars (
    id INT PRIMARY KEY AUTO_INCREMENT,
    brand VARCHAR(50) NOT NULL COMMENT '品牌',
    model VARCHAR(100) NOT NULL COMMENT '型号',
    year INT NOT NULL COMMENT '年份',
    color VARCHAR(30) NOT NULL COMMENT '颜色',
    license_plate VARCHAR(20) UNIQUE NOT NULL COMMENT '车牌号',
    mileage INT DEFAULT 0 COMMENT '里程数',
    daily_rate DECIMAL(10, 2) NOT NULL COMMENT '日租金',
    status ENUM('available', 'rented', 'maintenance') DEFAULT 'available' COMMENT '状态',
    seats INT NOT NULL COMMENT '座位数',
    fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL COMMENT '燃料类型',
    transmission ENUM('manual', 'automatic') NOT NULL COMMENT '变速箱类型',
    image_url VARCHAR(500) COMMENT '图片URL',
    description TEXT COMMENT '描述',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_brand (brand),
    INDEX idx_daily_rate (daily_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆信息表';

-- 客户表
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    email VARCHAR(100) UNIQUE NOT NULL COMMENT '邮箱',
    phone VARCHAR(20) NOT NULL COMMENT '电话',
    id_card VARCHAR(20) UNIQUE NOT NULL COMMENT '身份证号',
    address TEXT COMMENT '地址',
    driver_license VARCHAR(30) UNIQUE NOT NULL COMMENT '驾驶证号',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客户信息表';

-- 租赁订单表
CREATE TABLE IF NOT EXISTS rentals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL COMMENT '客户ID',
    car_id INT NOT NULL COMMENT '车辆ID',
    start_date DATE NOT NULL COMMENT '开始日期',
    end_date DATE NOT NULL COMMENT '结束日期',
    daily_rate DECIMAL(10, 2) NOT NULL COMMENT '日租金（下单时的价格）',
    total_days INT NOT NULL COMMENT '租赁天数',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT '总金额',
    status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending' COMMENT '订单状态',
    pickup_location VARCHAR(200) COMMENT '取车地点',
    return_location VARCHAR(200) COMMENT '还车地点',
    notes TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT,
    INDEX idx_customer_id (customer_id),
    INDEX idx_car_id (car_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租赁订单表';

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL COMMENT '订单ID',
    amount DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
    payment_method ENUM('cash', 'credit_card', 'debit_card', 'online') NOT NULL COMMENT '支付方式',
    payment_status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    transaction_id VARCHAR(100) UNIQUE COMMENT '交易ID',
    payment_date TIMESTAMP NULL COMMENT '支付时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE RESTRICT,
    INDEX idx_rental_id (rental_id),
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 车辆维护记录表
CREATE TABLE IF NOT EXISTS maintenance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    car_id INT NOT NULL COMMENT '车辆ID',
    maintenance_type ENUM('regular', 'repair', 'inspection') NOT NULL COMMENT '维护类型',
    description TEXT COMMENT '维护描述',
    cost DECIMAL(10, 2) COMMENT '维护费用',
    maintenance_date DATE NOT NULL COMMENT '维护日期',
    completed_at TIMESTAMP NULL COMMENT '完成时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE RESTRICT,
    INDEX idx_car_id (car_id),
    INDEX idx_maintenance_date (maintenance_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='车辆维护记录表';

