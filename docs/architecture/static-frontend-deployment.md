# OWL 静态前端部署

前端使用 React、Vite、React Router，以静态文件连接 NestJS 后端。后端镜像部署见 [Docker 部署指南](../deployment/docker.md)；本地源码开发见 [本地快速启动](../deployment/quickstart.md)。

## 构建

使用 Node 22（本轮验证 22.23.2），在 frontend 目录执行：

```sh
npm ci
npm run test:ui
npm run lint
npm run build
```

输出为 `frontend/dist/`。部署时仅复制其中的静态文件，不需要 Node、PM2 或前端 Docker。`npm run preview` 仅用于本地检查，不作为生产服务。前端 Dockerfile 已移除。

默认生产路径 `/owl/`，开发路径 `/`。站点根路径部署用 `VITE_BASE_PATH=/ VITE_API_URL=/api npm run build`（覆盖仓库 `.env.production` 的 `/owl/api`）。其他子路径用相同变量设置，必须以绝对路径配置；Router、静态资源、默认 API 和 Socket.io 都跟随该路径。不同路径需要重新构建。

公开配置见 frontend/.env.example。原 `NEXT_PUBLIC_*` 不再读取，迁移为对应 `VITE_*`；原 `.env` 和 `.env.production` 不自动覆盖，按项目需要更新。`VITE_BASE_PATH` 决定 Vite 的 BASE_URL。默认 API 为 `${base}/api`，支持指定 VITE_API_URL（兼容旧 /api/system 后缀）；系统、公开、动态接口分别以 /system、/public 或根 API 访问。默认 WebSocket 同源 `${base}/socket.io/`。开发通过 VITE_DEV_PROXY_TARGET 代理到本地后端。

VITE_PLATFORM_ID 建议显式设置为项目唯一值以隔离本地偏好与登录缓存。VITE_APP_SCENE 支持 general、government-service。所有 VITE_ 变量都视为公开信息，不得放入数据库口令、令牌或 Docker Hub 凭据。

## Nginx

`deploy/nginx/owl-subpath.conf` 对应 `/owl/`，静态文件放 `/srv/www/owl/`。`deploy/nginx/owl-root.conf` 对应根路径，静态文件放 `/srv/www/owl-current/`。示例后端地址为 `127.0.0.1:5002`，与 Compose 的默认宿主机端口一致；若修改 `BACKEND_PORT`，同步修改代理地址。修改域名、目录和后端地址后合并到已有站点配置，执行 `nginx -t` 成功再 reload。TLS 使用现有站点的证书与 HTTPS 配置。

API、Socket.io、旧 uploads 路径单独代理到现有后端，不参与 SPA 回退。页面深层链接回退到入口 HTML；缺失 assets 和常用静态文件返回 404。入口不长缓存，带内容哈希的资源缓存一年。

按版本保存前端目录，通过现有发布流程切换当前版本链接。旧版本带哈希的 assets 应保留一段时间，避免已经打开的浏览器在切换后请求旧延迟加载资源失败；新版本目录可合并保留上一版 assets，入口 HTML 使用新版。回退时切换到兼容后端版本的静态目录。

`bash deploy/deploy.sh`（frontend 目录）可把已构建 dist 打包为 deploy/frontend-deploy.tar.gz；脚本不访问服务器。

## 验证与范围

至少检查登录、退出、用户表单、权限菜单、动态页面、公开分享以及深层链接刷新。分享路径为 `${base}/share/:shareCode`，不要求登录。API 权限仍由后端控制。

本地只读演示用 VITE_UI_PREVIEW=true、VITE_DISABLE_SOCKET=true，只允许开发模式与回环主机。正式 build 不会自动注入演示身份，即使该变量意外开启。演示 API 不连接或修改生产数据。

构建遵循 [Vite 静态部署说明](https://vite.dev/guide/static-deploy.html)；子路径由 [React Router basename](https://reactrouter.com/api/declarative-routers/BrowserRouter) 与 Vite base 保持一致。

本轮验证：143 项自动化测试、完整 ESLint、TypeScript 检查通过；`/owl/` 和根路径构建成功。使用独立本机 Nginx 验证深层链接返回 HTML、缺失静态资源 404、API 返回 JSON、Socket.io 路径转发至只读测试服务，入口保留安全响应头与 no-cache。浏览器验证用户表单、移动端、公开分享错误态与匿名访问跳转；根路径生产包即使开启 VITE_UI_PREVIEW 仍进入登录。

限制：只读模拟服务未覆盖真实短信、上传存储和 WebSocket 握手，需在后端集成阶段验证。编辑器和图表依赖产生较大异步块，Vite 有体积提示；未以提高警告阈值掩盖。
