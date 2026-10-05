# 同一镜像部署到本地与服务器

后端只维护一份 Dockerfile、一份 `compose.yaml` 和一份 `.env.example`。CI 构建一次 `用户名/owl-backend`，本地验收和服务器部署使用相同版本（建议固定 digest），只修改各自 `.env` 中的连接地址、凭证、域名和宿主机端口。无需按环境重新打包，也不把 `.env` 放入镜像。

镜像提供 amd64 / arm64 两种架构的同版本内容，Docker 按机器架构选择。容器统一以 production 模式运行；本地容器连接测试库并不需要改成 development。源码热更新的 `npm run dev` 是独立开发方式，不是另一套部署镜像。

## 部署材料

每个部署目录只需：

```text
owl/
├── compose.yaml
└── .env
```

从仓库复制 `compose.yaml` 和 `.env.example`，将后者改名 `.env`。服务器不需要源码、Node.js 或 npm；只需要 Docker Engine / Desktop 与支持 `env_file.required` 的 Docker Compose（2.24.0+）。前端独立构建为静态文件，交给现有 Nginx，见 [静态前端部署](../architecture/static-frontend-deployment.md)。

`.env` 同时用于 Compose 参数替换和后端配置注入，不再区分 `.env.docker` 与 `backend.env`。已有部署请合并这两份旧配置到 `.env`，保留原数据库、密钥和项目名，不要覆盖为示例值。镜像内固定监听 3001，宿主机端口使用 `BACKEND_PORT`；日志轮转和资源限制已包含在主 Compose 中，无需环境覆盖文件。

## 本地与服务器配置差异

| 配置 | 本地镜像验收 | 服务器 |
|---|---|---|
| `BACKEND_IMAGE` | 相同已发布版本或 digest | 相同版本或 digest |
| `DB_HOST` | `host.docker.internal`，连接本机映射的测试数据库端口 | 外部 PostgreSQL 地址 |
| `DB_NAME / DB_USER / DB_PASSWORD` | 测试库专用凭证 | 项目独立数据库和专用账号 |
| `MINIO_ENDPOINT` | 本机测试对象存储地址 | 可访问的对象存储地址 |
| `REDIS_HOST` | 测试 Redis（如使用） | 对应 Redis（如使用） |
| `CORS_ORIGIN` | 前端本地地址，如 `http://127.0.0.1:4173` | 实际站点域名 |
| `BACKEND_PORT` | 可设为 3001，与前端开发代理一致 | 默认 5002，由 Nginx 代理 |

容器中的 `localhost` 指容器自身，不能用它连接宿主机数据库。PostgreSQL、MinIO 等属于外部依赖，不打包进后端镜像；主 Compose 不创建数据库。`compose.local-db.yaml` 仅用于可选的本地测试依赖，与应用发布流程分离。

## 相同部署命令

在包含 `compose.yaml` 和 `.env` 的目录中执行：

```bash
docker compose config --quiet
docker compose pull
```

全新空库：在 `.env` 填写至少 12 位的 `INITIAL_ADMIN_PASSWORD`，并设置 `DB_BOOTSTRAP_CONFIRM` 为数据库名，然后仅首次执行：

```bash
docker compose run --rm migration npm run db:bootstrap
```

现有 Sequelize 数据库首次接管：先备份，确认已完成旧版 001–005 迁移，再执行一次基线结构校验和登记：

```bash
docker compose run --rm migration npm run db:baseline
```

已经由 Prisma 管理的数据库无需初始化或再次基线登记。所有环境启动命令相同：

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=100 migration backend
```

一次性 migration 和 backend 使用完全相同的镜像及配置。迁移执行 `db:deploy` 成功后才启动后端；失败时不会自动清库或初始化。初始化成功后可清空首次初始化的两个变量。禁止对已有项目库执行 `db push`、`migrate dev` 或 reset。

## 发布与升级

GitHub 配置 `DOCKERHUB_USERNAME`、`DOCKERHUB_TOKEN`。推送 main、v 开头的版本标签或手动触发发布后，先完成前端检查/测试/构建和后端构建/数据库测试，全部成功才构建并推送 Docker Hub。前端产物保存在 Actions artifact `owl-frontend-static`。

main 生成 latest 和 sha 标签；版本标签生成版本和 sha 标签。验收通过的同一版本用于服务器部署。升级前备份数据库，修改 `.env` 中镜像版本，然后执行 `docker compose pull && docker compose up -d`。回退镜像不会自动回退数据库结构。

未发布时可以用同一 Dockerfile 本地构建：`docker build -t owl-backend:local-check backend`，把 `.env` 中 `BACKEND_IMAGE` 改为该标签并直接 `docker compose up -d`（不执行 pull）。发布验收仍应使用 Docker Hub 上将部署到服务器的同一版本。

若本机系统代理未被 Docker 构建鉴权继承，可仅对本次构建设置 `HTTP_PROXY` / `HTTPS_PROXY`；不要把个人代理地址写进 Dockerfile 或 CI。
