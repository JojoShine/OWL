#!/bin/bash
# Package the already-built static frontend; no Node server or credentials included.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ ! -f dist/index.html ]; then
  echo '请先执行 npm run build 生成 dist/' >&2
  exit 1
fi
tar -czf deploy/frontend-deploy.tar.gz -C dist .
echo '已生成 deploy/frontend-deploy.tar.gz，将其解压到 Nginx 静态站点目录即可。'
