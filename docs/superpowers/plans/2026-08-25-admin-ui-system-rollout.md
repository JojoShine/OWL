# Owl 管理平台全站 UI 统一实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已确认的高级黑白灰设计体系覆盖到所有后台、认证和公开页面，同时保持业务行为不变。

**Architecture:** 先用页面框架组件和基础 UI 组件固化统一视觉，再按常规管理页、配置页、监控页、复杂工作台和公开页面分组迁移。页面组件只负责视觉与布局，原有请求、权限、表单提交和路由逻辑保持原位。

**Tech Stack:** Next.js 16、React 19、Tailwind CSS 4、Radix UI、Vitest、Testing Library

**Spec:** `docs/superpowers/specs/2026-08-25-admin-ui-system-rollout-design.md`

## Global Constraints

- 继续使用 Next.js 16、React 19、Tailwind CSS 4、Radix UI 和现有组件体系。
- 不引入新的 UI 框架、图标库、字体或动画库。
- 继续使用项目内置 Geist 字体。
- 默认主题采用中性黑白灰，显式颜色主题继续作为用户可选项。
- 深色模式必须同步维护。
- 不改变业务流程、接口协议、权限判断或数据逻辑。
- 输入、选择和工具栏表单控件的默认高度为 40px。
- 输入类控件聚焦时使用单层边框，不叠加视觉 Ring。
- 绿色、黄色、红色和蓝色只用于成功、警告、危险、信息或确有业务含义的分类。
- 每个生产代码变更必须先有能够正确失败的测试。

---

### Task 1: 建立统一页面框架组件

**Files:**
- Create: `frontend/components/layout/page-shell.jsx`
- Create: `frontend/components/layout/page-shell.test.jsx`
- Modify: `frontend/app/globals.css`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` and existing theme tokens from `app/globals.css`.
- Produces: named exports `PageShell`, `PageHeader`, `PageToolbar`, `PageSurface`.

- [ ] **Step 1: 写页面框架的失败测试**

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader, PageShell, PageSurface, PageToolbar } from './page-shell';

describe('admin page shell', () => {
  it('exposes the approved page hierarchy without owning business state', () => {
    render(
      <PageShell data-testid="shell">
        <PageHeader title="角色管理" description="维护角色及权限范围" actions={<button>新增角色</button>} />
        <PageToolbar data-testid="toolbar">筛选</PageToolbar>
        <PageSurface data-testid="surface">数据</PageSurface>
      </PageShell>
    );

    expect(screen.getByTestId('shell')).toHaveClass('max-w-[1600px]', 'space-y-5');
    expect(screen.getByRole('heading', { name: '角色管理' })).toHaveClass('text-xl', 'font-semibold');
    expect(screen.getByText('维护角色及权限范围')).toHaveClass('text-muted-foreground');
    expect(screen.getByTestId('toolbar')).toHaveClass('rounded-lg', 'border', 'bg-card');
    expect(screen.getByTestId('surface')).toHaveClass('overflow-hidden', 'rounded-lg', 'border', 'bg-card');
  });
});
```

- [ ] **Step 2: 运行测试并确认因组件不存在而失败**

Run: `cd frontend && npm run test:ui -- components/layout/page-shell.test.jsx --maxWorkers=1`

Expected: FAIL because `./page-shell` cannot be resolved.

- [ ] **Step 3: 实现无业务状态的页面框架**

```jsx
import { cn } from '@/lib/utils';

export function PageShell({ className, ...props }) {
  return <section className={cn('mx-auto w-full max-w-[1600px] space-y-5', className)} {...props} />;
}

export function PageHeader({ title, description, meta, actions, className }) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-baseline gap-2">
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">{title}</h1>
          {meta}
        </div>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function PageToolbar({ className, ...props }) {
  return <div className={cn('rounded-lg border bg-card px-5 py-4', className)} {...props} />;
}

export function PageSurface({ className, ...props }) {
  return <section className={cn('overflow-hidden rounded-lg border bg-card', className)} {...props} />;
}
```

Add `font-variant-numeric: tabular-nums` to tables, metric values and timestamps through a `.tabular-data` utility in `globals.css`.

- [ ] **Step 4: 运行页面框架测试**

Run: `cd frontend && npm run test:ui -- components/layout/page-shell.test.jsx --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: 提交页面框架**

```bash
git add frontend/components/layout/page-shell.jsx frontend/components/layout/page-shell.test.jsx frontend/app/globals.css
git commit -m "style: add unified admin page shell"
```

### Task 2: 统一基础 UI 组件

**Files:**
- Create: `frontend/test/ui-primitives-contract.test.js`
- Modify: `frontend/components/ui/button.jsx`
- Modify: `frontend/components/ui/card.jsx`
- Modify: `frontend/components/ui/tabs.jsx`
- Modify: `frontend/components/ui/dialog.jsx`
- Modify: `frontend/components/ui/alert-dialog.jsx`
- Modify: `frontend/components/ui/input.jsx`
- Modify: `frontend/components/ui/password-input.jsx`
- Modify: `frontend/components/ui/textarea.jsx`
- Modify: `frontend/components/ui/select.jsx`
- Modify: `frontend/components/ui/checkbox.jsx`
- Modify: `frontend/components/ui/radio-group.jsx`
- Modify: `frontend/components/ui/slider.jsx`
- Modify: `frontend/components/ui/badge.jsx`
- Modify: `frontend/components/ui/dropdown-menu.jsx`
- Modify: `frontend/components/ui/popover.jsx`

**Interfaces:**
- Consumes: neutral theme tokens and existing public component props.
- Produces: unchanged component APIs with unified defaults; semantic `Badge` variants remain `success`, `warning`, `info`, `destructive`, and `neutral`.

- [ ] **Step 1: 写基础组件契约的失败测试**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('neutral UI primitive contract', () => {
  it('keeps form controls at 40px with a single-border focus state', () => {
    for (const file of ['components/ui/input.jsx', 'components/ui/textarea.jsx', 'components/ui/select.jsx']) {
      const source = read(file);
      expect(source).not.toContain('focus-visible:ring-[3px]');
      expect(source).not.toContain('focus-visible:ring-2');
    }
    expect(read('components/ui/input.jsx')).toContain('h-10');
    expect(read('components/ui/select.jsx')).toContain('data-[size=default]:h-10');
  });

  it('uses restrained neutral surfaces for cards, tabs, and dialogs', () => {
    expect(read('components/ui/card.jsx')).toContain('rounded-lg border');
    expect(read('components/ui/card.jsx')).not.toContain('shadow-sm');
    expect(read('components/ui/tabs.jsx')).toContain('data-[state=active]:bg-background');
    expect(read('components/ui/tabs.jsx')).not.toContain('data-[state=active]:bg-primary');
    expect(read('components/ui/dialog.jsx')).toContain('bg-slate-950/35 backdrop-blur-[1px]');
  });
});
```

- [ ] **Step 2: 运行契约测试并确认卡片、Tabs 和聚焦状态失败**

Run: `cd frontend && npm run test:ui -- test/ui-primitives-contract.test.js --maxWorkers=1`

Expected: FAIL on current `shadow-sm`, primary-filled Tabs, and Ring classes.

- [ ] **Step 3: 修改基础组件默认样式但不改变 props**

Apply these exact class-level rules:

```jsx
// Card
"bg-card text-card-foreground flex flex-col gap-5 rounded-lg border py-5"

// TabsList
"bg-muted text-muted-foreground inline-flex h-10 w-fit items-center rounded-lg p-1"

// TabsTrigger active state
"data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_1px_2px_rgba(16,24,40,0.06)]"

// Dialog overlay default
"fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-[1px]"

// Input-like focus
"focus-visible:border-primary focus-visible:ring-0"
```

Use `active:translate-y-px` on clickable button variants, retain visible non-input keyboard focus, reduce Card padding from 24px to 20px, and preserve semantic Badge colors.

- [ ] **Step 4: 运行基础组件及现有回归测试**

Run: `cd frontend && npm run test:ui -- test/ui-primitives-contract.test.js components/ui/input.test.jsx components/ui/dialog.test.jsx --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: 提交基础组件统一**

```bash
git add frontend/components/ui frontend/test/ui-primitives-contract.test.js
git commit -m "style: unify neutral UI primitives"
```

### Task 3: 统一表格、筛选、分页和状态反馈

**Files:**
- Modify: `frontend/components/common/DataTable.jsx`
- Modify: `frontend/components/common/DataTable.test.jsx`
- Modify: `frontend/components/common/SearchFilter.jsx`
- Modify: `frontend/components/common/SearchFilter.test.jsx`
- Modify: `frontend/components/ui/table.jsx`
- Modify: `frontend/components/ui/table-loading.jsx`
- Modify: `frontend/components/ui/pagination.jsx`
- Modify: `frontend/components/ui/pagination.test.jsx`
- Modify: `frontend/components/ui/loading.jsx`

**Interfaces:**
- Consumes: `PageSurface`, neutral primitives, existing `DataTable` and `SearchFilter` props.
- Produces: `DataTable` defaults with 48–52px rows, muted header, aligned action column, composed empty/loading states; existing callers require no data changes.

- [ ] **Step 1: 扩展 DataTable 失败测试**

```jsx
it('uses the mature workspace treatment by default', () => {
  render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[]} />);
  expect(screen.getByText('暂无数据').closest('[data-slot="table-cell"]')).toHaveClass('py-12');
  expect(screen.getByRole('table').parentElement.parentElement).toHaveClass('overflow-hidden', 'rounded-lg', 'border', 'bg-card');
});
```

Also add assertions that toolbar fields and query/reset buttons retain `h-10`, pagination uses a border-top container, and loading rows use the same column geometry as loaded rows.

- [ ] **Step 2: 运行数据组件测试并确认默认模式失败**

Run: `cd frontend && npm run test:ui -- components/common/DataTable.test.jsx components/common/SearchFilter.test.jsx components/ui/pagination.test.jsx --maxWorkers=1`

Expected: FAIL because workspace presentation is not yet the default.

- [ ] **Step 3: 统一数据组件**

Change `DataTable` default `variant` to `workspace`, default `density` to `compact`, apply `tabular-data` to numeric/date cells through `column.numeric`, and render pagination in `border-t px-4 py-3`. Keep all existing callbacks and row expansion behavior unchanged. Make `SearchFilter` use a wrapping `gap-3` toolbar and preserve 40px controls.

```jsx
// Change only these defaults in the current DataTable signature.
- variant = 'default',
- density = 'default',
+ variant = 'workspace',
+ density = 'compact',
```

- [ ] **Step 4: 运行数据组件测试**

Run: `cd frontend && npm run test:ui -- components/common/DataTable.test.jsx components/common/SearchFilter.test.jsx components/ui/pagination.test.jsx --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: 提交数据组件统一**

```bash
git add frontend/components/common frontend/components/ui/table.jsx frontend/components/ui/table-loading.jsx frontend/components/ui/pagination.jsx frontend/components/ui/pagination.test.jsx frontend/components/ui/loading.jsx
git commit -m "style: unify admin data workspaces"
```

### Task 4: 迁移常规管理页面和表单 Dialog

**Files:**
- Create: `frontend/test/standard-admin-pages-contract.test.js`
- Modify: `frontend/app/(authenticated)/setting/users/page.js`
- Modify: `frontend/app/(authenticated)/setting/roles/page.js`
- Modify: `frontend/app/(authenticated)/setting/permissions/page.js`
- Modify: `frontend/app/(authenticated)/setting/departments/page.js`
- Modify: `frontend/app/(authenticated)/setting/menus/page.js`
- Modify: `frontend/app/(authenticated)/setting/sensitive-fields/page.js`
- Modify: `frontend/app/(authenticated)/setting/third-party-keys/page.js`
- Modify: `frontend/app/(authenticated)/setting/email-templates/page.js`
- Modify: `frontend/app/(authenticated)/setting/logs/page.js`
- Modify: `frontend/app/(authenticated)/setting/api-builder/keys/page.js`
- Modify: `frontend/components/users/user-form-dialog.jsx`
- Modify: `frontend/components/roles/role-form-dialog.jsx`
- Modify: `frontend/components/departments/department-form-dialog.jsx`
- Modify: `frontend/components/menus/menu-form-dialog.jsx`
- Modify: `frontend/components/sensitive-fields/sensitive-field-form-dialog.jsx`
- Modify: `frontend/components/third-party-keys/key-form-dialog.jsx`
- Modify: `frontend/components/notification/EmailTemplateFormDialog.jsx`
- Modify: `frontend/app/(authenticated)/user-auth/UserAuthDialog.js`

**Interfaces:**
- Consumes: `PageShell`, `PageHeader`, `PageToolbar`, `PageSurface`, unified DataTable and Dialog.
- Produces: consistent standard CRUD page structure while retaining existing hooks, API calls and dialog submit handlers.

- [ ] **Step 1: 写常规页面迁移的失败契约**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const standardPages = [
  'app/(authenticated)/setting/users/page.js',
  'app/(authenticated)/setting/roles/page.js',
  'app/(authenticated)/setting/permissions/page.js',
  'app/(authenticated)/setting/departments/page.js',
  'app/(authenticated)/setting/menus/page.js',
  'app/(authenticated)/setting/sensitive-fields/page.js',
  'app/(authenticated)/setting/third-party-keys/page.js',
  'app/(authenticated)/setting/email-templates/page.js',
  'app/(authenticated)/setting/logs/page.js',
  'app/(authenticated)/setting/api-builder/keys/page.js',
];

it.each(standardPages)('%s uses the shared admin page hierarchy', (file) => {
  const source = read(file);
  expect(source).toContain("from '@/components/layout/page-shell'");
  expect(source).toContain('<PageShell');
  expect(source).toContain('<PageHeader');
  expect(source).not.toMatch(/bg-(blue|slate|gray)-/);
  expect(source).not.toMatch(/text-(slate|gray)-/);
});
```

- [ ] **Step 2: 运行契约并确认未迁移页面失败**

Run: `cd frontend && npm run test:ui -- test/standard-admin-pages-contract.test.js --maxWorkers=1`

Expected: FAIL on pages that do not import the page shell.

- [ ] **Step 3: 将十个页面迁移到统一结构**

Use this concrete structure in each file while leaving its current state and handlers untouched:

```jsx
<PageShell>
  <PageHeader
    title={pageCopy.title}
    description={pageCopy.description}
    actions={primaryAction}
  />
  {filters ? <PageToolbar>{filters}</PageToolbar> : null}
  <PageSurface>{content}</PageSurface>
</PageShell>
```

Define the displayed copy and action content directly in each route using this exact mapping:

```js
const standardPagePresentation = {
  users: ['用户管理', '管理系统用户账号、访问状态与数据权限。', '新增用户'],
  roles: ['角色管理', '配置角色及其关联权限范围。', '新增角色'],
  permissions: ['权限管理', '维护系统权限标识和访问能力。', '新增权限'],
  departments: ['组织架构', '维护部门层级与人员归属。', '新增部门'],
  menus: ['菜单管理', '配置导航结构、路由与菜单权限。', '新增菜单'],
  sensitiveFields: ['敏感字段', '管理敏感数据识别和脱敏规则。', '新增字段'],
  thirdPartyKeys: ['第三方密钥', '集中管理外部服务访问凭据。', '新增密钥'],
  emailTemplates: ['邮件模板', '维护系统邮件内容和变量。', '新增模板'],
  logs: ['系统日志', '查询系统操作和运行记录。', null],
  apiKeys: ['API 密钥', '管理接口调用凭据和使用状态。', '创建密钥'],
};
```

`primaryAction` is the route's current create button with the mapped label; for `logs` it is omitted. `filters` is the route's current SearchFilter or query controls. `content` is its current DataTable, tree, or log list.

Replace decorative blue/Slate/Gray classes with `muted`, `foreground`, `border`, `card`, or a semantic Badge variant. Keep method badges and success/warning/destructive meanings colored.

- [ ] **Step 4: 统一七个 CRUD Dialog 的头部、分组和底部操作**

Use `DialogHeader` with `DialogTitle` and `DialogDescription`, group fields with `space-y-4`, apply `max-h-[85vh] overflow-y-auto`, and keep cancel/submit actions inside `DialogFooter`. Do not change form schemas or payload normalization.

- [ ] **Step 5: 运行常规页面与现有业务测试**

Run: `cd frontend && npm run test:ui -- test/standard-admin-pages-contract.test.js app/'(authenticated)'/setting/users/page.test.jsx components/users/user-form-dialog.test.jsx --maxWorkers=1`

Expected: PASS.

- [ ] **Step 6: 提交常规管理页面**

```bash
git add frontend/app/'(authenticated)'/setting frontend/components/users frontend/components/roles frontend/components/departments frontend/components/menus frontend/components/sensitive-fields frontend/components/third-party-keys frontend/components/notification/EmailTemplateFormDialog.jsx frontend/test/standard-admin-pages-contract.test.js
git commit -m "style: migrate standard admin pages"
```

### Task 5: 迁移配置类页面

**Files:**
- Create: `frontend/test/settings-pages-contract.test.js`
- Modify: `frontend/app/(authenticated)/setting/config-management/page.jsx`
- Modify: `frontend/app/(authenticated)/setting/dashboard-widgets/page.js`
- Modify: `frontend/app/(authenticated)/setting/notification-settings/page.js`
- Modify: `frontend/app/(authenticated)/setting/watermark-settings/page.js`
- Modify: `frontend/app/(authenticated)/setting/zabbix/page.js`
- Modify: `frontend/components/system-config/SystemInfoTab.jsx`
- Modify: `frontend/components/system-config/DashboardConfigTab.jsx`
- Modify: `frontend/components/system-config/ThemePreview.jsx`
- Modify: `frontend/components/system-config/ImageUploader.jsx`
- Modify: `frontend/components/zabbix/ZabbixInstallGuide.jsx`

**Interfaces:**
- Consumes: page shell and neutral Card/Form primitives.
- Produces: consistent setting groups with local descriptions and stable save-action placement.

- [ ] **Step 1: 写配置页面失败契约**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const settingsPages = [
  'app/(authenticated)/setting/config-management/page.jsx',
  'app/(authenticated)/setting/dashboard-widgets/page.js',
  'app/(authenticated)/setting/notification-settings/page.js',
  'app/(authenticated)/setting/watermark-settings/page.js',
  'app/(authenticated)/setting/zabbix/page.js',
];

it.each(settingsPages)('%s uses shared setting surfaces', (file) => {
  const source = read(file);
  expect(source).toContain('<PageShell');
  expect(source).toContain('<PageHeader');
  expect(source).not.toMatch(/bg-(blue|slate|gray)-/);
  expect(source).not.toMatch(/text-(slate|gray)-/);
});
```

- [ ] **Step 2: 运行配置契约并确认失败**

Run: `cd frontend && npm run test:ui -- test/settings-pages-contract.test.js --maxWorkers=1`

Expected: FAIL before migration.

- [ ] **Step 3: 迁移配置页面和子组件**

Wrap each page with `PageShell` and `PageHeader`; use `PageSurface className="p-5"` for a single form and `grid gap-5 lg:grid-cols-2` for preview-plus-settings layouts. Replace standalone colored information cards with `Alert` using `variant="info"` or neutral explanatory surfaces. Keep color pickers and preview canvases as intentional exceptions because they represent configured content.

- [ ] **Step 4: 运行配置契约和完整 UI 测试的当前子集**

Run: `cd frontend && npm run test:ui -- test/settings-pages-contract.test.js test/theme-shell-contract.test.js --maxWorkers=1`

Expected: PASS.

- [ ] **Step 5: 提交配置页面**

```bash
git add frontend/app/'(authenticated)'/setting/config-management frontend/app/'(authenticated)'/setting/dashboard-widgets frontend/app/'(authenticated)'/setting/notification-settings frontend/app/'(authenticated)'/setting/watermark-settings frontend/app/'(authenticated)'/setting/zabbix frontend/components/system-config frontend/components/zabbix frontend/test/settings-pages-contract.test.js
git commit -m "style: migrate configuration pages"
```

### Task 6: 迁移仪表盘、监控、日志与通知页面

**Files:**
- Create: `frontend/test/monitoring-pages-contract.test.js`
- Modify: `frontend/app/(authenticated)/dashboard/page.js`
- Modify: `frontend/app/(authenticated)/monitor/page.js`
- Modify: `frontend/app/(authenticated)/monitor/alerts/page.js`
- Modify: `frontend/app/(authenticated)/monitor/apis/page.js`
- Modify: `frontend/app/(authenticated)/monitor/servers/page.js`
- Modify: `frontend/app/(authenticated)/monitor/zabbix/page.js`
- Modify: `frontend/app/(authenticated)/logs/page.js`
- Modify: `frontend/app/(authenticated)/notifications/page.js`
- Modify: `frontend/components/dashboard/CountMetric.jsx`
- Modify: `frontend/components/dashboard/DashboardCard.jsx`
- Modify: `frontend/components/logs/LogFilters.jsx`
- Modify: `frontend/components/logs/LogTable.jsx`
- Modify: `frontend/components/monitor/ApiMonitorTable.jsx`
- Modify: `frontend/components/monitor/ApiMonitorDetailDialog.jsx`
- Modify: `frontend/components/monitor/ApiMonitorFormDialog.jsx`
- Modify: `frontend/app/(authenticated)/monitor/servers/server-form-dialog.js`
- Modify: `frontend/app/(authenticated)/monitor/servers/server-logs-dialog.js`
- Modify: `frontend/app/(authenticated)/monitor/servers/server-services-dialog.js`
- Modify: `frontend/components/notification/NotificationFilter.jsx`
- Modify: `frontend/components/notification/NotificationList.jsx`
- Modify: `frontend/components/notification/BroadcastNotificationDialog.jsx`
- Modify: `frontend/components/notification/EmailTaskDialog.jsx`
- Modify: `frontend/components/notification/SendNotificationDialog.jsx`

**Interfaces:**
- Consumes: page shell, semantic Badge variants, neutral Card and DataTable.
- Produces: consistent monitoring surfaces while retaining chart series and severity colors.

- [ ] **Step 1: 写监控页面失败契约**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const monitoringPages = [
  'app/(authenticated)/dashboard/page.js',
  'app/(authenticated)/monitor/page.js',
  'app/(authenticated)/monitor/alerts/page.js',
  'app/(authenticated)/monitor/apis/page.js',
  'app/(authenticated)/monitor/servers/page.js',
  'app/(authenticated)/monitor/zabbix/page.js',
  'app/(authenticated)/logs/page.js',
  'app/(authenticated)/notifications/page.js',
];

it.each(monitoringPages)('%s uses shared page structure', (file) => {
  expect(read(file)).toContain('<PageShell');
});

it('metric cards avoid decorative accent backgrounds', () => {
  const metric = read('components/dashboard/CountMetric.jsx');
  expect(metric).not.toMatch(/bg-(blue|purple|cyan)-/);
  expect(metric).toContain('tabular-data');
});
```

- [ ] **Step 2: 运行监控契约并确认失败**

Run: `cd frontend && npm run test:ui -- test/monitoring-pages-contract.test.js --maxWorkers=1`

Expected: FAIL on missing page shell and decorative metric colors.

- [ ] **Step 3: 迁移八个监控类页面**

Use `PageHeader` for page identity and time-range/refresh actions, `PageToolbar` for filters, and border-only Card surfaces for metrics and charts. Apply `tabular-data` to metric values, percentages and timestamps. Preserve ECharts/Recharts series colors, HTTP method colors, alert severity colors and service-health semantics.

- [ ] **Step 4: 统一监控详情和编辑 Dialog**

Apply the shared Dialog layout, neutral section backgrounds, `Badge` semantic variants, and 40px controls to API monitor and server dialogs. Do not change polling, socket, form submission or acknowledgment behavior.

- [ ] **Step 5: 运行监控契约与相关回归测试**

Run: `cd frontend && npm run test:ui -- test/monitoring-pages-contract.test.js --maxWorkers=1`

Expected: PASS.

- [ ] **Step 6: 提交监控页面**

```bash
git add frontend/app/'(authenticated)'/dashboard frontend/app/'(authenticated)'/monitor frontend/app/'(authenticated)'/logs frontend/app/'(authenticated)'/notifications frontend/components/dashboard frontend/components/logs frontend/components/monitor frontend/components/notification frontend/test/monitoring-pages-contract.test.js
git commit -m "style: migrate monitoring and notification pages"
```

### Task 7: 迁移文件、API Builder、生成器和动态模块工作台

**Files:**
- Create: `frontend/test/workspace-pages-contract.test.js`
- Modify: `frontend/app/(authenticated)/files/page.js`
- Modify: `frontend/app/(authenticated)/generator/page.js`
- Modify: `frontend/app/(authenticated)/setting/api-builder/page.js`
- Modify: `frontend/app/(authenticated)/setting/api-builder/edit/[id]/page.js`
- Modify: `frontend/app/(authenticated)/[slug]/page.js`
- Modify: `frontend/app/(authenticated)/biz/example/page.js`
- Modify: `frontend/components/files/FileList.js`
- Modify: `frontend/components/files/FolderTree.js`
- Modify: `frontend/components/files/FilePreviewDialog.js`
- Modify: `frontend/components/files/FileUploadDialog.js`
- Modify: `frontend/components/files/FileShareDialog.js`
- Modify: `frontend/components/files/NewFolderDialog.js`
- Modify: `frontend/components/files/RenameDialog.js`
- Modify: `frontend/components/files/MoveDialog.js`
- Modify: `frontend/components/files/PermissionDialog.jsx`
- Modify: `frontend/components/generator/ConfigsSection.jsx`
- Modify: `frontend/components/generator/TablesSection.jsx`
- Modify: `frontend/components/generator/HistorySection.jsx`
- Modify: `frontend/components/generator/ConfigDialog.jsx`
- Modify: `frontend/components/generator/DynamicDetailPage.jsx`
- Modify: `frontend/components/generator/FieldGroupEditor.jsx`
- Modify: `frontend/components/generator/SqlEditor.jsx`
- Modify: `frontend/components/dynamic-module/DynamicCrudPage.jsx`
- Modify: `frontend/components/dynamic-module/DynamicFilters.jsx`
- Modify: `frontend/components/dynamic-module/DynamicForm.jsx`
- Modify: `frontend/components/dynamic-module/DynamicTable.jsx`
- Modify: `frontend/components/api-builder/api-keys-dialog.js`
- Modify: `frontend/components/api-builder/test-interface-dialog.js`
- Modify: `frontend/components/data-access/data-access-form-dialog.jsx`

**Interfaces:**
- Consumes: page shell tokens and shared primitives, but retains specialized editor/tree/preview APIs.
- Produces: neutral workspace chrome around existing specialized content.

- [ ] **Step 1: 写复杂工作台失败契约**

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const workspacePages = [
  'app/(authenticated)/files/page.js',
  'app/(authenticated)/generator/page.js',
  'app/(authenticated)/setting/api-builder/page.js',
  'app/(authenticated)/setting/api-builder/edit/[id]/page.js',
  'app/(authenticated)/[slug]/page.js',
  'app/(authenticated)/biz/example/page.js',
];

it.each(workspacePages)('%s uses neutral workspace chrome', (file) => {
  const source = read(file);
  expect(source).toContain('<PageShell');
  expect(source).not.toContain('focus:ring-2');
});

it('generator support components use theme tokens instead of gray utilities', () => {
  for (const file of ['components/generator/FieldGroupEditor.jsx', 'components/generator/SqlEditor.jsx']) {
    expect(read(file)).not.toMatch(/(bg|text)-gray-/);
  }
});
```

- [ ] **Step 2: 运行工作台契约并确认失败**

Run: `cd frontend && npm run test:ui -- test/workspace-pages-contract.test.js --maxWorkers=1`

Expected: FAIL on missing shared structure and hard-coded gray/focus styles.

- [ ] **Step 3: 迁移工作台外壳**

Use `PageShell` and `PageHeader` at route level, then preserve internal grids, trees, editors and previews. Replace toolbar inputs with shared `Input`, replace custom modal shells with shared Dialog components, and map visual-only Slate/Gray classes to `bg-muted`, `bg-card`, `text-muted-foreground`, `text-foreground` and `border-border`. Keep code editor dark surfaces and syntax colors because they are content-specific.

- [ ] **Step 4: 迁移文件与生成器弹窗**

Replace manually positioned `bg-popover shadow-xl` modal containers with `DialogContent`; preserve download/upload/file-selection behavior. Standardize footer buttons and scroll containers, and use existing semantic error/success states.

- [ ] **Step 5: 运行工作台契约和动态表格测试**

Run: `cd frontend && npm run test:ui -- test/workspace-pages-contract.test.js components/common/DataTable.test.jsx --maxWorkers=1`

Expected: PASS.

- [ ] **Step 6: 提交复杂工作台**

```bash
git add frontend/app/'(authenticated)'/files frontend/app/'(authenticated)'/generator frontend/app/'(authenticated)'/setting/api-builder frontend/app/'(authenticated)'/'[slug]' frontend/app/'(authenticated)'/biz frontend/components/files frontend/components/generator frontend/components/dynamic-module frontend/components/api-builder frontend/test/workspace-pages-contract.test.js
git commit -m "style: migrate complex admin workspaces"
```

### Task 8: 统一登录、注册、公开分享和入口状态

**Files:**
- Create: `frontend/components/auth/auth-shell.jsx`
- Create: `frontend/components/auth/auth-shell.test.jsx`
- Create: `frontend/test/public-pages-contract.test.js`
- Create: `frontend/app/not-found.js`
- Modify: `frontend/app/login/page.js`
- Modify: `frontend/app/register/page.js`
- Modify: `frontend/app/share/[shareCode]/page.js`
- Modify: `frontend/app/page.js`
- Modify: `frontend/components/auth/sms-login-form.jsx`

**Interfaces:**
- Consumes: neutral Card, Button, Input, Tabs and theme toggle.
- Produces: `AuthShell({ children, systemName, logoUrl, description, footer })`; public pages keep existing API and redirect behavior.

- [ ] **Step 1: 写认证外壳和公开页面的失败测试**

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthShell } from './auth-shell';

it('renders a neutral branded authentication surface', () => {
  render(<AuthShell systemName="Owl 管理平台" description="登录系统">表单</AuthShell>);
  expect(screen.getByRole('heading', { name: 'Owl 管理平台' })).toHaveClass('text-2xl', 'font-semibold');
  expect(screen.getByText('表单').closest('[data-slot="card"]')).toHaveClass('max-w-md', 'border', 'bg-card');
});
```

```js
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

it.each(['app/login/page.js', 'app/register/page.js'])('%s uses AuthShell', (file) => {
  expect(read(file)).toContain('<AuthShell');
});

it('public share page does not use decorative gradients', () => {
  const source = read('app/share/[shareCode]/page.js');
  expect(source).not.toContain('bg-gradient');
  expect(source).not.toMatch(/bg-slate-/);
});

it('provides a branded not-found route with a recovery action', () => {
  const source = read('app/not-found.js');
  expect(source).toContain('页面不存在');
  expect(source).toContain('href="/"');
  expect(source).toContain('bg-background');
});
```

- [ ] **Step 2: 运行认证与公开页面测试并确认失败**

Run: `cd frontend && npm run test:ui -- components/auth/auth-shell.test.jsx test/public-pages-contract.test.js --maxWorkers=1`

Expected: FAIL because `AuthShell` does not exist and the share page uses a gradient.

- [ ] **Step 3: 实现 AuthShell 并迁移登录注册**

```jsx
export function AuthShell({ children, systemName, logoUrl, description, footer }) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border bg-card">
        <CardHeader className="items-center text-center">
          {logoUrl ? <img src={logoUrl} alt={`${systemName} 标志`} className="size-14 rounded-lg dark:invert" /> : null}
          <CardTitle className="text-2xl font-semibold tracking-[-0.02em]">{systemName}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
        {footer ? <CardFooter className="justify-center text-sm">{footer}</CardFooter> : null}
      </Card>
    </main>
  );
}
```

Keep configured split-image login layouts functional, but place the form side inside `AuthShell` styling. Remove decorative technology badges from the primary hierarchy by rendering them as a compact muted footer when enabled.

- [ ] **Step 4: 迁移分享页和根加载状态**

Use `min-h-dvh bg-background`, neutral Card surfaces, existing semantic error treatment, and the shared Loading component. Preserve download behavior and root redirect logic. Create `app/not-found.js` with a centered neutral surface, “页面不存在” heading, a concise explanation, and a `Button asChild` link to `/` labeled “返回首页”.

- [ ] **Step 5: 运行认证和公开页面测试**

Run: `cd frontend && npm run test:ui -- components/auth/auth-shell.test.jsx test/public-pages-contract.test.js --maxWorkers=1`

Expected: PASS.

- [ ] **Step 6: 提交公开页面统一**

```bash
git add frontend/components/auth frontend/app/login frontend/app/register frontend/app/share frontend/app/page.js frontend/app/not-found.js frontend/test/public-pages-contract.test.js
git commit -m "style: unify authentication and public pages"
```

### Task 9: 清理残留样式并完成全站验证

**Files:**
- Create: `frontend/test/ui-rollout-audit.test.js`
- Modify: any scoped frontend file reported by the audit, limited to visual class replacement.
- Modify: `frontend/test/ui-preview-server.mjs` only if additional read-only preview routes are required for visual checks.

**Interfaces:**
- Consumes: all components and page migrations from Tasks 1–8.
- Produces: repository-wide visual audit with documented semantic exceptions.

- [ ] **Step 1: 写残留样式审计的失败测试**

```js
import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const scanRoots = ['app/(authenticated)', 'app/login', 'app/register', 'app/share', 'components'];
const semanticExceptionFiles = new Set([
  'components/logs/LogTable.jsx',
  'components/monitor/ApiMonitorTable.jsx',
  'app/(authenticated)/monitor/alerts/page.js',
  'app/(authenticated)/monitor/zabbix/page.js',
  'app/(authenticated)/setting/watermark-settings/page.js',
  'components/generator/SqlEditor.jsx',
  'components/api-builder/test-interface-dialog.js',
]);

function collectFiles(directory) {
  return readdirSync(resolve(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(resolve(root, directory), entry.name);
    if (entry.isDirectory()) return collectFiles(relative(root, absolute));
    return ['.js', '.jsx'].includes(extname(entry.name)) ? [relative(root, absolute)] : [];
  });
}

const visualFiles = scanRoots
  .flatMap(collectFiles)
  .filter((file) => !semanticExceptionFiles.has(file));

it.each(visualFiles)('%s has no legacy visual-only hard-coded classes', (file) => {
  const source = readFileSync(resolve(root, file), 'utf8');
  expect(source).not.toMatch(/(?:bg|text|border)-(?:slate|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)/);
  expect(source).not.toContain('focus:ring-2');
  expect(source).not.toContain('shadow-xl');
});
```

Define `semanticExceptionFiles` explicitly for HTTP method badges, chart series, alert severity, code editors, image previews, watermark color previews and syntax highlighting. Do not exclude an entire directory.

- [ ] **Step 2: 运行审计并记录每个失败文件**

Run: `cd frontend && npm run test:ui -- test/ui-rollout-audit.test.js --maxWorkers=1`

Expected: FAIL with the remaining exact file paths.

- [ ] **Step 3: 清理审计发现的非语义硬编码样式**

Map legacy visual classes to the following exact tokens:

```text
bg-slate-50 / bg-gray-50       -> bg-muted
bg-slate-100 / bg-gray-100     -> bg-muted
bg-white used as app surface   -> bg-card
text-slate-900 / text-gray-900 -> text-foreground
text-slate-500 / text-gray-500 -> text-muted-foreground
border-slate-* / border-gray-* -> border-border
focus:ring-2                   -> focus-visible:border-primary focus-visible:ring-0
shadow-xl on dialogs           -> shared DialogContent
```

Keep the explicit semantic exceptions listed in the test.

- [ ] **Step 4: 运行完整自动化验证**

Run: `cd frontend && npm run test:ui -- --maxWorkers=1 --reporter=dot`

Expected: all UI test files pass with zero failures.

Run: `cd frontend && npm run lint`

Expected: exit code 0 with no new lint errors.

Run: `cd frontend && npm run build`

Expected: optimized production build completes with exit code 0.

- [ ] **Step 5: 逐页进行视觉验证**

Start the read-only preview server and frontend on unused local ports. In the in-app browser, inspect every route group at desktop width and representative narrow width. For each group verify:

```text
页面标题和主操作层级清晰
侧边栏保持白色且当前项为浅灰选中状态
输入、选择和工具栏控件高度为 40px
输入聚焦时 box-shadow 为 none 且只显示单层边框
Card、Table、Tabs 和 Dialog 使用统一中性表面
成功、警告、危险、信息及业务分类颜色仍然可辨识
窄屏下标题、工具栏、表格和 Dialog 可用
```

- [ ] **Step 6: 检查差异并提交最终清理**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only intended rollout files are modified.

```bash
git add frontend
git commit -m "style: complete full UI system rollout"
```
