# 车辆租赁管理系统

一个功能完整的全栈车辆租赁管理系统，使用 Node.js + Express + MySQL 作为后端，React + Vite 作为前端。

## 项目特性

- ✅ **完整的数据库设计**：包含车辆、客户、租赁订单、支付记录、维护记录等表
- ✅ **RESTful API**：完整的后端API接口
- ✅ **现代化前端界面**：使用React构建的响应式Web界面
- ✅ **数据爬虫**：自动获取车辆数据和图片
- ✅ **统计分析**：收入统计、车辆利用率等有价值的查询
- ✅ **工程规范**：遵循软件工程和数据库工程最佳实践

## 技术栈

### 后端
- Node.js + Express
- MySQL (关系型数据库)
- mysql2 (数据库驱动)

### 前端
- React 18
- React Router
- Vite
- Axios

### 工具
- 数据爬虫脚本 (Node.js)

## 项目结构

```
CarRental/
├── backend/              # 后端服务
│   ├── config/          # 配置文件
│   │   └── database.js  # 数据库连接配置
│   ├── routes/          # API路由
│   │   ├── cars.js      # 车辆管理
│   │   ├── customers.js # 客户管理
│   │   ├── rentals.js   # 租赁订单
│   │   ├── payments.js   # 支付记录
│   │   └── stats.js      # 统计分析
│   ├── server.js        # 服务器入口
│   └── package.json
├── frontend/            # 前端应用
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── api/         # API客户端
│   │   ├── App.jsx      # 主应用组件
│   │   └── main.jsx     # 入口文件
│   ├── package.json
│   └── vite.config.js
├── database/            # 数据库相关
│   ├── schema.sql       # 数据库结构
│   └── setup.js         # 数据库初始化脚本
├── scraper/             # 数据爬虫
│   ├── scraper.js       # 爬虫脚本
│   └── package.json
├── package.json         # 根目录配置
└── README.md
```

## 快速开始

### 前置要求

- Node.js (v16+)
- MySQL (v5.7+ 或 v8.0+)
- npm 或 yarn

### 安装步骤

1. **克隆项目并安装依赖**

```bash
# 安装所有依赖
npm run install:all
```

2. **配置数据库**

创建 `.env` 文件（参考 `.env.example`）：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=car_rental
PORT=5000
```

3. **初始化数据库**

```bash
npm run setup:db
```

这将创建数据库和所有必要的表。

4. **运行爬虫获取初始数据**

```bash
cd scraper
npm install
npm run scrape
```

这将创建20辆示例车辆数据。

5. **启动后端服务**

```bash
npm run dev:backend
```

后端服务将在 http://localhost:5000 启动

6. **启动前端服务**

在新的终端窗口中：

```bash
npm run dev:frontend
```

前端应用将在 http://localhost:3000 启动

## 数据库设计

### 核心表结构

1. **cars (车辆表)**
   - 存储车辆基本信息：品牌、型号、年份、颜色、车牌号等
   - 包含状态管理：可用、已租赁、维护中

2. **customers (客户表)**
   - 存储客户信息：姓名、邮箱、电话、身份证、驾驶证等

3. **rentals (租赁订单表)**
   - 记录租赁订单：客户、车辆、日期、金额等
   - 支持订单状态管理

4. **payments (支付记录表)**
   - 记录支付信息：订单、金额、支付方式、状态等

5. **maintenance (维护记录表)**
   - 记录车辆维护信息

### 数据库特性

- 使用外键约束保证数据完整性
- 合理的索引设计提升查询性能
- 支持事务处理保证数据一致性

## API 接口

### 车辆管理
- `GET /api/cars` - 获取车辆列表（支持分页、筛选）
- `GET /api/cars/:id` - 获取车辆详情
- `GET /api/cars/meta/brands` - 获取所有品牌

### 客户管理
- `GET /api/customers` - 获取客户列表
- `GET /api/customers/:id` - 获取客户详情
- `POST /api/customers` - 创建客户
- `PUT /api/customers/:id` - 更新客户信息

### 租赁订单
- `GET /api/rentals` - 获取订单列表
- `GET /api/rentals/:id` - 获取订单详情
- `POST /api/rentals` - 创建订单
- `PATCH /api/rentals/:id/status` - 更新订单状态

### 支付记录
- `GET /api/payments` - 获取支付记录
- `GET /api/payments/rental/:rental_id` - 获取订单的支付记录
- `POST /api/payments` - 创建支付记录

### 统计分析
- `GET /api/stats/dashboard` - 获取仪表板统计数据
- `GET /api/stats/revenue` - 获取收入统计
- `GET /api/stats/car-utilization` - 获取车辆利用率统计

## 功能特性

### 1. 车辆管理
- 浏览所有车辆
- 按品牌、状态、价格筛选
- 搜索车辆
- 查看车辆详情

### 2. 客户管理
- 查看客户列表
- 搜索客户
- 创建新客户

### 3. 租赁订单
- 创建租赁订单
- 查看订单列表和详情
- 更新订单状态
- 日期冲突检测

### 4. 支付管理
- 记录支付信息
- 查看支付历史
- 支持多种支付方式

### 5. 统计分析
- 仪表板概览
- 收入趋势分析
- 车辆利用率统计
- 热门品牌分析

## 有价值的查询示例

### 1. 收入统计查询
```sql
-- 按月统计收入
SELECT DATE_FORMAT(payment_date, '%Y-%m') as period, 
       SUM(amount) as revenue, 
       COUNT(*) as transaction_count
FROM payments
WHERE payment_status = 'completed'
GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
ORDER BY period ASC;
```

### 2. 车辆利用率查询
```sql
-- 统计每辆车的租赁次数和总收入
SELECT car.id, car.brand, car.model,
       COUNT(r.id) as rental_count,
       SUM(r.total_days) as total_rental_days,
       SUM(r.total_amount) as total_revenue
FROM cars car
LEFT JOIN rentals r ON car.id = r.car_id AND r.status = 'completed'
GROUP BY car.id
ORDER BY rental_count DESC;
```

### 3. 热门品牌分析
```sql
-- 统计最受欢迎的车辆品牌
SELECT car.brand, COUNT(*) as rental_count
FROM rentals r
JOIN cars car ON r.car_id = car.id
GROUP BY car.brand
ORDER BY rental_count DESC
LIMIT 5;
```

## 开发说明

### 添加新功能

1. **添加新的API路由**
   - 在 `backend/routes/` 创建新的路由文件
   - 在 `backend/server.js` 中注册路由

2. **添加新的前端页面**
   - 在 `frontend/src/pages/` 创建新页面组件
   - 在 `frontend/src/App.jsx` 中添加路由

3. **数据库迁移**
   - 修改 `database/schema.sql`
   - 重新运行 `npm run setup:db`（注意：会清空现有数据）

## 注意事项

1. **环境变量**：确保正确配置 `.env` 文件
2. **数据库权限**：确保MySQL用户有创建数据库的权限
3. **端口冲突**：如果5000或3000端口被占用，请修改配置
4. **数据爬虫**：爬虫脚本使用模拟数据，实际项目中可以替换为真实的爬虫逻辑

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 作者

车辆租赁管理系统开发团队

---

## GitHub 仓库

如果这个项目对你有帮助，欢迎给个 ⭐ Star！

---

如有问题或建议，欢迎提交Issue或Pull Request！

