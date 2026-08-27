# 数据模型架构

后端模型集中在 `backend/src/models`，由 `index.js` 创建 Sequelize 实例、注册模型、建立关联并安装审计 Hook。

## 模型分类

```text
models/
├── system/          # 用户、权限、文件、接口、系统配置等平台模型
├── monitor/         # API、服务器、指标和告警模型
├── notification/    # 站内通知、邮件模板、任务和日志
├── generator/       # 代码生成模块、字段和生成历史
├── association/     # 用户角色、角色权限、密钥接口等关联表
├── third_party/     # 第三方厂商密钥与调用日志
└── index.js         # 模型注册、关联与审计 Hook 入口
```

## 注册规则

- 新模型放入职责匹配的分类目录，并在 `backend/src/models/index.js` 中注册。
- 模型关联通过模型的 `associate(models)` 定义，由入口统一执行。
- 多对多中间模型放在 `association`，避免混入主要实体目录。
- 接口开发密钥与第三方厂商密钥是两套独立凭证体系，分别位于 `system` 和 `third_party`。
- 动态生成的业务表可使用原生 SQL 访问，不要求注册为固定 Sequelize 模型。

## 数据库变更

- 已有结构的变更和新表创建都以 `backend/migrations/postgres` 中的迁移为准。
- 初始化程序按迁移版本执行，不使用 `sequelize.sync({ alter: true })` 代替正式迁移。
- 生产环境先备份再迁移，迁移失败应停止应用发布。
- 常用筛选、关联和排序字段应建立索引，并通过分页限制结果集。

## 通用约定

- 模型名使用 PascalCase，表名和数据库字段使用 snake_case。
- 主键、时间字段和审计字段遵循项目全局 Sequelize 配置。
- 业务代码优先从统一模型入口获取模型，避免重复创建 Sequelize 实例。
- 涉及多步写入时由服务层显式开启事务并传递 transaction。

相关初始化流程见[系统初始化](../02-initialization.md)，服务分层见[后端架构与目录](./backend.md)。
