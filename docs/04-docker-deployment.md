# Docker 部署

项目使用同一套前后端镜像支持两种部署方式：当前验证环境连接已有 PostgreSQL、Redis、MinIO；后续单机环境可叠加 Docker 中间件配置。

## 一、当前验证环境

准备部署变量和后端运行配置：

```bash
cp .env.docker.example .env.docker
cp deploy/env/backend.env.example deploy/env/backend.env
```

编辑 `deploy/env/backend.env`，填写已有数据库、Redis、MinIO、JWT 和 CORS 配置。同一台 Linux 宿主机上的中间件使用 `host.docker.internal`，不要使用 `localhost`。

首次构建并启动：

```bash
docker compose --env-file .env.docker \
  -f compose.yaml \
  -f compose.verify.yaml \
  up -d --build
```

启动顺序固定为：已有数据库执行 `db:deploy`、后端健康、前端启动。宿主机只开放 `127.0.0.1:5002` 和 `127.0.0.1:7000` 给本机 Nginx。

查看状态和日志：

```bash
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f backend frontend
```

## 二、Docker 提供中间件

先在 `deploy/secrets` 创建四个凭证文件，文件名见该目录 README。然后启动中间件：

```bash
docker compose --env-file .env.docker \
  -f compose.yaml \
  -f compose.middleware.yaml \
  -f compose.production.yaml \
  up -d postgres redis minio
```

全新空数据库只执行一次初始化：

```bash
docker compose --env-file .env.docker \
  -f compose.yaml \
  -f compose.middleware.yaml \
  -f compose.production.yaml \
  run --rm migration npm run db:bootstrap
```

确认初始化完成后启动全部服务：

```bash
docker compose --env-file .env.docker \
  -f compose.yaml \
  -f compose.middleware.yaml \
  -f compose.production.yaml \
  up -d
```

以后升级只需拉取指定镜像并启动；一次性 migration 服务会执行 `db:deploy`，不会重复初始化数据。

## 三、镜像发布

镜像使用版本号和 Git 提交号双标签，例如：

```text
ghcr.io/jojoshine/owl-frontend:1.2.0
ghcr.io/jojoshine/owl-frontend:a83f22c
ghcr.io/jojoshine/owl-backend:1.2.0
ghcr.io/jojoshine/owl-backend:a83f22c
```

生产服务器只拉取并运行镜像，不在服务器执行 `npm install` 或源码构建。更新前先备份 PostgreSQL 和 MinIO 数据，应用回滚使用上一版本镜像；数据库迁移保持向前兼容。

## 四、数据与安全边界

- 应用镜像不包含 `.env`、密钥、日志、上传文件或数据库数据。
- PostgreSQL、Redis、MinIO 数据保存在独立命名卷中，删除应用容器不会删除数据。
- 中间件端口默认不发布到公网，只在 Compose 内部网络访问。
- `NEXT_PUBLIC_*` 在前端构建时固化，不能保存秘密；API 默认通过同域 `/owl/api` 访问。
- 正式发布应将 `.env.docker` 中的镜像改为不可变版本，避免只使用 `latest`。
