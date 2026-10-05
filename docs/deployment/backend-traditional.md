# 后端部署方式已更新

旧 PM2 和 tar 部署脚本已移除。后端使用 NestJS / Prisma，GitHub CI 验证后推送 Docker Hub 镜像，服务器通过 Compose 拉取并启动，数据库连接外部 PostgreSQL。

请使用 [Docker 部署指南](docker.md)，迁移或初始化先由一次性迁移服务执行。
