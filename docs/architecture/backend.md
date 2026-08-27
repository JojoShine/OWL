# 后端架构与目录

后端基于 Node.js、Express、Sequelize 和 PostgreSQL，平台能力与业务扩展分层维护。

## 目录职责

```text
backend/
├── migrations/postgres/       # PostgreSQL 迁移
├── scripts/                   # 初始化与运维脚本
├── seeders/                   # 基础数据
├── sql/                       # SQL 资源
└── src/
    ├── business/modules/      # 独立业务模块
    ├── config/                # 数据库、缓存、日志、对象存储等配置
    ├── controllers/           # 跨模块控制器
    ├── core/modules/          # 平台核心模块
    ├── middlewares/           # 认证、审计、错误处理等中间件
    ├── models/                # Sequelize 模型和关联
    ├── routes/                # 路由汇总与动态路由
    ├── services/              # 跨模块服务
    ├── utils/                 # 通用工具、加密与 Hook
    ├── app.js                 # Express 应用组装
    └── server.js              # 服务启动入口
```

## 模块边界

- `src/core/modules` 保存认证、权限、菜单、用户、部门、文件、通知、监控、代码生成器和接口开发等平台能力。
- `src/business/modules` 保存具体业务模块，不反向修改核心模块来承载业务逻辑。
- 一个完整模块通常由 route、controller、service、validation 组成；复杂模块可继续拆分内部服务。
- 公共模型统一从 `src/models/index.js` 注册，模型分类见[数据模型架构](./models.md)。

## 请求链路

```text
请求 → 路由 → 公共中间件 → 模块控制器 → 模块服务 → 模型/外部服务 → 统一响应
```

- 路由只负责路径、鉴权和参数校验的装配。
- 控制器负责 HTTP 输入输出，不承载可复用业务规则。
- 服务负责事务、权限范围和业务逻辑。
- 模型负责数据结构、关联和持久化。
- 异常交由统一错误处理中间件转换为标准响应。

## 开发约定

- 文件名使用 kebab-case，类名使用 PascalCase，变量和方法使用 camelCase。
- 新增表结构必须使用迁移，不依赖运行时自动同步修改生产数据库。
- 平台模块和业务模块都复用公共认证、审计、数据权限与响应工具。
- 配置通过环境变量注入，不在源码中保存真实密钥。
- 初始化方式与迁移顺序见[系统初始化](../02-initialization.md)。
