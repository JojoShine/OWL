# 传统后端部署

## 部署信息

- 服务器：121.196.245.95
- 域名：tbtparent.me
- 部署目录：/opt/backend
- 运行端口：5002
- API 路径：`/api`（Nginx 转发处理 `/owl/api` → `/api`）

## 快速部署

### 1. 本地打包

```bash
# 执行打包脚本
cd deploy
./deploy.sh
```

生成：`deploy/owl-backend-v1.0.0-xxxxxxxx.tar.gz`

### 2. 上传到服务器

```bash
scp deploy/owl-backend-v*.tar.gz root@121.196.245.95:/tmp/
```

### 3. 服务器部署

```bash
ssh root@121.196.245.95

# 停止旧服务
pm2 stop owl-backend || true

# 备份并部署新版本
[ -d /opt/backend ] && mv /opt/backend /opt/backend_backup_$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/backend
cd /opt/backend
tar -xzf /tmp/owl-backend-v*.tar.gz

# 清理 macOS 隐藏文件（如果存在）
find . -name "._*" -type f -delete

# 安装锁定版本的生产依赖
npm ci --omit=dev

# 配置环境变量（首次部署）
cp .env.production.example .env
vi .env  # 修改数据库等配置
```

### 4. 配置环境变量

编辑 `.env` 文件，修改以下关键配置：

```bash
# 服务配置
NODE_ENV=production
PORT=5002

# 数据库（⚠️ 必须修改）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=common_management
DB_USER=admin
DB_PASSWORD=your_db_password

# Redis
REDIS_HOST=121.196.245.95
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# JWT 密钥（⚠️ 必须修改为随机字符串）
JWT_SECRET=your_random_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

# MinIO
MINIO_ENDPOINT=121.196.245.95
MINIO_PORT=9000
MINIO_ACCESS_KEY=your_minio_key
MINIO_SECRET_KEY=your_minio_secret
MINIO_BUCKET=common-management
```

### 5. 初始化数据库

```bash
# 全新空库（仅首次部署）
NODE_ENV=production \
INITIAL_ADMIN_PASSWORD='请替换为至少12位强密码' \
DB_BOOTSTRAP_CONFIRM='实际数据库名' \
npm run db:bootstrap

# 已有数据库升级（后续发布）
NODE_ENV=production npm run db:deploy
```

### 6. 启动服务

```bash
# 安装 PM2（如果未安装）
npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js --env production
pm2 save

# 设置开机自启
pm2 startup

# 查看日志
pm2 logs owl-backend --lines 20
```

### 7. 验证

```bash
# 检查服务
pm2 status

# 测试接口
curl http://localhost:5002/api/health
```

期望返回：
```json
{
  "success": true,
  "data": { "status": "ok" },
  "message": "Server is running"
}
```

---

## 数据库管理

### 创建数据库（首次部署）

```bash
# 连接 PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE common_management;

# 创建用户
CREATE USER admin WITH PASSWORD 'your_password';

# 授权
GRANT ALL PRIVILEGES ON DATABASE common_management TO admin;

# 退出
\q
```

### 迁移命令

```bash
# 查看迁移状态
NODE_ENV=production npm run db:status

# 执行未运行的迁移，不重复导入初始化数据
NODE_ENV=production npm run db:deploy

# 首次初始化只能针对空库执行
NODE_ENV=production npm run db:bootstrap
```

---

## 常用命令

```bash
# PM2 管理
pm2 list
pm2 logs owl-backend
pm2 restart owl-backend
pm2 stop owl-backend
pm2 monit

# 数据库
npm run db:status       # 查看迁移状态
npm run db:deploy       # 升级已有数据库
npm run db:bootstrap    # 首次初始化空库

# 日志
pm2 logs owl-backend
tail -f /opt/backend/logs/combined.log
tail -f /opt/backend/logs/error.log
```

---

## 故障排查

### 服务无法启动

```bash
# 查看错误日志
pm2 logs owl-backend --err
tail -f /opt/backend/logs/error.log

# 检查端口占用
netstat -tlnp | grep 5002

# 检查配置
cat .env | grep -E "DB_|PORT|REDIS"
```

**常见原因**：
- 数据库连接失败：检查 `.env` 中的数据库配置
- Redis 连接失败：检查 Redis 是否运行
- 端口被占用：`netstat -tlnp | grep 5002`

### 数据库迁移失败

```bash
# 检查数据库连接
psql -h localhost -U admin -d common_management

# 授予权限
psql -U postgres -d common_management
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO admin;

# 查看迁移状态
NODE_ENV=production npm run db:status

# 如果出现 "._" 开头的文件导致的语法错误，清理这些 macOS 隐藏文件
find /opt/backend/migrations -name "._*" -type f -delete
find /opt/backend/seeders -name "._*" -type f -delete
```

**常见错误**：
- `SyntaxError: Invalid or unexpected token` on `._xxxx.js`
  - **原因**：macOS 创建的隐藏文件被误认为是迁移文件
  - **解决**：运行 `find . -name "._*" -type f -delete` 清理隐藏文件

### API 请求 502

```bash
# 1. 检查后端服务
pm2 status

# 2. 测试本地接口
curl http://localhost:5002/api/health

# 3. 检查 Nginx
systemctl status nginx
tail -f /var/log/nginx/owl_error.log

# 4. 查看后端日志
pm2 logs owl-backend
```

---

## 更新部署

```bash
# 本地
cd deploy
./deploy.sh
scp owl-backend-v*.tar.gz root@121.196.245.95:/tmp/

# 服务器
ssh root@121.196.245.95
pm2 stop owl-backend
cd /opt && mv backend backend_old && mkdir backend && cd backend
tar -xzf /tmp/owl-backend-v*.tar.gz
npm ci --omit=dev
NODE_ENV=production npm run db:deploy
pm2 restart owl-backend
pm2 logs owl-backend
```

---

## 部署检查清单

- [ ] 本地打包成功：`cd deploy && ./deploy.sh`
- [ ] 上传成功：`owl-backend-v*.tar.gz`
- [ ] 依赖安装成功：`npm ci --omit=dev`
- [ ] `.env` 配置正确
- [ ] 数据库已创建
- [ ] 首次安装已执行 `db:bootstrap`，升级已执行 `db:deploy`
- [ ] PM2 进程运行：`pm2 status`
- [ ] 端口监听：`netstat -tlnp | grep 5002`
- [ ] 健康检查通过：`curl http://localhost:5002/api/health`
- [ ] 前端可调用 API

---

完成！
