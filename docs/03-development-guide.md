# 开始开发

OWL 前端使用 React、Vite、Ant Design，后端使用 NestJS、Prisma 和 PostgreSQL。

## 目录

- `frontend/src/pages/`：页面；`src/routing/routes.jsx`：路由注册。
- `frontend/src/components/`：共享及业务组件；`src/lib/api/`：接口封装。
- `backend/src/nest/`：控制器、服务、权限与数据库访问。
- `backend/src/shared/`：共享校验、存储、日志和工具；构建进入 `dist/shared/`。
- `backend/prisma/`：数据模型、版本迁移、初始化数据。
- `backend/scripts/database-cli.js`：数据库管理命令入口。

## 新建业务模块

1. 在 `backend/src/nest/` 下创建模块目录，参考现有控制器和服务实现，在 `app.module.ts` 注册。业务接口保持 `/api/biz/*` 前缀。
2. 数据访问注入 `PrismaService`；多步写入使用事务。显式维护审计字段和软删除过滤，不再依赖 Sequelize Hook。
3. 参考 `identity/user.controller.ts` 使用 `IdentityGuard` 和 `IdentityRoute` 声明权限及验证。菜单授权不会自动替代控制器的权限声明。
4. 在 `frontend/src/pages/` 创建页面，在 `src/routing/routes.jsx` 注册，并在菜单管理配置相同路径。
5. 接口封装放在 `frontend/src/lib/api/`，复用现有请求客户端、身份状态与权限组件。

响应通过 `shared('utils/response')` 保持既有协议；错误使用共享 `ApiError` 或现有异常处理。涉及数据范围的服务显式应用当前用户的数据访问条件，不能仅依赖前端隐藏按钮。

UI 使用已有 Ant Design 包装组件和主题变量，保持浅色/深色、焦点、空状态与弹窗交互一致。

## 数据库变更

初始化与历史迁移统一使用 Prisma，命令和接管步骤见 [初始化指南](02-initialization.md)。新版本结构变更写入 Prisma migration，并在隔离数据库验证。生产执行 `npm run db:deploy`；首次空库执行 `npm run db:bootstrap`。不要对已有项目库执行 `db push`、`migrate dev` 或 reset。

动态业务表不使用 `owl_` 系统前缀，也不加入静态底座 schema；由现有业务表/配置服务管理。涉及动态 SQL 时复用现有安全解析和参数绑定。

## 验证与部署

前端执行 `npm run lint`、`npm run test:ui`、`npm run build`；后端执行 `npm run test:nest`。需要完整集成验证时，在 backend 构建后执行 `OWL_DATABASE_TEST=1 OWL_STORAGE_TEST=1 OWL_MIGRATION_TEST=1 npm test -- --runInBand`。测试需要 PostgreSQL 和 MinIO，迁移测试账号须具备创建隔离数据库的权限。测试只使用开发或隔离数据库。

前端发布 `dist/` 到 Nginx；后端发布 Docker Hub 镜像，由 Compose 执行一次性迁移后启动。见 [部署说明](deployment/docker.md)。
