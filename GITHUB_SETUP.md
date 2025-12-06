# GitHub 上传指南

## 第一步：检查项目

确保以下文件已正确配置：
- ✅ `.gitignore` - 已配置，会忽略敏感文件和依赖
- ✅ `README.md` - 项目文档
- ✅ `env.example.txt` - 环境变量示例（不会上传真实的 `.env` 文件）

## 第二步：配置 Git 用户信息（首次使用需要）

如果是第一次使用 Git，需要先配置用户信息：

```bash
# 设置你的用户名（替换为你的名字或 GitHub 用户名）
git config --global user.name "Your Name"

# 设置你的邮箱（替换为你的邮箱，建议使用 GitHub 邮箱）
git config --global user.email "your.email@example.com"
```

**注意**：这些信息会显示在提交记录中，建议使用真实的或 GitHub 邮箱。

## 第三步：初始化 Git 仓库

在项目根目录（`D:\CarRental`）打开终端，执行：

```bash
# 初始化 Git 仓库
git init

# 添加所有文件到暂存区
git add .

# 创建初始提交
git commit -m "Initial commit: 车辆租赁管理系统"
```

**关于警告**：如果看到 `LF will be replaced by CRLF` 的警告，这是正常的，可以忽略。这是 Windows 系统的行尾符转换提示。

## 第三步：在 GitHub 上创建仓库

1. 登录 GitHub (https://github.com)
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `car-rental-system` (或你喜欢的名字)
   - **Description**: `车辆租赁管理系统 - 全栈应用 (Node.js + React + MySQL)`
   - **Visibility**: 选择 **Public** (公开)
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
4. 点击 "Create repository"

## 第四步：连接本地仓库到 GitHub

GitHub 创建仓库后会显示连接命令，类似这样：

```bash
# 添加远程仓库（将 YOUR_USERNAME 替换为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/car-rental-system.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:YOUR_USERNAME/car-rental-system.git

# 推送代码到 GitHub
git branch -M main
git push -u origin main
```

## 第五步：验证上传

1. 刷新 GitHub 仓库页面
2. 确认所有文件都已上传
3. 确认 `.env` 文件**没有**被上传（这是正确的，因为它在 `.gitignore` 中）

## 重要提示

### ✅ 会被上传的文件
- 所有源代码文件
- 配置文件（package.json, vite.config.js 等）
- 文档文件（README.md, QUICKSTART.md）
- 数据库结构文件（schema.sql）
- 环境变量示例（env.example.txt）

### ❌ 不会被上传的文件（已在 .gitignore 中）
- `.env` - 包含数据库密码等敏感信息
- `node_modules/` - 依赖包（太大，不需要上传）
- `package-lock.json` - 锁定文件（可选，但通常不推荐上传）
- 日志文件
- IDE 配置文件

## 可选：添加项目徽章和截图

上传后，你可以：
1. 在 README.md 中添加项目截图
2. 添加 GitHub 徽章（如 License, Node version 等）
3. 添加 Topics（标签）：`nodejs`, `react`, `mysql`, `fullstack`, `car-rental`

## 后续更新

如果以后需要更新代码：

```bash
# 查看更改
git status

# 添加更改的文件
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到 GitHub
git push
```

## 常见问题

### Q: 如果我不小心上传了 .env 文件怎么办？
A: 
1. 立即修改数据库密码
2. 从 Git 历史中删除：`git filter-branch --force --index-filter "git rm --cached --ignore-unmatch .env" --prune-empty --tag-name-filter cat -- --all`
3. 强制推送：`git push origin --force --all`

### Q: 如何添加项目截图？
A: 在项目根目录创建 `screenshots/` 文件夹，上传截图，然后在 README.md 中引用。

### Q: 如何添加 License？
A: 创建 `LICENSE` 文件，GitHub 会自动识别。

---

**祝你上传顺利！** 🚀

