# 数据模型架构

静态平台模型集中在 `backend/prisma/schema.prisma`，涵盖身份权限、文件、监控、通知邮件、生成器、系统配置与第三方接入。Nest 服务注入 `PrismaService` 访问数据库。

- 使用 `@map` 保持既有数据库列与 API 时间字段命名；BIGINT 响应保持字符串。
- 服务显式维护审计字段、软删除条件与事务，不依赖旧 ORM Hook。
- 关联表保留原有软删除及唯一约束语义。
- 无实际主键的字典数据通过参数化 SQL 读取，不虚构唯一约束。
- 动态项目业务表由业务表/配置服务管理，不加入静态底座 schema。

结构变更通过 `prisma/migrations/` 管理，部署运行 `npm run db:deploy`。首次空库使用 `db:bootstrap`；历史数据库需完成结构校验并显式 `db:baseline` 后接管。禁止在已有项目库使用 `db push`、`migrate dev` 或 reset。详见 [初始化指南](../02-initialization.md)。
