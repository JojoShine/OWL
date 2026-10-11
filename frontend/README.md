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

## 请求和错误处理

页面和组件通过 `src/lib/api/` 调用业务接口；API 模块使用统一客户端，地址前缀、登录凭证、超时和响应处理由 `create-http-client.js` 管理。只有客户端工厂可以直接导入 Axios。代码检查会拦截直接使用 `fetch`、`XMLHttpRequest` 或在页面中导入请求客户端的写法。

请求默认使用 `errorMode: 'global'`：请求层统一提示错误，相同错误合并显示，登录过期只处理一次，429 根据 `Retry-After` 提示等待时间。HTTP 200 中顶层 `success: false` 也会作为失败抛出；正常响应保留原有结构，文件下载仍返回完整响应。

表单或测试结果面板自行显示错误时，API 调用传入 `{ errorMode: 'inline' }`，使用 `getRequestErrorMessage(error, '操作失败')` 获取提示。后台刷新可显式选择 `{ errorMode: 'silent' }`；这两种模式的已登录请求遇到登录过期仍会触发重新登录。登录、注册等访客接口在 API 模块中显式设置 `authenticated: false`，不携带登录凭证，也不触发会话过期跳转。取消请求不提示错误。

标准错误保留原始 `response`，额外提供 `userMessage`、`errorKind`、429 的 `retryAfterSeconds` 和提示处理标记 `errorHandled`。页面的 `catch` 负责恢复按钮状态、保留输入或回滚操作；需要弹出提示时使用 `toast.requestError(error, '操作失败')`，它会跳过已处理的错误，避免重复提示。
