# Docker Secrets 配置

使用 `compose.middleware.yaml` 启动 PostgreSQL、Redis 和 MinIO 前，在项目根目录创建 `deploy/secrets`，并准备以下文件：

```text
deploy/secrets/
├── postgres_password
├── redis_password
├── minio_access_key
└── minio_secret_key
```

每个文件只保存一个凭证值，不添加变量名或引号。限制文件只允许部署账号读取：

```bash
chmod 600 deploy/secrets/*
```

`deploy/secrets` 已被 Git 忽略，不应提交任何真实凭证。生产环境可以替换为外部 Secrets 管理服务，无需重新构建应用镜像。
