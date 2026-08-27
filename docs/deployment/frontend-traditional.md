# 传统前端部署

## 部署信息

- 服务器：121.196.245.95
- 域名：tbtparent.me
- 部署目录：/opt/frontend
- 运行端口：7000
- 运行模式：standalone (Node.js服务器)

## 快速部署

### 1. 本地构建打包

```bash
# 构建
npm run build

# 打包（自动验证文件完整性）
cd deploy
./deploy.sh
```

生成：`deploy/frontend-deploy.tar.gz` (约 23MB)

### 2. 上传到服务器

```bash
# 上传前端包
scp deploy/frontend-deploy.tar.gz root@121.196.245.95:/tmp/

# 上传 Nginx 配置（首次部署）
scp deploy/nginx.conf root@121.196.245.95:/tmp/owl.conf
```

### 3. 服务器部署

```bash
ssh root@121.196.245.95

# 停止旧服务
pm2 stop owl-frontend || true

# 备份并部署新版本
[ -d /opt/frontend ] && mv /opt/frontend /opt/frontend_backup_$(date +%Y%m%d_%H%M%S)
mkdir -p /opt/frontend/owl-frontend
cd /opt/frontend/owl-frontend
tar -xzf /tmp/frontend-deploy.tar.gz

# 清理 macOS 隐藏文件（如果存在）
find . -name "._*" -type f -delete

# 启动服务
npm install -g pm2  # 如果未安装
pm2 start ecosystem.config.js
pm2 save

# 查看状态
pm2 logs owl-frontend --lines 20
```

### 4. 配置 Nginx（首次部署）

```bash
# 安装 Nginx
yum install -y nginx  # CentOS
# 或 apt install -y nginx  # Ubuntu

# 部署配置
mv /tmp/owl.conf /etc/nginx/conf.d/owl.conf
nginx -t
systemctl restart nginx
systemctl enable nginx
```

### 5. 验证

```bash
# 检查服务
pm2 status
systemctl status nginx

# 测试访问
curl http://localhost:7000/owl
curl http://tbtparent.me/owl
```

浏览器访问：`http://tbtparent.me/owl`

---

## Nginx 配置说明

项目中的 `nginx.conf` 包含完整配置，关键点：

```nginx
server {
    listen 80;
    server_name tbtparent.me;

    # 后端 API（必须在前端规则之前）
    location /owl/api {
        proxy_pass http://localhost:5002/api;
    }

    # 前端应用
    location /owl {
        proxy_pass http://localhost:7000;
    }
}
```

**路径转发**：
- 前端：`/owl/api/xxx` → Nginx → 后端 `/api/xxx`
- 无需修改后端路径，Nginx 自动处理

---

## 环境变量

生产环境配置（`.env.production`）：

```bash
# API 地址（相对路径，通过 Nginx 转发）
NEXT_PUBLIC_API_URL=/owl/api

# 应用名称
NEXT_PUBLIC_APP_NAME=owl管理系统

# 环境标识
NODE_ENV=production
```

**无需修改**：打包时自动使用此配置

---

## 常用命令

```bash
# PM2 管理
pm2 list
pm2 logs owl-frontend
pm2 restart owl-frontend
pm2 stop owl-frontend

# Nginx 管理
nginx -t                    # 测试配置
systemctl restart nginx     # 重启
nginx -s reload            # 重新加载
tail -f /var/log/nginx/owl_error.log

# 调试
netstat -tlnp | grep 7000
curl http://localhost:7000/owl
pm2 logs owl-frontend --err
```

---

## 故障排查

### 错误：Could not find a production build

**原因**：缺少 `.next/BUILD_ID` 或 `.next/static/`

**解决**：使用 `deploy.sh` 重新打包，会自动验证

### 前端页面无法访问

```bash
# 1. 检查前端服务
pm2 status | grep owl-frontend
pm2 logs owl-frontend

# 2. 检查端口
netstat -tlnp | grep 7000

# 3. 测试本地访问
curl http://localhost:7000/owl

# 4. 检查 Nginx
nginx -t
systemctl status nginx
```

### API 请求失败

```bash
# 1. 检查后端服务
curl http://localhost:5002/api/health

# 2. 检查 Nginx 转发
curl http://localhost/owl/api/health

# 3. 查看日志
tail -f /var/log/nginx/owl_error.log
pm2 logs owl-frontend
```

---

## 更新部署

```bash
# 本地
npm run build
cd deploy && ./deploy.sh
scp frontend-deploy.tar.gz root@121.196.245.95:/tmp/

# 服务器
ssh root@121.196.245.95
pm2 stop owl-frontend
cd /opt/frontend
tar -xzf /tmp/frontend-deploy.tar.gz
pm2 restart owl-frontend
pm2 logs owl-frontend
```

**注意**：
- ✅ 无需重启 Nginx
- ✅ 无需重新配置环境变量
- ✅ 只需更新代码并重启 PM2

---

## 部署检查清单

- [ ] 本地构建成功：`npm run build`
- [ ] 打包成功：`cd deploy && ./deploy.sh`
- [ ] 上传成功：`frontend-deploy.tar.gz`
- [ ] 前端服务运行：`pm2 status`
- [ ] Nginx 配置正确：`nginx -t`
- [ ] 端口监听：`netstat -tlnp | grep 7000`
- [ ] 浏览器可访问：`http://tbtparent.me/owl`
- [ ] API 调用正常
- [ ] 登录功能正常

---

完成！
