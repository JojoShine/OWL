# OWL 前端

React 19 + React Router + Ant Design 6，使用 Vite 构建静态文件。

## 开发和检查

使用 Node.js 22，执行 `npm ci`，复制 `.env.example` 为 `.env` 并配置本地后端。

- `npm run dev`：启动开发服务。
- `npm run build`：类型检查并输出 `dist/`。
- `npm run lint`：代码检查。
- `npm run test:ui`：组件、路由和接口契约测试。
- `npm run preview`：本地预览构建产物。

## 目录

- `src/main.tsx`：浏览器入口。
- `src/AppProviders.jsx`：主题、Ant Design 和登录状态。
- `src/routing/`：显式路由表；地址参数使用 React Router。
- `src/layouts/`：登录后共享布局。
- `src/pages/`：页面，目录本身不决定 URL。
- `src/components/ui/`：基于 Ant Design 的共享控件，保留业务页面的统一接口。
- `src/components/`：业务组件。
- `src/contexts/`、`src/lib/`：状态、接口和通用逻辑。
- `src/styles.css`：现有视觉主题和布局样式。

## 部署

把 `dist/` 交给现有 Nginx 托管，不需要前端 Node 服务。子路径通过构建时 `VITE_BASE_PATH` 配置，Nginx 需要 SPA 回退。完整示例见 [静态前端部署](../docs/architecture/static-frontend-deployment.md)。
