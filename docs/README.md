# Owl Platform 文档中心

本目录是项目唯一的正式文档入口。文档只描述当前有效的系统能力、架构、开发约定和部署方式，不保存设计草稿、执行计划、验收截图或工具生成的过程记录。

## 基础说明

- [项目总览](./01-overview.md)
- [系统初始化](./02-initialization.md)
- [开发指南](./03-development-guide.md)

## 部署

- [Docker 部署](./deployment/docker.md)
- [传统后端部署](./deployment/backend-traditional.md)
- [传统前端部署](./deployment/frontend-traditional.md)
- [Docker Secrets 配置](./deployment/secrets.md)

## 架构

- [后端架构与目录](./architecture/backend.md)
- [前端架构与目录](./architecture/frontend.md)
- [数据模型架构](./architecture/models.md)
- [查询缓存架构](./architecture/query-cache.md)
- [加密能力](./architecture/cryptography.md)
- [动态 CRUD 渲染](./architecture/dynamic-crud.md)
- [安全审计结果](./security-audit.md)

## 功能

功能结果说明统一存放于 [features](./features/)：认证、权限、数据安全、代码生成器、接口开发、第三方接入、通知、文件管理、水印、登录定制和看板等。

## 文档维护规则

- 代码目录内不新增独立 `docs` 或功能 README。
- 新功能完成后更新对应结果文档，不提交实施计划和临时结论。
- 架构变化更新 `architecture`，部署变化更新 `deployment`。
- 临时设计、测试截图和代理工具过程文件不得提交到仓库。
