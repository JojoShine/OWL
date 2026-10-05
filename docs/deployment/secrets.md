# 部署凭证

默认部署统一使用部署目录的 `.env`，它已被 Git 忽略；不要将真实配置放入镜像或仓库。配置项见根目录 `.env.example`，使用方式见 [Docker 部署](docker.md)。

镜像入口仍兼容 `DB_PASSWORD_FILE`、`JWT_SECRET_FILE` 等文件凭证，供有外部密钥管理需求的部署使用；默认流程无需 Docker Secrets 或另一份 Compose。本地和服务器均使用相同镜像。
