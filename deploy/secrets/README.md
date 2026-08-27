# Docker middleware secrets

This directory is intentionally ignored except for this file. Before enabling `compose.middleware.yaml`, create these files with exactly one value in each file:

- `postgres_password`
- `redis_password`
- `minio_access_key`
- `minio_secret_key`

Restrict them to the deployment account (`chmod 600 deploy/secrets/*`) and never commit them. Production deployments may replace these files with externally managed Compose secrets later without changing application images.
