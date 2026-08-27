# 系统初始化

本文档说明如何从零开始完成 Owl Platform 的安装与初始化。

---

## 前置依赖

### 开发环境

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | 18+ | 运行后端服务 |
| PostgreSQL | 12+ | 主数据库 |
| Redis | 6+ | Session 缓存 |
| MinIO | 最新稳定版 | 文件对象存储 |

### 生产环境（额外）

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Nginx | 1.20+ | 反向代理与静态文件服务 |

### 快速安装依赖

建议使用 [ant-eyes](https://www.npmjs.com/package/ant-eyes) 运维工具包快速安装所有依赖：

```bash
npm install -g ant-eyes
ant-eyes install  # 交互式安装 PostgreSQL、Redis、MinIO 等
```

或手动安装：

**macOS**（使用 Homebrew）
```bash
brew install postgresql redis minio
```

**Ubuntu/Debian**
```bash
sudo apt-get install postgresql redis-server
# MinIO 需从官网下载：https://dl.min.io/server/minio/release/linux-amd64/minio
```

---

## 快速启动

### 1. 克隆项目

```bash
git clone https://github.com/JojoShine/owl owl_platform
cd owl_platform
```

### 2. 安装依赖

```bash
# 后端
cd backend
npm install

# 前端
cd ../frontend
npm install
```

### 3. 配置环境变量

本项目使用分离的环境配置文件：
- `backend/.env` 和 `frontend/.env` — 本地开发环境（默认）
- `backend/.env.production` 和 `frontend/.env.production` — 生产环境

#### 本地开发环境配置

**后端配置**

```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`：

```bash
# 数据库
DB_HOST=localhost
DB_PORT=5432
DB_NAME=owl
DB_USER=postgres
DB_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT
JWT_SECRET=your_random_secret_key_here
JWT_REFRESH_SECRET=your_random_refresh_key_here

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=owl
MINIO_USE_SSL=false

# 短信（可选）
SMS_ACCESS_KEY_ID=
SMS_ACCESS_KEY_SECRET=
SMS_SIGN_NAME=
SMS_TEMPLATE_CODE=

# 邮件（可选）
SMTP_HOST=
SMTP_PORT=465
SMTP_USER=
SMTP_PASSWORD=

# 应用配置
APP_ENV=development
APP_DEBUG=true
```

**前端配置**

```bash
cd frontend
cp .env.example .env
```

编辑 `frontend/.env`：

```bash
# API URL - 指向本地后端
NEXT_PUBLIC_API_URL=http://localhost:3001/api/system

# Base Path - 本地开发为空
NEXT_PUBLIC_BASE_PATH=

# 应用名称
NEXT_PUBLIC_APP_NAME=Owl Platform 管理后台
```

#### 生产环境配置

**后端配置**

```bash
cd backend
cp .env.example .env.production
```

编辑 `backend/.env.production`：

```bash
# 应用环境
APP_ENV=production
APP_DEBUG=false
NODE_ENV=production

# 数据库 - 生产环境
DB_HOST=your_production_db_host
DB_PORT=5432
DB_NAME=owl_prod
DB_USER=owl_db_user
DB_PASSWORD=strong_database_password_here

# 首次建库时使用，至少 12 位；不会输出到日志
INITIAL_ADMIN_PASSWORD=replace_with_a_strong_password
# 首次建库确认值，必须与 DB_NAME 完全一致
DB_BOOTSTRAP_CONFIRM=owl_prod

# Redis - 生产环境
REDIS_HOST=your_production_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password_here

# JWT - 使用强随机密钥
JWT_SECRET=<生成的32位随机十六进制字符串>
JWT_REFRESH_SECRET=<生成的32位随机十六进制字符串>

# MinIO - 生产环境
MINIO_ENDPOINT=your_minio_server_domain
MINIO_PORT=9000
MINIO_ACCESS_KEY=production_access_key
MINIO_SECRET_KEY=production_secret_key
MINIO_BUCKET=owl-prod
MINIO_USE_SSL=true

# 短信服务（如启用）
SMS_ACCESS_KEY_ID=your_sms_key_id
SMS_ACCESS_KEY_SECRET=your_sms_key_secret
SMS_SIGN_NAME=your_sms_sign_name
SMS_TEMPLATE_CODE=your_sms_template_code

# 邮件服务（如启用）
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_USER=your_email@example.com
SMTP_PASSWORD=your_smtp_password
```

**前端配置**

```bash
cd frontend
cp .env.example .env.production
```

编辑 `frontend/.env.production`：

```bash
# API URL - 使用相对路径，通过 nginx 转发
NEXT_PUBLIC_API_URL=/owl/api

# Base Path - 生产环境部署路径前缀
NEXT_PUBLIC_BASE_PATH=/owl

# 应用名称
NEXT_PUBLIC_APP_NAME=owl系统管理后台
```

**生成强随机密钥**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 初始化数据库

**首次初始化（仅限全新空库）**

```bash
cd backend

# 开发环境全新空库
npm run db:bootstrap

# 生产环境全新空库：必须明确环境、管理员密码和目标库名
NODE_ENV=production \
INITIAL_ADMIN_PASSWORD='请替换为至少12位强密码' \
DB_BOOTSTRAP_CONFIRM='owl_prod' \
npm run db:bootstrap
```

**更新现有数据库**

已有数据库升级只执行新增 Migration，不会重复导入初始化数据：

```bash
# 本地开发数据库升级
npm run db:deploy

# 生产数据库升级
NODE_ENV=production npm run db:deploy
```

> **注意**：首次建库和版本升级是两条独立流程。已投入使用的数据库只能新增 Migration，不能修改 `001-initial-schema` 或重新执行 Seeder。

**开发数据库重置**

```bash
# 仅允许 development/test，确认值必须与 DB_NAME 完全一致
DB_RESET_CONFIRM='admin_platform' npm run db:reset:dev
```

生产环境会强制拒绝重置命令。

### 5. 启动服务

**手动启动**（如不使用一键脚本）

```bash
# 后端（新终端）
cd backend
npm run dev

# 前端（新终端）
cd frontend
npm run dev
```

访问 http://localhost:3000，使用初始化输出的账号密码登录。

---

## 数据库命令说明

| 命令 | 说明 | 场景 |
|------|------|------|
| `npm run db:bootstrap` | 建立全新空库并导入初始化数据 | 仅首次安装 |
| `npm run db:init` | `db:bootstrap` 的兼容别名 | 仅首次安装 |
| `npm run db:deploy` | 只执行未运行的 Migration | 日常发布、生产升级 |
| `npm run db:migrate` | `db:deploy` 的兼容别名 | 日常发布、生产升级 |
| `npm run db:status` | 查看 Migration 状态 | 发布前检查 |
| `npm run db:reset:dev` | 删除开发库 public schema 后重新初始化 | 仅开发/测试环境 |

**重要提示**：
- 🔴 **生产环境**：只允许首次使用 `db:bootstrap`，后续一律使用 `db:deploy`
- 🟡 **结构或基础权限变化**：新增独立 Migration，禁止修改已经执行过的文件
- 🟢 **开发环境需要清库**：明确提供 `DB_RESET_CONFIRM` 后使用 `db:reset:dev`

### Docker 部署建议

前后端容器化后，数据库迁移应作为一次性 Job/初始化容器运行：先执行 `npm run db:deploy`，成功后再启动后端容器。不要在每个后端副本启动时自动迁移，避免多副本并发和应用启动循环。首次安装单独执行一次 `db:bootstrap`。

---

## 生产环境部署

### 前端构建与部署

**构建打包**

```bash
cd frontend
npm run build  # 生成 .next 产物
```

**自动化部署**

```bash
# 执行部署脚本，自动打包并生成压缩包
./deploy.sh

# 脚本会输出压缩包路径，用于上传到生产服务器
# 示例输出：deployment/frontend-20240115-143022.tar.gz
```

**部署到服务器**

```bash
# 1. 上传压缩包到生产服务器
scp deployment/frontend-*.tar.gz user@production-server:/opt/owl/

# 2. 服务器端解压和启动
cd /opt/owl
tar -xzf frontend-*.tar.gz
npm start
# 或使用 PM2
pm2 start npm --name "owl-frontend" -- start
```

### 后端构建与部署

**自动化部署**

```bash
cd backend/deploy
./deploy.sh

# 脚本会构建 Node.js 应用并生成可部署的产物
```

**使用 PM2 在生产环境启动**

```bash
# 安装 PM2（全局）
npm install -g pm2

# 启动后端应用
cd /opt/owl/backend
pm2 start ecosystem.config.js --env production

# 查看运行状态
pm2 status
pm2 logs owl-backend

# 配置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理配置

项目提供两份 Nginx 配置示例供选择：

#### 方案一：HTTP 80 端口（开发/测试环境）

创建 `/etc/nginx/sites-available/owl-http.conf`：

```bash
# 使用项目提供的示例配置
sudo cp nginx/owl-http.conf.example /etc/nginx/sites-available/owl-http.conf
```

编辑配置，修改 `server_name`：

```bash
sudo vi /etc/nginx/sites-available/owl-http.conf
```

启用配置：

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/owl-http.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# macOS
sudo nginx -t
sudo nginx -s reload
```

#### 方案二：HTTPS + SSL（生产环境）

创建 `/etc/nginx/sites-available/owl.conf`：

```bash
# 使用项目提供的示例配置
sudo cp nginx/owl.conf.example /etc/nginx/sites-available/owl.conf
```

编辑配置，修改以下内容：

```bash
sudo vi /etc/nginx/sites-available/owl.conf
```

**需要修改的内容**

1. 修改 `server_name`（你的域名）：
```nginx
server_name your-domain.com www.your-domain.com;
```

2. 修改 SSL 证书路径：
```nginx
ssl_certificate /etc/ssl/certs/your-domain.crt;
ssl_certificate_key /etc/ssl/private/your-domain.key;
```

3. 修改日志路径（可选）：
```nginx
access_log /var/log/nginx/owl-access.log;
error_log /var/log/nginx/owl-error.log;
```

启用配置：

```bash
# Ubuntu/Debian
sudo ln -s /etc/nginx/sites-available/owl.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# macOS
sudo nginx -t
sudo nginx -s reload
```

### 完整 Nginx 配置说明

两份配置都包含以下核心功能：

- **API 后端代理**（`/api/*`）— 转发到后端服务 3001 端口
- **WebSocket 支持**（`/socket.io`）— 实时通知需要
- **前端代理**（`/`）— 转发到前端服务 3000 端口
- **请求体大小限制** — 最大 100M（支持大文件上传）
- **超时配置** — 连接/发送/读取各 60 秒

HTTPS 方案额外提供：
- HTTP 自动重定向至 HTTPS
- TLS 1.2+ 加密
- 静态资源缓存
- 安全加固

### 生产环境安全建议

- **修改默认密码**：登录后立即修改管理员密码
- **强化 JWT 密钥**：使用 32 位随机十六进制字符串，永不泄露
- **数据库安全**：
  - 使用强密码
  - 限制数据库访问 IP
  - 启用 SSL 连接
- **Redis 安全**：
  - 设置访问密码
  - 限制访问 IP
  - 不使用默认端口
- **MinIO 安全**：
  - 修改默认 access key / secret key
  - 启用 HTTPS
  - 限制访问 IP
- **Nginx 安全**：
  - 启用 HTTPS 和 TLS 1.2+
  - 配置速率限制（可选）
  - 隐藏服务器版本号
  - 定期检查和更新

---

## 常见问题

**数据库连接失败**

检查 `.env` 中 DB 配置是否正确，并确认 PostgreSQL 服务已启动：
```bash
sudo systemctl status postgresql
```

**Redis 连接失败**

```bash
redis-cli ping  # 应返回 PONG
```

**MinIO bucket 不存在**

登录 MinIO 控制台（http://localhost:9001），手动创建名为 `owl` 的 bucket。

**端口冲突**

```bash
lsof -i :3000  # 查看占用进程
kill -9 <PID>
```
