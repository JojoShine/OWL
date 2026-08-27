# 前端架构与目录

前端基于 Next.js App Router，负责管理后台页面、公共页面、统一组件和 API 客户端封装。

## 目录职责

```text
frontend/
├── app/                    # 路由与页面
│   ├── (authenticated)/    # 登录后管理页面
│   ├── login、register/    # 登录及注册页面
│   └── share/              # 公共分享页面
├── components/             # 通用组件和业务组件
├── contexts/               # 全局状态与上下文
├── lib/
│   ├── api/                # 后端 API 客户端
│   ├── hooks/              # 通用状态 Hook
│   └── utils/              # 请求、认证和主题工具
├── public/                 # 静态资源
└── next.config.mjs         # Next.js 配置
```

## 页面划分

- 平台功能页面位于 `app/(authenticated)` 对应的系统目录。
- 业务扩展页面统一放在 `app/(authenticated)/biz`。
- 页面通过共享的 PageShell、检索区、DataTable、Dialog 和表单组件保持一致。
- 动态生成模块由配置驱动，运行机制见 [动态 CRUD 渲染](./dynamic-crud.md)。

## API 划分

- `lib/api` 提供统一入口和请求封装。
- 系统接口按平台模块组织，业务接口放在 `lib/api/biz`。
- 页面不直接创建 Axios 实例，认证、超时和错误处理由公共客户端负责。

## 状态与主题

- 应用级菜单、用户和主题状态通过 Context 提供。
- 列表查询使用共享 Hook 管理草稿筛选、已应用筛选和分页。
- 浅色、深色模式使用统一语义化颜色变量，业务组件不维护独立主题色板。
