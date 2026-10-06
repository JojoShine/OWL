# Owl Platform

> 前端使用 React / Vite / Ant Design，构建为静态文件交给 Nginx；后端使用 NestJS / Prisma，初始化和历史迁移已统一到 Prisma，旧实现已清理。本地与服务器使用同一版本后端镜像和同一份 Compose，仅 `.env` 不同。详见 [Docker 部署](docs/deployment/docker.md) 与 [静态前端部署](docs/architecture/static-frontend-deployment.md)。

> 项目文档统一维护在 [docs 文档中心](./docs/README.md)，代码目录内不再保留独立说明文档。

<div align="center">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="./frontend/public/logo.png">
    <source media="(prefers-color-scheme: dark)" srcset="./frontend/public/logo-dark.png">
    <img alt="Owl Platform" src="./frontend/public/logo.png" width="120" height="120">
  </picture>
  <h3>一个完整的前后端一体通用管理后台基础框架</h3>
  <p>快速构建企业级管理系统，开箱即用的权限、日志、文件、通知等核心能力</p>
</div>

---

## 项目简介

Owl Platform 是一个面向业务系统的**完整前后端一体的管理后台基础框架**，从数据库到页面的全链路实现。

### 为什么选择 Owl Platform？

在业务系统开发中，几乎每个项目都需要一套管理后台来处理：
- 用户与权限管理
- 数据审计与操作日志
- 文件上传与存储
- 系统通知与告警
- 第三方系统接入

**Owl Platform 的目标是：** 让这些通用能力开箱即用，开发者只需专注在业务逻辑本身，而不是重复建设基础设施。

这不仅仅是一个前端 UI 框架，而是一个**完整的业务系统框架**，包含：
- 前端：React + Vite + React Router，Ant Design 与现有组件体系
- 后端：NestJS API 服务
- 数据库：PostgreSQL 数据模型与迁移
- 存储：MinIO 文件管理
- 缓存：Redis 会话与缓存
- 日志：Winston 结构化日志

---

## 核心能力

Owl Platform 包含的基础功能模块：

### 系统管理
- 用户、角色、权限管理（RBAC）
- 菜单管理与权限自动生成
- 部门、数据字典、系统配置

### 用户认证
- 账号密码登录
- 短信验证码登录
- 会话管理与令牌生成

### 数据管理
- 数据库表管理
- 数据备份与恢复
- 数据导入导出

### 文件存储
- 文件上传、下载、删除
- 文件分享与访问控制
- MinIO 对象存储集成

### 日志审计
- 接口访问日志
- 数据操作审计
- 系统事件日志

### 通知服务
- 邮件发送
- 短信发送
- 系统消息推送

---

## 亮点功能

Owl Platform 的核心竞争力与创新特性：

### 1. 完整的权限管理体系 [详见](./docs/features/12-menu-permission.md)

基于 RBAC 的细粒度权限控制：
- 用户 → 角色 → 权限三层关系
- 菜单权限管理与自动生成
- 数据级访问控制（ALL / 部门 / 本人三级权限）
- 敏感数据访问日志记录与审计

权限检查无处不在：前端菜单隐藏、后端接口鉴权、数据库行级控制。

---

### 2. 代码生成器 [详见](./docs/features/04-code-generator.md)

从数据库表结构一键生成完整的 CRUD 模块：

**自动生成内容：**
- 后端 API（增删改查接口、参数验证、错误处理）
- 前端页面（列表、表单、编辑、删除确认等）
- 权限检查与数据权限控制
- 数据库迁移脚本

**效率提升：**
原本需要数小时的开发工作，现在只需数分钟配置表结构即可完成。

---

### 3. 数据安全防护 [详见](./docs/features/02-data-masking.md) | [权限控制](./docs/features/03-data-access-control.md)

**数据脱敏**
- 自动识别并隐藏敏感字段（身份证、电话、银行卡等）
- 接口返回时自动处理，无需手动编码
- 支持自定义脱敏规则

**敏感数据访问日志**
- 记录所有敏感数据的访问操作
- 完整的审计链：谁、何时、访问了什么、访问结果
- 可追溯所有数据泄露风险

**数据访问权限控制**
- 用户级别的业务数据隐私控制
- 防止数据越权访问
- 三级权限系统（ALL / 部门 / 本人）

---

### 4. 灵活的接口开发平台 [详见](./docs/features/05-api-builder.md)

通过 SQL 快速配置数据接口，零代码开发：

**功能特性：**
- 支持 GET/POST/PUT/DELETE 等多种请求方式
- 参数验证、类型转换、默认值处理
- 内置认证与授权支持
- 速率限制与流量控制
- 自动参数文档生成

**应用场景：**
- 快速开发报表接口
- 数据导出接口
- 第三方数据同步接口
- 内部 BI 工具对接

**文档导出：**
支持导出接口调用文档（Markdown 格式），包含请求参数、认证方式、响应示例等，开箱即用。

---

### 5. 第三方系统安全接入 [详见](./docs/features/06-third-party-integration.md)

为外部系统提供安全的 API 接入机制：

**安全机制：**
- API Key 生成与管理
- 请求签名验证（防篡改）
- 时间戳校验（防重放）
- 速率限制与配额控制

**可观测性：**
- 完整的接口访问日志
- 调用统计与分析
- 异常告警与通知

**支持场景：**
- 移动 APP 后端接入
- 外部合作方数据接入
- 子系统数据同步
- 微服务通信

---

### 6. 完整的日志系统 [详见](./docs/features/)

支持多层次的日志记录、存储与分析：

**接口访问日志**
- 记录所有 API 调用
- 参数、返回值、耗时、客户端信息
- 支持搜索、筛选、分析

**审计日志**
- 记录所有数据变更操作
- 完整的变更历史：谁改了什么、改成了什么
- 支持数据恢复与回溯

**监控日志**
- 接口性能指标（耗时、错误率、吞吐量）
- 系统健康度检查
- 异常告警与通知

**日志特性：**
- 结构化日志存储
- 按天自动归档
- 前端可视化查看
- 支持日志导出

---

### 7. 多渠道认证与登录 [详见](./docs/features/01-sms-login.md)

灵活的用户认证体系：

**登录方式：**
- 账号密码登录（传统方式）
- 短信验证码登录（便捷方式）
- 支持扩展（OAuth、企业 SSO 等）

**会话管理：**
- JWT Token 生成与验证
- Redis 会话存储
- 自动过期与续期
- 并发登录控制

**安全特性：**
- 密码加密存储（bcrypt）
- 登录尝试限制
- 异常登录告警

---

### 8. 可视化配置系统

无需重新编译，即时生效的运行时配置。

**登录页定制** [详见](./docs/features/10-login-customization.md)
- 自定义布局、样式、文案
- 支持品牌 Logo、背景图、主题色
- 支持自定义登录表单字段
- 响应式设计，适配各种屏幕

**看板配置** [详见](./docs/features/11-dashboard.md)
- 支持 SQL 自定义数据源
- 拖拽式组件配置
- 多种图表类型（折线图、柱状图、饼图、热力图等）
- 数据实时刷新
- 导出为图片或 PDF

**水印防护** [详见](./docs/features/09-watermark.md)
- 可配置的水印方案
- 防止页面截图分享
- 支持文本/图片水印
- 支持多层水印叠加

---

### 9. 完整的文件管理服务 [详见](./docs/features/08-file-management.md)

基于 MinIO 的企业级文件服务：

**文件操作：**
- 文件上传、下载、删除
- 批量操作
- 大文件分片上传与断点续传

**文件处理：**
- 文件预览（支持主流格式）
- 缩略图自动生成
- 文件类型校验
- 病毒/恶意代码扫描

**文件分享：**
- 文件分享链接生成
- 分享权限控制（有效期、密码、IP 限制等）
- 分享访问日志
- 分享统计分析

**存储特性：**
- 兼容 S3 的对象存储
- 支持本地存储、云存储切换
- 自动备份与冗余
- 按需扩容

---

### 10. 多渠道通知系统 [详见](./docs/features/07-notification.md)

完整的事件驱动通知体系：

**邮件通知**
- SMTP 邮件服务集成
- 支持模板配置与动态变量
- 支持抄送、密送、附件
- 发送状态追踪与重试

**短信通知**
- 集成短信网关（支持阿里云、腾讯云、华为云等）
- 自定义消息模板
- 短信签名与审核
- 发送状态追踪

**系统通知**
- 应用内实时通知
- WebSocket 推送
- 通知中心与消息记录
- 已读/未读状态管理

**监控告警**
- 接口异常自动告警
- 自定义告警规则（阈值、条件组合等）
- 多渠道告警推送（邮件、短信、系统通知）
- 告警历史查询与统计

**应用场景：**
- 用户注册、密码重置通知
- 订单状态变更通知
- 系统维护公告
- 性能异常告警
- 安全事件通知

---

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + Vite + React Router | 静态 SPA，构建输出 dist，由 Nginx 托管 |
| 前端 | Tailwind CSS | 原子化 CSS，快速构建 UI |
| 前端 | shadcn/ui | 高质量 React 组件库 |
| 后端 | Node.js 22.12+ | JavaScript 运行时 |
| 后端 | NestJS | 模块化 API 服务 |
| 后端 | PostgreSQL 12+ | 关系数据库 |
| 后端 | Prisma | 运行时 ORM、初始化和版本迁移 |
| 缓存 | Redis 6+ | 会话缓存、速率限制 |
| 存储 | MinIO | 兼容 S3 的文件存储 |
| 日志 | Winston | 结构化日志系统 |
| 部署 | Docker Hub / Compose / Nginx | 后端镜像与前端静态部署 |
| 部署 | Nginx | 反向代理与负载均衡 |

---

## 快速开始

### 本地源码开发

首次拿到仓库，请按 [本地快速启动](docs/deployment/quickstart.md) 操作：

1. 准备 Node.js 22.12+，配置 `backend/.env`。
2. 连接已有测试 PostgreSQL、MinIO，或用 `compose.local-db.yaml` 启动测试依赖。
3. 后端执行 `npm ci`、`npm run build`，首次空库执行 `npm run db:bootstrap`。
4. 分别在两个终端启动后端与前端的 `npm run dev`；前端开发配置使用 `.env.development.local`。
5. 按指南访问 `http://127.0.0.1:5173/`，使用 `admin` 和初始化时设置的密码登录。

本地开发直接运行源码并热更新。这里的 Docker 仅用于可选测试依赖，不要求构建应用镜像或配置 Nginx。

### Docker 镜像部署

部署发布版本请使用 [Docker 部署指南](docs/deployment/docker.md)：本地镜像验收与服务器共用同一镜像和 `compose.yaml`，仅部署目录的 `.env` 不同。前端 `dist` 交给现有 Nginx，见 [静态前端部署](docs/architecture/static-frontend-deployment.md)。

源码开发与镜像部署是两条独立流程，配置文件不要混用。

---

## 项目结构

```
owl_platform/
├── frontend/                   # 前端应用 (React / Vite / Ant Design)
│   ├── src/
│   │   ├── pages/             # 业务页面
│   │   ├── layouts/           # 共享布局
│   │   ├── routing/           # React Router 路由
│   │   ├── components/        # 共享与业务组件
│   │   ├── contexts/          # 应用状态
│   │   └── lib/               # API 客户端与工具函数
│   ├── public/                # 静态资源
│   ├── dist/                  # npm run build 产物
│   └── deploy/                # Nginx 部署示例
├── backend/                   # 后端应用 (NestJS)
│   ├── src/
│   │   ├── nest/             # Nest 模块、控制器与 Prisma 服务
│   │   └── shared/           # 随构建编译的共享校验与工具
│   ├── prisma/               # 数据模型、迁移与初始化
│   ├── scripts/              # 数据库管理入口
│   └── Dockerfile            # 后端生产镜像
├── deploy/nginx/owl.conf      # 唯一 Nginx 配置：静态前端与后端代理
├── compose.yaml              # 本地和服务器共用的后端部署入口
├── .env.example              # 复制为部署目录的 .env
├── compose.local-db.yaml     # 可选的本地测试依赖
├── docs/                     # 项目文档
│   ├── README.md             # 统一文档入口
│   ├── 01-overview.md       # 项目总览
│   ├── 02-initialization.md # 初始化指南
│   ├── 03-development-guide.md # 开发指南
│   ├── architecture/         # 架构结果
│   ├── deployment/           # 部署说明
│   └── features/            # 功能文档
└── README.md
```

---

## 文档导航

| 文档 | 说明 |
|------|------|
| [文档中心](./docs/README.md) | 全部正式文档入口与维护规则 |
| [项目总览](./docs/01-overview.md) | 项目背景、定位与架构设计 |
| [系统初始化](./docs/02-initialization.md) | 完整的安装、配置、部署指南 |
| [开发指南](./docs/03-development-guide.md) | 开发规范、目录结构、最佳实践 |
| [架构文档](./docs/architecture/) | 前后端结构、模型与公共能力 |
| [部署文档](./docs/deployment/) | 统一镜像部署与 Nginx 静态部署 |
| [功能文档](./docs/features/) | 各个功能模块的详细说明 |

---

## 部署

### 后端统一镜像部署

本地和服务器的部署目录都只需 `compose.yaml` 与 `.env`：

```bash
cp .env.example .env
# 填写 BACKEND_IMAGE、数据库、对象存储、密钥和站点配置
# 两个环境使用同一镜像版本，仅 .env 内容不同
docker compose config --quiet
docker compose pull
# 首次空库需先初始化，旧版数据库需先接管，见下面的部署指南
docker compose up -d
```

主 Compose 包含后端和一次性 Prisma 迁移服务，共用同一镜像；迁移成功后启动后端。数据库使用外部 PostgreSQL。首次初始化、旧库接管、版本升级及配置差异见 [Docker 部署指南](docs/deployment/docker.md)。

GitHub CI 在前后端检查全部通过后发布 Docker Hub 镜像，同一标签支持 amd64/arm64。本地验收通过的相同版本用于服务器，不按环境重新构建。

### 前端静态部署

在 `frontend` 执行 `npm run build`，将 `dist/` 上传到现有 Nginx，配置 SPA 路由回退和后端代理。详见 [静态部署指南](docs/architecture/static-frontend-deployment.md)。

**Nginx 配置**

使用 [deploy/nginx/owl.conf](deploy/nginx/owl.conf)，按文件注释修改域名、静态目录和后端端口。默认 `/owl/` 对应前端构建路径，后端代理端口为 5002；HTTPS 沿用现有站点配置。

---

## 常见问题

详见 [系统初始化指南](./docs/02-initialization.md) 的常见问题章节。

---

## 贡献

欢迎提交 Issue 反馈问题或建议。

按照 [贡献指南](./CONTRIBUTING.md) 提交 Pull Request。

---

## 开源协议

本项目采用 MIT 许可证。详见 [LICENSE](./LICENSE)。

---

## 联系与反馈

- 提交 Issue：https://github.com/JojoShine/owl/issues
- 邮件反馈：tbtparent@163.com

---

<div align="center">
  Made with ❤️ by tbtparent
</div>
