# 快速启动指南

## 第一步：安装依赖

```bash
npm run install:all
```

这将安装根目录、后端和前端的所有依赖。

## 第二步：配置数据库

1. 确保MySQL服务正在运行

2. 复制 `env.example.txt` 为 `.env` 并修改数据库配置：

```bash
# Windows PowerShell
Copy-Item env.example.txt .env
```

3. 编辑 `.env` 文件，设置你的MySQL用户名和密码：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=car_rental
PORT=5000
```

**重要**：将 `your_mysql_password` 替换为你的实际MySQL密码。

## 第三步：初始化数据库

```bash
npm run setup:db
```

这将创建 `car_rental` 数据库和所有必要的表：
- cars (车辆表)
- customers (客户表)
- rentals (租赁订单表)
- payments (支付记录表)
- maintenance (维护记录表)

## 第四步：运行爬虫获取初始数据

```bash
cd scraper
npm install
npm run scrape
```

这将创建20辆示例车辆数据（包括品牌、型号、价格等信息）。

**注意**：如果图片加载失败，这是正常的（使用了外部图片服务），系统会自动显示占位图。

## 第五步：启动应用

### 启动后端（终端1）

在项目根目录运行：

```bash
npm run dev:backend
```

后端将在 http://localhost:5000 运行

你应该看到：
- `Server is running on port 5000`
- `Database connected successfully`

### 启动前端（终端2）

**重要**：需要打开一个新的终端窗口！

在项目根目录运行：

```bash
npm run dev:frontend
```

前端将在 http://localhost:3000 运行

启动后，Vite 会自动显示本地访问地址。

## 访问应用

打开浏览器访问：**http://localhost:3000**

## 功能说明

### 1. 仪表板
- 查看总车辆数、可用车辆、已租赁车辆
- 查看客户统计
- 查看收入统计和趋势
- 查看热门品牌

### 2. 车辆管理
- 浏览所有车辆
- 按品牌、状态、价格筛选
- 搜索车辆
- 查看车辆详情

### 3. 客户管理
- 查看客户列表
- 搜索客户
- **在创建订单时可以添加新客户**

### 4. 租赁订单
- 创建租赁订单
- **创建订单时可以添加新客户**
- 查看订单列表和详情
- 更新订单状态
- 记录支付信息

### 5. 统计分析
- 收入统计（按天/周/月/年）
- 车辆利用率统计
- 热门品牌分析

## 常见问题

### 1. 数据库连接失败

**错误信息**：`Access denied for user 'root'@'localhost'`

**解决方法**：
- 检查 `.env` 文件中的数据库配置是否正确
- 确保MySQL服务正在运行
- 验证MySQL用户名和密码是否正确
- 确保MySQL用户有创建数据库的权限

### 2. 端口被占用

**错误信息**：`Port 5000 is already in use` 或 `Port 3000 is already in use`

**解决方法**：
- 修改 `.env` 文件中的 `PORT` 值（后端）
- 修改 `frontend/vite.config.js` 中的端口配置（前端）

### 3. 爬虫失败

**可能原因**：
- 网络连接问题
- 数据库未初始化
- 数据库连接配置错误

**解决方法**：
- 确保已完成"第三步：初始化数据库"
- 检查 `.env` 文件配置
- 如果图片加载失败，这是正常的，系统会自动显示占位图

### 4. 前端无法连接后端

**错误信息**：`Failed to fetch` 或 `Network Error`

**解决方法**：
- 确保后端服务正在运行（终端1）
- 检查后端是否显示 `Database connected successfully`
- 访问 http://localhost:5000/api/health 检查后端是否正常
- 检查 `frontend/src/api/client.js` 中的API URL配置

### 5. 找不到客户

**解决方法**：
- 在创建订单页面，点击"**+ 添加新客户**"按钮
- 填写客户信息（姓名、邮箱、电话、身份证、驾驶证等）
- 创建成功后会自动选择新客户

### 6. 车辆图片无法显示

**解决方法**：
- 系统已自动处理，如果原始图片无法加载，会显示占位图
- 占位图会显示车辆的品牌和型号信息

### 7. 终端无法输入命令

**原因**：nodemon 正在运行，终端被占用

**解决方法**：
- **不要停止后端服务**
- 打开一个新的终端窗口来运行前端
- 在 VS Code 中：终端 → 新建终端
- 或使用新的 PowerShell/CMD 窗口

## 下一步操作

1. **创建测试客户**
   - 进入"租赁订单"页面
   - 点击"创建新订单"
   - 点击"+ 添加新客户"
   - 填写客户信息并创建

2. **创建租赁订单**
   - 选择客户和车辆
   - 选择租赁日期
   - 查看费用计算
   - 提交订单

3. **查看统计报表**
   - 进入"统计分析"页面
   - 查看收入趋势
   - 查看车辆利用率

4. **管理订单**
   - 查看订单列表
   - 更新订单状态
   - 记录支付信息

## 技术栈

- **后端**：Node.js + Express + MySQL
- **前端**：React + Vite + React Router
- **数据库**：MySQL (关系型数据库)
- **开发工具**：nodemon (后端热重载), Vite (前端热重载)

## 项目结构

```
CarRental/
├── backend/          # 后端服务
│   ├── config/      # 配置文件
│   ├── routes/      # API路由
│   └── server.js    # 服务器入口
├── frontend/        # 前端应用
│   └── src/         # 源代码
├── database/        # 数据库相关
│   ├── schema.sql   # 数据库结构
│   └── setup.js     # 初始化脚本
├── scraper/         # 数据爬虫
└── .env             # 环境变量配置（需要创建）
```

## 获取帮助

如果遇到问题：
1. 检查本文档的"常见问题"部分
2. 查看 `README.md` 获取更详细的文档
3. 检查终端错误信息
4. 确保所有步骤都正确完成

---

**享受使用车辆租赁管理系统！** 🚗
