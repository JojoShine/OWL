# 本地快速启动

目标：拿到仓库后，在本机启动 NestJS 后端和 Vite 前端，登录真实后台并开始修改代码。前后端都通过 npm 从源码运行，支持热更新。

Docker 在本指南中仅用于可选的 PostgreSQL、MinIO 测试依赖。应用镜像构建、Docker Hub 发布、服务器 Compose 和 Nginx 部署请看 [Docker 部署指南](docker.md)，属于另一条流程。

## 1. 准备工具并获取代码

需要 Git、Node.js 22.12+ 和 npm。若使用下面的测试依赖容器，还需要 Docker 与 Docker Compose；已有 PostgreSQL、MinIO 的开发者可以直接使用自己的测试服务。

```bash
git clone https://github.com/JojoShine/OWL owl_platform
cd owl_platform
node --version
```

下文未特别说明的命令均在仓库根目录执行。默认后端端口为 3001，前端端口为 5173。

## 2. 配置本地后端

首次使用复制模板；已有 `.env` 时保留自己的配置：

```bash
cp -n backend/.env.example backend/.env
```

编辑 `backend/.env`：

- 保持 `NODE_ENV=development`、`HOST=127.0.0.1`、`PORT=3001`。
- 填写 `DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD`。使用下面的容器时，`DB_HOST=127.0.0.1`，数据库名及账号由这份配置创建。
- 填写 `MINIO_*`。使用下面的容器时，`MINIO_ENDPOINT=127.0.0.1`，端口默认 9000，凭证与容器共用这份配置。
- 将 `JWT_SECRET`、`JWT_REFRESH_SECRET` 改为独立随机值；`THIRD_PARTY_SECRET_ENCRYPTION_KEY`、`API_KEY_PEPPER` 也分别设置，可各执行一次 `openssl rand -hex 32` 生成。
- 设置 `INITIAL_ADMIN_PASSWORD`，至少 12 位，用于首次初始化 `admin` 账号。
- 设置 `CORS_ORIGIN=http://127.0.0.1:5173`。
- 暂不使用邮件或短信时，将模板中的 SMTP 及阿里云示例凭证清空，不必为启动后台配置真实供应商。

Redis 可选；未启动时会出现连接重试和降级提示，首次启动可能稍慢，部分依赖 Redis 的能力不可用。

本地源码使用 `backend/.env`，无需创建仓库根目录的部署 `.env`。如果旧工作区已有 `backend/.env.local`，数据库命令会优先读取它；开始前将其配置合并到 `.env` 并移走旧文件，避免初始化与后端连接不同数据库。

## 3. 准备测试依赖

已有可用 PostgreSQL 和 MinIO 时跳过本步。否则，在仓库根目录启动测试容器：

```bash
docker compose --env-file backend/.env -f compose.local-db.yaml up -d
docker compose --env-file backend/.env -f compose.local-db.yaml ps
```

确认 PostgreSQL 与 MinIO 均为 healthy。这一步只启动测试依赖，不构建或启动 OWL 后端镜像。

默认使用宿主机 5432、9000 端口；有冲突时修改 `backend/.env` 中的 `DB_PORT`、`MINIO_PORT` 后再启动。数据库容器只在空数据卷首次创建时使用账号配置，已有数据卷不会因修改 `.env` 而自动修改账号或密码。

## 4. 安装依赖、构建并初始化

```bash
cd backend
npm ci
npm run build
npm run db:bootstrap
cd ..
```

`build` 生成 Prisma Client 和后端运行产物，必须在首次执行数据库命令前完成。`db:bootstrap` 用于首次空库，会建立结构和基础数据；已有数据时会拒绝重复初始化。

如果使用已有 Prisma 数据库，改为执行 `npm run db:deploy`；旧 Sequelize 数据库需先按 [初始化指南](../02-initialization.md) 接管，不要清库。日常启动不需要重复 bootstrap。

## 5. 启动后端（终端一）

从仓库根目录执行：

```bash
cd backend
npm run dev
```

保持终端运行。服务默认监听 `http://127.0.0.1:3001`。在另一个终端检查：

```bash
curl --fail http://127.0.0.1:3001/health
```

健康检查成功后再启动前端。修改后端源码时，开发进程自动重新构建和启动。

## 6. 配置并启动前端（终端二）

从仓库根目录执行：

```bash
cd frontend
npm ci
cp -n .env.example .env.development.local
```

编辑 `frontend/.env.development.local`，确认以下配置。该文件只影响开发模式，不改变生产构建路径：

```dotenv
VITE_BASE_PATH=/
VITE_API_URL=
VITE_DEV_PROXY_TARGET=http://127.0.0.1:3001
VITE_BASE_URL=
VITE_SOCKET_URL=
VITE_UI_PREVIEW=false
VITE_DISABLE_SOCKET=false
```

启动：

```bash
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

浏览器打开 **http://127.0.0.1:5173/**。Vite 将 API 请求代理到 3001，连接真实后端。若端口已占用，先停止冲突进程，或同步修改端口与后端 CORS；修改后端端口时也同步修改前端代理地址。

## 7. 登录并确认可用

账号为 `admin`，密码为初始化时填写的 `INITIAL_ADMIN_PASSWORD`。完成验证码登录后，确认菜单、用户列表、系统设置及文件上传可用。非管理员示例账号默认禁用。

以后启动只需确保测试依赖在运行，再分别启动两个终端的 `npm run dev`；不必重新安装依赖或初始化数据库。停止开发用 Ctrl+C；可用步骤 3 的 Compose 命令将 `up -d` 替换为 `stop` 停止依赖，保留数据。

## 常见阻塞

| 现象 | 检查方式 |
|---|---|
| 前端请求 500，后端没有访问日志 | 先访问后端 `/health`，检查后端终端和 `VITE_DEV_PROXY_TARGET` |
| 初始化找不到 dist 或 Prisma Client | 在 backend 执行 `npm run build` |
| 数据库连接失败 | 检查依赖健康状态、端口、凭证，以及是否有旧 `.env.local` |
| 对象存储初始化失败 | 检查 MinIO 地址、端口与凭证 |
| 清理或迁移代码后引用旧文件 | 停止前后端开发进程，重新启动，再刷新页面 |

本地源码运行成功后，构建发布版本与服务器部署请分别参考 [Docker 部署](docker.md) 和 [前端静态部署](../architecture/static-frontend-deployment.md)。
