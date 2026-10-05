# 后端架构与目录

后端采用 NestJS、Prisma 和 PostgreSQL。所有业务路由由 Nest 控制器注册，旧 Express 路由与 Sequelize 实现已移除。

- `src/main.ts`：启动入口；构建为 `dist/main.js`。
- `src/nest/`：控制器、业务服务、权限 Guard、数据库服务与生命周期管理。
- `src/shared/`：校验、HTTP 辅助、日志、存储及纯工具；随构建进入 `dist/shared/`。
- `prisma/schema.prisma`：静态底座数据模型。
- `prisma/migrations/`：Prisma 版本迁移；初始化由 Prisma Client seed 完成。
- `scripts/`：数据库配置、初始化、迁移、旧库基线接管入口。

请求经过共享 HTTP 中间件、Nest Guard、控制器及业务服务，再由 Prisma 或外部客户端执行；统一响应及异常处理保留原 API 协议。后台任务与 Socket 由 Nest 生命周期管理，关闭时等待在途任务结束。

当前 HTTP 主机仍使用 Express 4 适配器以兼容既有通配路径和 query 校验，Express 是 Nest 的传输依赖。共享代码保留有实际用途的实现，不要求为了文件后缀将全部 JavaScript 重写为 TypeScript。

生产镜像仅需构建产物、生产依赖、Prisma 文件、数据库脚本与容器入口，不再携带源码。初始化与历史数据库接管见 [初始化指南](../02-initialization.md)，部署见 [Docker 部署](../deployment/docker.md)。

部署目录只需 `compose.yaml` 与 `.env`。本地容器和服务器容器都运行同一生产镜像；数据库迁移任务复用它，环境差异仅由 `.env` 注入。镜像不包含环境配置文件。
