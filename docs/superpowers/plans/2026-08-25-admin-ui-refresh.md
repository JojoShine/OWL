# Owl 管理平台 UI 升级实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将已批准的轻量浅色侧栏、科技蓝品牌色、淡蓝灰工作区和成熟列表工作台落到现有后台，并以用户管理页作为可验证样板。

**Architecture:** 先建立可自动回归的 UI 测试环境，再分层改造全局 token 与应用壳层、列表复合组件、用户页和用户 Dialog。基础 primitive 保持现有 API；新工作台外观通过兼容 prop/variant 接入，避免一次性改变几十个消费者。视觉实现最终必须在真实 Next.js 页面中与选定参考图进行同视口对照。

**Tech Stack:** Next.js 16.2.6、React 19.1、Tailwind CSS 4、Radix UI、shadcn 风格组件、Vitest、Testing Library、jsdom。

**Spec:** `docs/superpowers/specs/2026-08-25-admin-ui-refresh-design.md`

## Global Constraints

- 选定视觉参考为 `/Users/jojoshine/.codex/generated_images/01a033f1-f646-7ce2-97b7-2db3bf93f5ba/exec-bbebd6e5-1cac-414b-8c1e-687053d5f0c0.png`。
- 浅色侧栏必须使用 `#F8FAFD` 一类轻量背景，禁止整块深色或高饱和背景。
- 默认主色为 `#2563EB`，页面背景为 `#F4F7FB`，主文字为 `#182230`，边框为 `#E4EAF2`。
- 成功、警告、危险分别使用 `#12B76A`、`#F79009`、`#F04438`，并始终配合文字。
- 保留现有认证、权限、脱敏、通知、Socket、水印、API 和表单 payload 契约。
- 不增加无真实数据来源的筛选、排序、批量操作、全局搜索、环境切换或用户头像字段。
- 不修改或提交工作区现有 `backend/logs/**` 变更。
- 不部署或发布生产环境。
- 每个生产行为变化必须先有失败测试；纯 CSS token 与视觉配置使用源合同测试加浏览器设计 QA。

---

### Task 1: 建立 UI 回归测试环境

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `frontend/eslint.config.mjs`
- Create: `frontend/vitest.config.mjs`
- Create: `frontend/test/setup.js`
- Create: `frontend/test/smoke.test.js`

**Interfaces:**
- Consumes: 现有 Next.js 路径别名 `@/*`。
- Produces: `npm run test:ui`、jsdom 环境、`@/` 别名、自动 DOM cleanup、全局 jest-dom 断言，以及真正匹配 `.jsx` 的 ESLint 配置。

- [ ] **Step 1: 安装测试依赖并更新 lockfile**

Run:

```bash
cd frontend
npm install --save-dev --save-exact vite@6.2.6 vitest@3.2.4 jsdom@26.1.0 @testing-library/react@16.3.0 @testing-library/jest-dom@6.6.3 @testing-library/user-event@14.6.1
```

Expected: `package.json` 与 `package-lock.json` 只新增上述开发依赖；这些版本与项目当前 Node `20.18.1` 兼容，避免 npm 自动选到要求 Node `20.19+` 的 Vite 7。

- [ ] **Step 2: 增加测试脚本与 Vitest 配置**

在 `frontend/package.json` 的 `scripts` 中加入：

```json
"test:ui": "vitest run",
"test:ui:watch": "vitest"
```

创建 `frontend/vitest.config.mjs`：

```js
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.js'],
    clearMocks: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
```

创建 `frontend/test/setup.js`：

```js
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(cleanup);
```

- [ ] **Step 3: 让 ESLint 真正覆盖 JSX**

在 `frontend/eslint.config.mjs` 的 ignores 配置之前增加显式文件匹配：

```js
{
  files: ['**/*.{js,jsx}'],
},
```

Run:

```bash
cd frontend
./node_modules/.bin/eslint --print-config components/common/DataTable.jsx
```

Expected: 输出完整 JSON 配置且包含 `rules`，不能是 `undefined`。后续所有定向 lint 都增加 `--max-warnings=0`，避免假绿。

- [ ] **Step 4: 添加并运行测试环境冒烟测试**

创建 `frontend/test/smoke.test.js`：

```js
import { describe, expect, it } from 'vitest';

describe('ui test environment', () => {
  it('provides a browser-like document', () => {
    const node = document.createElement('div');
    node.textContent = 'Owl 管理平台';
    document.body.appendChild(node);
    expect(node).toHaveTextContent('Owl 管理平台');
  });
});
```

Run: `cd frontend && npm run test:ui -- test/smoke.test.js`

Expected: PASS, 1 test.

- [ ] **Step 5: 提交测试基础设施**

```bash
git add frontend/package.json frontend/package-lock.json frontend/eslint.config.mjs frontend/vitest.config.mjs frontend/test/setup.js frontend/test/smoke.test.js
git commit -m "test: add frontend ui test harness"
```

---

### Task 2: 落地蓝灰主题与轻量应用壳层

**Files:**
- Create: `frontend/test/theme-shell-contract.test.js`
- Create: `frontend/app/(authenticated)/layout.test.jsx`
- Create: `frontend/components/layout/header.test.jsx`
- Modify: `frontend/app/globals.css`
- Modify: `frontend/app/(authenticated)/layout.js`
- Modify: `frontend/components/layout/sidebar.jsx`
- Modify: `frontend/components/layout/header.jsx`

**Interfaces:**
- Consumes: 当前 `sidebar-*`、`primary`、`background`、`card`、`accent` Tailwind token；后端动态菜单树；现有 Header 通知/主题/用户菜单。
- Produces: 默认蓝灰 token、非纯黑 dark token、桌面 240px 浅色 Sidebar、移动端滑入式 Sidebar、56px Header、桌面 20px/移动端 16px 工作区间距。

- [ ] **Step 1: 写壳层视觉合同测试**

创建 `frontend/test/theme-shell-contract.test.js`：

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('admin shell design contract', () => {
  it('defines the approved light palette', () => {
    const css = read('app/globals.css');
    expect(css).toContain('--background: #f4f7fb');
    expect(css).toContain('--foreground: #182230');
    expect(css).toContain('--primary: #2563eb');
    expect(css).toContain('--sidebar: #f8fafd');
    expect(css).toContain('--sidebar-accent: #eef4ff');
  });

  it('uses a lightweight sidebar rather than a primary color block', () => {
    const sidebar = read('components/layout/sidebar.jsx');
    expect(sidebar).toContain('bg-sidebar');
    expect(sidebar).toContain('text-sidebar-foreground');
    expect(sidebar).toContain('bg-sidebar-accent');
    expect(sidebar).not.toContain("'bg-primary text-primary-foreground'");
  });

  it('uses the real authenticated layout at the approved density', () => {
    const layout = read('app/(authenticated)/layout.js');
    expect(layout).toContain('w-60');
    expect(layout).toContain('p-4 md:p-5');
    expect(layout).toContain('md:translate-x-0');
    expect(layout).toContain('md:static');
  });
});
```

创建 `frontend/components/layout/header.test.jsx`，mock `useAuth`、`NotificationIcon` 与系统配置 API，覆盖移动菜单入口和主题开关契约：

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './header';
import { systemConfigApi } from '@/lib/api';

vi.mock('@/lib/utils/auth', () => ({ useAuth: () => ({ user: { username: 'alice' }, logout: vi.fn() }) }));
vi.mock('@/components/notification/NotificationIcon', () => ({ default: () => <span>通知</span> }));
vi.mock('@/components/layout/theme/theme-toggle', () => ({ ThemeToggle: () => <button>切换主题</button> }));
vi.mock('@/lib/api', () => ({ systemConfigApi: { getConfig: vi.fn() } }));

describe('Header', () => {
  it('keeps the mobile navigation entry and respects a disabled theme switch', async () => {
    systemConfigApi.getConfig.mockResolvedValue({ success: true, data: { enable_theme_switch: false } });
    render(<Header onMenuClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: '打开导航菜单' })).toBeInTheDocument();
    await waitFor(() => expect(systemConfigApi.getConfig).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '切换主题' })).not.toBeInTheDocument();
  });
});
```

创建 `frontend/app/(authenticated)/layout.test.jsx`，把认证/Provider mock 为透传，把 Header mock 为“打开导航菜单”按钮；点击后应出现“关闭导航菜单”遮罩，按 Esc 或点击遮罩均关闭。这个测试先于移动侧栏实现运行，确保交互不是只有 CSS 截图。

- [ ] **Step 2: 运行合同测试并确认 RED**

Run: `cd frontend && npm run test:ui -- test/theme-shell-contract.test.js 'app/(authenticated)/layout.test.jsx' components/layout/header.test.jsx`

Expected: FAIL，因为当前默认主色接近黑色、侧栏活动项是实心 primary、布局仍为 `w-64 p-6`。

- [ ] **Step 3: 更新全局 token**

在 `:root` 中使用以下核心值，并保持现有变量名：

```css
:root {
  --radius: 0.5rem;
  --background: #f4f7fb;
  --foreground: #182230;
  --card: #ffffff;
  --card-foreground: #182230;
  --popover: #ffffff;
  --popover-foreground: #182230;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --secondary: #eef4ff;
  --secondary-foreground: #1d4ed8;
  --muted: #f3f6fb;
  --muted-foreground: #667085;
  --accent: #eef4ff;
  --accent-foreground: #1d4ed8;
  --destructive: #f04438;
  --border: #e4eaf2;
  --input: #d7dfeb;
  --ring: #2563eb;
  --sidebar: #f8fafd;
  --sidebar-foreground: #344054;
  --sidebar-primary: #2563eb;
  --sidebar-primary-foreground: #ffffff;
  --sidebar-accent: #eef4ff;
  --sidebar-accent-foreground: #1d4ed8;
  --sidebar-border: #e4eaf2;
  --sidebar-ring: #2563eb;
}
```

`.dark` 改为深蓝灰背景 `#0b1220`、surface `#111a2b`、边框 `#263247`；所有 `.theme-*` 只覆盖品牌主色、ring、chart 与 sidebar-primary，不覆盖中性背景和边框。修正日历样式中对 OKLCH 变量的无效 `hsl(...)` 包装。

- [ ] **Step 4: 更新真实布局、Sidebar 和 Header**

`frontend/app/(authenticated)/layout.js` 增加 `'use client'` 与 `mobileNavOpen` 状态。桌面沿用常驻侧栏；小于 `md` 时侧栏默认移出视口，Header 菜单按钮打开后从左侧滑入，并提供可点击遮罩和 Esc 关闭。保留 `RequireAuth`、全部 Provider 与水印。核心结构使用：

```jsx
{mobileNavOpen && (
  <button
    type="button"
    aria-label="关闭导航菜单"
    className="fixed inset-0 z-40 bg-slate-950/25 md:hidden"
    onClick={() => setMobileNavOpen(false)}
  />
)}
<aside
  className={cn(
    'fixed inset-y-0 left-0 z-50 w-60 flex-shrink-0 transform transition-transform md:static md:translate-x-0',
    mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
  )}
>
  <Sidebar onNavigate={() => setMobileNavOpen(false)} />
</aside>
<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
  <Header onMenuClick={() => setMobileNavOpen(true)} />
  <main className="flex-1 overflow-y-auto bg-background p-4 md:p-5">
    {children}
  </main>
</div>
```

Sidebar 根节点与活动项使用：

```jsx
<div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
```

```js
isActive
  ? 'relative bg-sidebar-accent text-sidebar-primary font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary'
  : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
```

以现有 `businessMenus`、`systemMenus` 渲染“业务应用”“系统管理”分组标题，不写死菜单；链接导航后调用可选 `onNavigate` 关闭移动侧栏。Header 调整为 `h-14 border-b bg-card px-4 md:px-5`，加入仅移动端显示且名称为“打开导航菜单”的菜单按钮。保留欢迎信息、通知和用户菜单；移除未渲染的 `systemName/logoUrl` 状态，但保留精简后的 `systemConfigApi` 请求，因为它仍负责遵守 `enable_theme_switch=false` 的既有配置契约。

- [ ] **Step 5: 验证 GREEN 并提交**

Run:

```bash
cd frontend
npm run test:ui -- test/theme-shell-contract.test.js components/layout/header.test.jsx
npm run test:ui -- 'app/(authenticated)/layout.test.jsx'
./node_modules/.bin/eslint --ext .js,.jsx 'app/(authenticated)/layout.js' 'app/(authenticated)/layout.test.jsx' components/layout/sidebar.jsx components/layout/header.jsx components/layout/header.test.jsx --no-cache --max-warnings=0
```

Expected: tests PASS；定向 ESLint 无 error。

```bash
git add frontend/app/globals.css 'frontend/app/(authenticated)/layout.js' 'frontend/app/(authenticated)/layout.test.jsx' frontend/components/layout/sidebar.jsx frontend/components/layout/header.jsx frontend/components/layout/header.test.jsx frontend/test/theme-shell-contract.test.js
git commit -m "feat: refresh admin shell and theme"
```

---

### Task 3: 增加兼容型搜索工具栏

**Files:**
- Create: `frontend/components/common/SearchFilter.test.jsx`
- Modify: `frontend/components/common/SearchFilter.jsx`

**Interfaces:**
- Consumes: 原有 `fields`、`values`、`onChange`、`onSearch`、`onReset`、`extra`。
- Produces: 新增 `variant="toolbar"` 与 `rightActions`；导出 `normalizeSelectValue(value, field)`；默认 variant 行为保持兼容。

- [ ] **Step 1: 写工具栏行为测试**

创建 `frontend/components/common/SearchFilter.test.jsx`：

```jsx
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { normalizeSelectValue, SearchFilter } from './SearchFilter';

const fields = [{ type: 'text', name: 'keyword', placeholder: '搜索用户' }];

describe('SearchFilter', () => {
  it('submits from a text input when Enter is pressed', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={onSearch} onReset={vi.fn()} variant="toolbar" />);
    await user.type(screen.getByPlaceholderText('搜索用户'), 'alice{enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('does not submit when Enter originates from a non-text control', () => {
    const onSearch = vi.fn();
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={onSearch} onReset={vi.fn()} variant="toolbar" />);
    fireEvent.keyDown(screen.getByRole('button', { name: '重置' }), { key: 'Enter' });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('normalizes the all option without changing explicit all values', () => {
    expect(normalizeSelectValue('all', {})).toBe('');
    expect(normalizeSelectValue('all', { preserveAllValue: true })).toBe('all');
  });

  it('renders right-side actions in toolbar mode', () => {
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={vi.fn()} onReset={vi.fn()} variant="toolbar" rightActions={<button>导出</button>} />);
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `cd frontend && npm run test:ui -- components/common/SearchFilter.test.jsx`

Expected: FAIL，因为 helper、variant 和 `rightActions` 尚不存在，且 Enter 会从任意子控件触发搜索。

- [ ] **Step 3: 实现兼容型 toolbar**

新增 helper：

```js
export function normalizeSelectValue(value, field = {}) {
  if (field.preserveAllValue) return value;
  return value === (field.allValue ?? 'all') ? (field.emptyValue ?? '') : value;
}
```

新增 props：

```js
export function SearchFilter({
  fields = [],
  values = {},
  onChange,
  onSearch,
  onReset,
  extra,
  rightActions,
  variant = 'default',
})
```

Enter 处理必须限定为普通文本输入：

```js
const handleKeyDown = (event) => {
  if (event.key !== 'Enter') return;
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  if (!['text', 'search', 'email', 'tel'].includes(target.type)) return;
  onSearch();
};
```

Toolbar 使用 `data-variant={variant}`，控件 36px 高，左侧字段与查询/重置成组，`rightActions` 靠右；默认模式保留当前标签与多字段布局。

- [ ] **Step 4: 验证 GREEN 并提交**

Run:

```bash
cd frontend
npm run test:ui -- components/common/SearchFilter.test.jsx
./node_modules/.bin/eslint --ext .jsx components/common/SearchFilter.jsx components/common/SearchFilter.test.jsx --no-cache --max-warnings=0
```

Expected: tests PASS；定向 ESLint 无 error。

```bash
git add frontend/components/common/SearchFilter.jsx frontend/components/common/SearchFilter.test.jsx
git commit -m "feat: add admin search toolbar variant"
```

---

### Task 4: 统一表格、语义状态与分页

**Files:**
- Create: `frontend/components/common/DataTable.test.jsx`
- Create: `frontend/components/ui/pagination.test.jsx`
- Modify: `frontend/components/common/DataTable.jsx`
- Modify: `frontend/components/ui/table-loading.jsx`
- Modify: `frontend/components/ui/pagination.jsx`
- Modify: `frontend/components/ui/badge.jsx`
- Modify: `frontend/components/ui/checkbox.jsx`

**Interfaces:**
- Consumes: 原有 `DataTable` props 与 `Pagination` props。
- Produces: `DataTable variant="workspace" density="compact" actionsLabel="操作"`；真实 button 分页；兼容型 `resetPageOnPageSizeChange`；Badge 新增 `success/warning/info/neutral`；所有旧 variant 和回调顺序继续有效。

- [ ] **Step 1: 写 DataTable 与 Pagination 失败测试**

`frontend/components/common/DataTable.test.jsx` 覆盖合法的 `rowKey=0` 和单页总数：

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

describe('DataTable workspace variant', () => {
  it('uses a zero row key and exposes the expand control name', async () => {
    const interaction = userEvent.setup();
    const rows = [{ id: 8, name: '八号用户' }, { id: 0, name: '零号用户' }];
    const { rerender } = render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={rows} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    await interaction.click(screen.getByRole('button', { name: '展开零号用户' }));
    expect(screen.getByText('零号用户详情')).toBeInTheDocument();
    rerender(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[rows[1], rows[0]]} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    expect(screen.getByText('零号用户详情')).toBeInTheDocument();
    expect(screen.queryByText('八号用户详情')).not.toBeInTheDocument();
  });

  it('keeps the total visible when only one page exists', () => {
    render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[{ id: 1, name: '用户' }]} pagination={{ page: 1, pageSize: 10, total: 1 }} onPageChange={vi.fn()} variant="workspace" />);
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });
});
```

`frontend/components/ui/pagination.test.jsx` 覆盖 button 与 disabled：

```jsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('uses disabled buttons at the first page', () => {
    render(<Pagination page={1} total={80} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
  });

  it('preserves the default page-size reset contract and allows an opt-out', async () => {
    const interaction = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { rerender } = render(<Pagination page={2} total={80} pageSize={10} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPageChange).toHaveBeenCalledWith(1);

    onPageChange.mockClear();
    onPageSizeChange.mockClear();
    rerender(<Pagination page={2} total={80} pageSize={10} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} resetPageOnPageSizeChange={false} />);
    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
```

该测试文件同时从 `@testing-library/user-event` 导入 `userEvent`。

- [ ] **Step 2: 运行测试并确认 RED**

Run: `cd frontend && npm run test:ui -- components/common/DataTable.test.jsx components/ui/pagination.test.jsx`

Expected: FAIL，因为 `row[rowKey] || index` 会丢失 0、展开按钮无名称、单页 Pagination 返回 null、页码仍是 anchor。

- [ ] **Step 3: 实现 workspace 表格与真实分页按钮**

`DataTable` 新增兼容 props，并修正 key：

```js
export function DataTable({
  columns = [],
  data = [],
  loading = false,
  actions,
  actionsLabel = '操作',
  variant = 'default',
  density = 'default',
  ...rest
})
```

```js
const rowId = row[rowKey] ?? index;
const rowLabel = row.name || row.username || rowId;
```

展开按钮使用 `aria-label={isExpanded ? `收起${rowLabel}` : `展开${rowLabel}`}`。`workspace` variant 将表格、空态和 footer 放入同一 `rounded-lg border bg-card` surface；`compact` 行高约 50px，表头使用 `bg-muted/60`。

`PaginationLink` 改为：

```jsx
function PaginationLink({ className, isActive, disabled, size = 'icon-sm', children, ...props }) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-current={isActive ? 'page' : undefined}
      className={cn(buttonVariants({ variant: isActive ? 'default' : 'ghost', size }), className)}
      {...props}
    >
      {children}
    </button>
  );
}
```

渲染页码时显式传入：

```jsx
aria-label={`第 ${pageNum} 页`}
```

上一页、下一页分别使用 `aria-label="上一页"`、`aria-label="下一页"`，保留 `size="default"` 的文字按钮尺寸并把边界状态传给 `disabled`。`className` 与 `size` 必须在展开 DOM props 前被消费，不能泄漏成原生属性或覆盖内部样式。总记录信息始终渲染；仅在 `totalPages <= 1` 时隐藏页码导航。

新增 `resetPageOnPageSizeChange = true`，默认继续按旧契约依次调用 `onPageSizeChange(newPageSize)` 与 `onPageChange(1)`；只有 `DataTable variant="workspace"` 传 `false`，因为用户页自己的 `handlePageSizeChange` 已同时更新 page size 和 page。

Badge 新增：

```js
success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300',
warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300',
info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300',
neutral: 'border-border bg-muted text-muted-foreground',
```

Checkbox 移除硬编码 gray，使用 `border-input focus-visible:ring-ring data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`。DataTable 的表头、行距和 hover 通过 `workspace` 容器的后代选择器或条件 class 局部实现，不修改 `ui/table.jsx` 默认外观；`TableLoading` 仅新增可选 variant，默认不变。

- [ ] **Step 4: 验证 GREEN 并提交**

Run:

```bash
cd frontend
npm run test:ui -- components/common/DataTable.test.jsx components/ui/pagination.test.jsx
./node_modules/.bin/eslint --ext .jsx components/common/DataTable.jsx components/ui/table-loading.jsx components/ui/pagination.jsx components/ui/badge.jsx components/ui/checkbox.jsx components/common/DataTable.test.jsx components/ui/pagination.test.jsx --no-cache --max-warnings=0
```

Expected: tests PASS；定向 ESLint 无 error。

```bash
git add frontend/components/common/DataTable.jsx frontend/components/common/DataTable.test.jsx frontend/components/ui/table-loading.jsx frontend/components/ui/pagination.jsx frontend/components/ui/pagination.test.jsx frontend/components/ui/badge.jsx frontend/components/ui/checkbox.jsx
git commit -m "feat: add mature data workspace styling"
```

---

### Task 5: 将用户管理页接入新工作台并消除查询竞态

**Files:**
- Create: `frontend/app/(authenticated)/setting/users/page.test.jsx`
- Modify: `frontend/app/(authenticated)/setting/users/page.js`

**Interfaces:**
- Consumes: `SearchFilter variant="toolbar"`、`DataTable variant="workspace"`、现有 `userApi`、权限 hook、脱敏按钮、Dialog 和 ConfirmDialog。
- Produces: 已批准的页面层级、真实总数、最新搜索值请求、带文字的可操作状态、可访问行操作。

- [ ] **Step 1: 写搜索与重置竞态测试**

在 `page.test.jsx` 中 mock `userApi`、权限 hook 和非目标 Dialog，保留真实 SearchFilter/DataTable：

```jsx
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './page';
import { userApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  userApi: {
    getUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));
vi.mock('@/lib/hooks/usePermission', () => ({ usePermission: () => ({ canCreate: () => true, canUpdate: () => true, canDelete: () => true }) }));
vi.mock('@/components/users/user-form-dialog', () => ({ default: () => null }));
vi.mock('@/components/ui/confirm-dialog', () => ({ ConfirmDialog: () => null }));
vi.mock('@/components/sensitive-fields/plain-access-button', () => ({ default: () => null }));

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

describe('UsersPage queries', () => {
  beforeEach(() => {
    userApi.getUsers.mockResolvedValue({ data: { items: [], pagination: { total: 0 } } });
  });

  it('searches with the latest draft and resets with an empty query', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('搜索用户名、邮箱...'), 'alice');
    await user.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenLastCalledWith({ search: 'alice', page: 1, limit: 10 }));
    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenLastCalledWith({ search: '', page: 1, limit: 10 }));
  });

  it('keeps the status action visible and adds a semantic label', async () => {
    userApi.getUsers.mockResolvedValueOnce({
      data: { items: [{ id: 1, username: 'alice', status: 'active' }], pagination: { total: 1 } },
    });
    render(<UsersPage />);
    expect(await screen.findByText('正常')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: '切换用户 alice 状态' })).toBeInTheDocument();
  });

  it('runs an identical query again and ignores an older slow response', async () => {
    const interaction = userEvent.setup();
    const slow = deferred();
    const fast = deferred();
    userApi.getUsers
      .mockResolvedValueOnce({ data: { items: [], pagination: { total: 0 } } })
      .mockImplementationOnce(() => slow.promise)
      .mockImplementationOnce(() => fast.promise);

    render(<UsersPage />);
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(1));
    const input = screen.getByPlaceholderText('搜索用户名、邮箱...');
    await interaction.type(input, 'alice');
    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(2));
    await interaction.clear(input);
    await interaction.type(input, 'bob');
    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(3));

    await act(async () => fast.resolve({ data: { items: [{ id: 2, username: 'bob', status: 'active' }], pagination: { total: 1 } } }));
    expect(await screen.findByText('bob')).toBeInTheDocument();
    await act(async () => slow.resolve({ data: { items: [{ id: 1, username: 'alice', status: 'active' }], pagination: { total: 1 } } }));
    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(4));
  });
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `cd frontend && npm run test:ui -- 'app/(authenticated)/setting/users/page.test.jsx'`

Expected: FAIL；当前 `setTimeout(fetchUsers, 0)` 可能读取旧闭包，页面也没有批准的标题和 workspace variant。

- [ ] **Step 3: 用 applied search 驱动请求并重组页面**

从 React 同时引入 `useCallback` 与 `useRef`，并引入独立的已应用查询：

```js
const [searchValues, setSearchValues] = useState({});
const [appliedSearch, setAppliedSearch] = useState('');
const [queryVersion, setQueryVersion] = useState(0);
const latestRequestId = useRef(0);

const fetchUsers = useCallback(async ({
  search = appliedSearch,
  page = pagination.page,
  limit = pagination.pageSize,
} = {}) => {
  const requestId = ++latestRequestId.current;
  setIsLoading(true);
  try {
    const response = await userApi.getUsers({ search, page, limit });
    if (requestId !== latestRequestId.current) return;
    // 仅最新请求更新 users 与 pagination.total。
  } catch (error) {
    if (requestId !== latestRequestId.current) return;
    // 沿用现有错误记录与空态逻辑。
  } finally {
    if (requestId === latestRequestId.current) setIsLoading(false);
  }
}, [appliedSearch, pagination.page, pagination.pageSize]);

useEffect(() => {
  fetchUsers({
    search: appliedSearch,
    page: pagination.page,
    limit: pagination.pageSize,
  });
}, [fetchUsers, queryVersion]);

const handleSearch = () => {
  setAppliedSearch(searchValues.keyword?.trim() || '');
  setPagination((current) => ({ ...current, page: 1 }));
  setQueryVersion((current) => current + 1);
};

const handleReset = () => {
  setSearchValues({});
  setAppliedSearch('');
  setPagination((current) => ({ ...current, page: 1 }));
  setQueryVersion((current) => current + 1);
};
```

`fetchUsers` 的完整实现接收显式 query 参数，不再从闭包读取 draft state；无参数调用时回退到当前 applied query，以兼容 `PlainAccessButton onSuccess`、用户表单成功回调和删除后的刷新。`queryVersion` 让 page=1 时的相同查询/重置也能重新请求，`latestRequestId` 阻止慢旧响应覆盖快新响应。保留当前响应解析、异常记录和 loading 状态。状态列继续保留可操作 `Switch`，并在旁边增加 `success/neutral/warning` Badge 与“正常/禁用/封禁”文字，形成明确的语义颜色而不牺牲原有切换行为。页面结构改为：

行操作抽成同页函数，保持现有权限和行为：

```jsx
const renderUserActions = (user) => (
  <>
    {canUpdate('user') && (
      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(user)} aria-label={`编辑用户 ${user.username}`} title="编辑用户">
        <Edit className="h-4 w-4" />
      </Button>
    )}
    {canDelete('user') && (
      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(user)} aria-label={`删除用户 ${user.username}`} title="删除用户">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    )}
  </>
);
```

```jsx
<section className="overflow-hidden rounded-lg border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.03)]">
  <header className="flex flex-col gap-4 border-b px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-semibold tracking-tight">用户管理</h1>
        <span className="text-sm text-muted-foreground">共 {pagination.total} 位用户</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">管理系统用户账号、访问状态与数据权限。</p>
    </div>
    {canCreate('user') && (
      <Button onClick={handleAdd}>
        <Plus className="h-4 w-4" />
        新增用户
      </Button>
    )}
  </header>
  <div className="border-b px-5 py-4">
    <SearchFilter
      variant="toolbar"
      fields={searchFields}
      values={searchValues}
      onChange={setSearchValues}
      onSearch={handleSearch}
      onReset={handleReset}
    />
  </div>
  <div className="p-5 pt-4">
    <DataTable
      variant="workspace"
      density="compact"
      columns={columns}
      data={users}
      loading={isLoading}
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
      actions={renderUserActions}
    />
  </div>
</section>
```

状态单元格保留 Switch，并将它的 `aria-label` 动态设置为“切换用户 + 用户名 + 状态”；旁边用语义 Badge 显示“正常/禁用/封禁”。编辑、删除按钮增加 `aria-label` 和 `title`。用户列组合用户名与真实姓名，但邮箱、手机号与 `PlainAccessButton` 继续独立展示，确保脱敏操作不丢失。

- [ ] **Step 4: 验证 GREEN 并提交**

Run:

```bash
cd frontend
npm run test:ui -- 'app/(authenticated)/setting/users/page.test.jsx'
./node_modules/.bin/eslint --ext .js,.jsx 'app/(authenticated)/setting/users/page.js' 'app/(authenticated)/setting/users/page.test.jsx' --no-cache --max-warnings=0
```

Expected: tests PASS；定向 ESLint 无 error。

```bash
git add 'frontend/app/(authenticated)/setting/users/page.js' 'frontend/app/(authenticated)/setting/users/page.test.jsx'
git commit -m "feat: redesign user management workspace"
```

---

### Task 6: 重构用户 Dialog 的信息分组与滚动行为

**Files:**
- Create: `frontend/components/users/user-form-dialog.test.jsx`
- Create: `frontend/components/ui/dialog.test.jsx`
- Modify: `frontend/components/users/user-form-dialog.jsx`
- Modify: `frontend/components/form/SensitiveInput.jsx`
- Modify: `frontend/components/ui/dialog.jsx`

**Interfaces:**
- Consumes: 现有 `open/onOpenChange/user/onSuccess`、`userSchema`、department/role APIs、SensitiveInput 和提交转换。
- Produces: 85vh Dialog、固定 header/footer、可滚动 body、两组字段、宽屏双列、每次打开时可靠 reset，以及保持不变的新增/编辑 payload 契约。

- [ ] **Step 1: 写重开 reset 与分组测试**

创建 `user-form-dialog.test.jsx`，mock 只读下拉 API 和敏感字段 Context：

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import UserFormDialog, { buildUserPayload } from './user-form-dialog';

vi.mock('@/lib/api', () => ({
  userApi: { updateUser: vi.fn(), createUser: vi.fn() },
  departmentApi: { getDepartmentTree: vi.fn().mockResolvedValue({ data: [] }) },
  roleApi: { getRoles: vi.fn().mockResolvedValue({ data: { items: [] } }) },
}));
vi.mock('@/contexts/SensitiveFieldContext', () => ({ useSensitiveField: () => ({ shouldShowEditButton: () => false }) }));

describe('UserFormDialog', () => {
  it('groups fields and resets an edited value when reopened', async () => {
    const interaction = userEvent.setup();
    const user = { id: 1, username: 'alice', email: 'alice@example.com', status: 'active', roles: [] };
    const { rerender } = render(<UserFormDialog open user={user} onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText('基本信息')).toBeInTheDocument();
    expect(screen.getByText('组织与权限')).toBeInTheDocument();
    const email = screen.getByLabelText(/邮箱/);
    expect(email).toHaveValue('alice@example.com');
    await interaction.clear(email);
    await interaction.type(email, 'changed@example.com');
    expect(email).toHaveValue('changed@example.com');
    rerender(<UserFormDialog open={false} user={user} onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    rerender(<UserFormDialog open user={user} onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/邮箱/)).toHaveValue('alice@example.com');
  });

  it('preserves edit payload filtering and routes submit to updateUser', async () => {
    const interaction = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    const user = { id: 1, username: 'alice', email: 'alice@example.com', status: 'active', roles: [] };
    const payload = buildUserPayload({
      username: 'alice',
      email: 'ali***@example.com',
      password: '',
      real_name: '',
      phone: '138****1001',
      department_id: '',
      status: 'active',
      role_ids: ['2'],
      access_level: 'SELF',
    }, true);
    expect(payload).not.toHaveProperty('password');
    expect(payload).not.toHaveProperty('email');
    expect(payload).not.toHaveProperty('phone');
    expect(payload.department_id).toBeNull();
    expect(payload.role_ids).toEqual(['2']);

    render(<UserFormDialog open user={user} onOpenChange={onOpenChange} onSuccess={onSuccess} />);
    await interaction.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(userApi.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({ username: 'alice' })));
    expect(userApi.updateUser.mock.calls[0][1]).not.toHaveProperty('password');
    expect(userApi.createUser).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('routes a new user to createUser', async () => {
    const interaction = userEvent.setup();
    render(<UserFormDialog open user={null} onOpenChange={vi.fn()} onSuccess={vi.fn()} />);
    await interaction.type(screen.getByLabelText(/用户名/), 'new_user');
    await interaction.type(screen.getByLabelText(/邮箱/), 'new@example.com');
    await interaction.type(screen.getByLabelText(/密码/), 'secret123');
    await interaction.click(screen.getByRole('button', { name: '保存' }));
    await waitFor(() => expect(userApi.createUser).toHaveBeenCalledWith(expect.objectContaining({
      username: 'new_user',
      email: 'new@example.com',
      department_id: null,
      role_ids: [],
    })));
    expect(userApi.updateUser).not.toHaveBeenCalled();
  });
});
```

该测试补充从 Testing Library 导入 `waitFor`，并从 `@/lib/api` 导入已 mock 的 `userApi`。`beforeEach` 清空 create/update mock，避免用例互相污染。

创建 `frontend/components/ui/dialog.test.jsx`，确认 overlay 定制只作用于显式传入的 Dialog：

```jsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dialog, DialogContent, DialogTitle } from './dialog';

describe('DialogContent overlayClassName', () => {
  it('keeps the default overlay and scopes a custom overlay', () => {
    const { rerender } = render(<Dialog open><DialogContent><DialogTitle>默认弹窗</DialogTitle></DialogContent></Dialog>);
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass('bg-black/50');
    rerender(<Dialog open><DialogContent overlayClassName="bg-slate-950/35 backdrop-blur-[1px]"><DialogTitle>用户弹窗</DialogTitle></DialogContent></Dialog>);
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass('bg-slate-950/35', 'backdrop-blur-[1px]');
  });
});
```

- [ ] **Step 2: 运行测试并确认 RED**

Run: `cd frontend && npm run test:ui -- components/users/user-form-dialog.test.jsx`

Expected: FAIL，因为当前没有分组标题，reset effect 也不依赖 `open`。

- [ ] **Step 3: 实现分区式 Dialog**

reset effect 只在打开时执行，并依赖 `open`：

```js
const EMPTY_USER_FORM = {
  username: '',
  email: '',
  password: '',
  real_name: '',
  phone: '',
  department_id: '',
  status: 'active',
  role_ids: [],
  access_level: 'SELF',
};

export function mapUserToForm(user) {
  if (!user) return { ...EMPTY_USER_FORM };
  return {
    username: user.username || '',
    email: user.email || '',
    password: '',
    real_name: user.real_name || '',
    phone: user.phone || '',
    department_id: user.department_id || '',
    status: user.status || 'active',
    role_ids: user.roles?.map((role) => role.id.toString()) || [],
    access_level: user.access_level || 'SELF',
  };
}

export function buildUserPayload(data, isEdit) {
  const submitData = { ...data };
  if (isEdit && !submitData.password) delete submitData.password;
  if (submitData.department_id === '') submitData.department_id = null;
  if (!submitData.role_ids) submitData.role_ids = [];
  return isEdit ? filterMaskedFields(submitData) : submitData;
}

useEffect(() => {
  if (!open) return;
  reset(mapUserToForm(user));
}, [open, user, reset]);
```

将默认值映射和提交转换分别提取为同文件导出纯函数 `mapUserToForm`、`buildUserPayload`；`onSubmit` 只根据 `isEdit` 调用 create/update API，保持字段与原 payload 完全一致。`DialogContent` 新增可选 `overlayClassName` 并传给内部 `DialogOverlay`，默认值不变；只有用户 Dialog 传入轻遮罩。Dialog 结构使用：

```jsx
<DialogContent overlayClassName="bg-slate-950/35 backdrop-blur-[1px]" className="flex max-h-[85vh] max-w-3xl flex-col gap-0 overflow-hidden p-0">
  <DialogHeader className="border-b px-6 py-5">
    <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
    <DialogDescription>{isEdit ? '修改用户信息与权限配置' : '创建用户并配置组织与权限'}</DialogDescription>
  </DialogHeader>
  <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-1 flex-col">
    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
      <section aria-labelledby="basic-user-fields">
        <h3 id="basic-user-fields" className="mb-4 text-sm font-semibold text-foreground">基本信息</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="username">用户名 <span className="text-destructive">*</span></Label>
            <Input id="username" {...register('username')} placeholder="请输入用户名" disabled={isEdit} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>
          <SensitiveInput name="email" label="邮箱" value={emailValue} isEdit={isEdit} required type="email" placeholder="请输入邮箱" register={register} setValue={setValue} errors={errors} />
          <div className="space-y-2">
            <Label htmlFor="password">密码 {!isEdit && <span className="text-destructive">*</span>}</Label>
            <Input id="password" type="password" {...register('password')} placeholder={isEdit ? '留空则不修改密码' : '请输入密码'} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <SensitiveInput name="real_name" label="真实姓名" value={realNameValue} isEdit={isEdit} placeholder="请输入真实姓名" register={register} setValue={setValue} errors={errors} />
          <SensitiveInput name="phone" label="手机号" value={phoneValue} isEdit={isEdit} placeholder="请输入手机号（11位中国手机号）" register={register} setValue={setValue} errors={errors} />
        </div>
      </section>
      <section aria-labelledby="user-access-fields">
        <h3 id="user-access-fields" className="mb-4 text-sm font-semibold text-foreground">组织与权限</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>所属部门</Label>
            <Select value={departmentIdValue || 'none'} onValueChange={(value) => setValue('department_id', value === 'none' ? '' : value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择部门" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">无</SelectItem>
                {flattenDepartments(departments).map((department) => (
                  <SelectItem key={department.id} value={department.id}>{'　'.repeat(department.level)}{department.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>数据查询权限</Label>
            <Select value={accessLevelValue} onValueChange={(value) => setValue('access_level', value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择数据查询权限" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="SELF">只能查看本人数据</SelectItem>
                <SelectItem value="DEPARTMENT">可查看本部门及下级数据</SelectItem>
                <SelectItem value="ALL">可查看所有数据</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>角色分配</Label>
            <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
              {roles.length === 0 ? <p className="text-sm text-muted-foreground">暂无可用角色</p> : roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role.id}`}
                    checked={roleIdsValue.includes(role.id.toString())}
                    onCheckedChange={(checked) => setValue('role_ids', checked ? [...roleIdsValue, role.id.toString()] : roleIdsValue.filter((id) => id !== role.id.toString()))}
                  />
                  <Label htmlFor={`role-${role.id}`} className="cursor-pointer font-normal">{role.name}</Label>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>状态</Label>
            <Select value={statusValue} onValueChange={(value) => setValue('status', value)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="选择状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">正常</SelectItem>
                <SelectItem value="inactive">禁用</SelectItem>
                <SelectItem value="banned">封禁</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
    </div>
    <DialogFooter className="border-t bg-muted/30 px-6 py-4">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? '保存中...' : '保存'}</Button>
    </DialogFooter>
  </form>
</DialogContent>
```

角色区域跨两列且保持 `max-h-40 overflow-y-auto`。SensitiveInput 的错误色改为 `text-destructive`，必填星号统一使用 `text-destructive`。

- [ ] **Step 4: 验证 GREEN 并提交**

Run:

```bash
cd frontend
npm run test:ui -- components/users/user-form-dialog.test.jsx components/ui/dialog.test.jsx
./node_modules/.bin/eslint --ext .jsx components/users/user-form-dialog.jsx components/users/user-form-dialog.test.jsx components/form/SensitiveInput.jsx components/ui/dialog.jsx components/ui/dialog.test.jsx --no-cache --max-warnings=0
```

Expected: tests PASS；定向 ESLint 无 error。

```bash
git add frontend/components/users/user-form-dialog.jsx frontend/components/users/user-form-dialog.test.jsx frontend/components/form/SensitiveInput.jsx frontend/components/ui/dialog.jsx frontend/components/ui/dialog.test.jsx
git commit -m "feat: refine user form dialog"
```

---

### Task 7: 全量验证、浏览器交互和设计 QA

**Files:**
- Create: `artifacts/ui-refresh/users-light-1440.png`
- Create: `artifacts/ui-refresh/users-dark-1440.png`
- Create: `artifacts/ui-refresh/users-dialog-1440.png`
- Create: `artifacts/ui-refresh/users-mobile-390.png`
- Create: `artifacts/ui-refresh/users-mobile-nav-390.png`
- Create: `artifacts/ui-refresh/users-tablet-1024.png`
- Create: `artifacts/ui-refresh/users-reference-1487.png`
- Create: `artifacts/ui-refresh/reference-vs-implementation.png`
- Create: `design-qa.md`
- Create: `frontend/test/ui-preview-server.mjs`
- Create: `frontend/test/ui-preview-isolation.test.js`
- Modify: `frontend/contexts/SocketContext.jsx`
- Modify if required by QA: `frontend/app/globals.css`
- Modify if required by QA: `frontend/app/(authenticated)/layout.js`
- Modify if required by QA: `frontend/components/layout/sidebar.jsx`
- Modify if required by QA: `frontend/components/layout/header.jsx`
- Modify if required by QA: `frontend/components/common/SearchFilter.jsx`
- Modify if required by QA: `frontend/components/common/DataTable.jsx`
- Modify if required by QA: `frontend/app/(authenticated)/setting/users/page.js`
- Modify if required by QA: `frontend/components/users/user-form-dialog.jsx`

**Interfaces:**
- Consumes: 已批准参考图、完成的 Next.js 实现、Browser in-app surface、本地隔离只读预览服务。
- Produces: 通过测试和构建的实现、不会连接真实 REST/Socket 后端的预览、同视口截图、`design-qa.md` 且 `final result: passed`。

- [ ] **Step 1: 运行自动化回归与定向静态检查**

Run:

```bash
cd frontend
npm run test:ui
./node_modules/.bin/eslint --ext .js,.jsx \
  'app/(authenticated)/layout.js' \
  'app/(authenticated)/setting/users/page.js' \
  components/layout/sidebar.jsx \
  components/layout/header.jsx \
  components/common/SearchFilter.jsx \
  components/common/DataTable.jsx \
  components/ui/pagination.jsx \
  components/users/user-form-dialog.jsx \
  components/form/SensitiveInput.jsx \
  contexts/SocketContext.jsx \
  --no-cache --max-warnings=0
```

Expected: UI tests全部 PASS；目标调用链 ESLint 无 error。项目其他页面的历史 lint 错误单独记录，不作为本轮新增回归。

- [ ] **Step 2: 运行生产构建**

Run: `cd frontend && npm run build`

Expected: Next.js production build exit 0。该命令会删除并重建旧 `.next`，不得使用旧构建产物替代。

- [ ] **Step 3: 建立可测试的本地只读预览服务**

创建 `frontend/test/ui-preview-server.mjs`，只使用 Node `http`，导出 `createPreviewServer()` 并在直接运行时监听传入端口。必须具备：

```js
const jsonRoutes = new Map([
  ['/api/system/users', previewUsersResponse],
  ['/api/system/menus/user-tree', previewMenusResponse],
  ['/api/system/system-config', { success: true, data: { system_name: 'Owl 管理平台', primary_color: 'blue', enable_theme_switch: true } }],
  ['/api/system/notifications/unread-count', { success: true, data: { count: 8 } }],
  ['/api/system/watermark/rendered', { success: true, data: { enabled: false, lines: [] } }],
  ['/api/system/data-security/fields', { success: true, data: { items: [] } }],
  ['/api/system/departments/tree', { success: true, data: [] }],
  ['/api/system/roles', { success: true, data: { items: [] } }],
]);
```

- GET 按 pathname 返回固定 JSON；用户路由额外按 `search` 过滤，并在响应中回写 page/limit/total。
- OPTIONS 返回 204；所有响应限定 `Access-Control-Allow-Origin: http://localhost:4173`。
- POST/PUT/PATCH/DELETE 固定返回 409 `{ success: false, message: 'UI preview is read only' }`，绝不代理。
- 未命中路径返回 404，不访问外网或真实后端。

在 `SocketContext.jsx` 的 `connectSocket` 开头增加：

```js
if (process.env.NEXT_PUBLIC_DISABLE_SOCKET === 'true') return null;
```

创建 `frontend/test/ui-preview-isolation.test.js`，文件首行使用 `// @vitest-environment node`，在随机端口启动 `createPreviewServer()`，断言 GET users 返回样例、PUT users 返回 409；同时读取 `SocketContext.jsx` 断言存在 `NEXT_PUBLIC_DISABLE_SOCKET` 守卫。

Run: `cd frontend && npm run test:ui -- test/ui-preview-isolation.test.js`

Expected: PASS；预览服务只读，Socket 可由显式 QA 环境变量关闭。

- [ ] **Step 4: 启动隔离前端预览**

在两个独立的长运行终端会话中启动，并记录会话 ID 供结束时精确停止。

Terminal A:

```bash
cd frontend
node test/ui-preview-server.mjs --port 4180
```

Terminal B:

```bash
cd frontend
NEXT_PUBLIC_API_URL=http://127.0.0.1:4180/api NEXT_PUBLIC_DISABLE_SOCKET=true npm run dev -- --hostname 0.0.0.0 --port 4173
```

Expected: 只读 mock 监听 4180，前端监听 4173；REST 指向 mock，Socket 完全禁用。保持两个进程运行直至 QA 结束。

- [ ] **Step 5: 使用 in-app Browser 建立安全预览状态**

按照 Browser skill 连接 in-app surface。先打开公开的 `http://localhost:4173/login` 建立同源页面，再在该页面上下文设置隔离认证，最后才导航到受保护页面；不得先打开 `/setting/users`，也不依赖 Browser 未确认支持的 route/addInitScript API：

```js
localStorage.setItem('__platform_id', 'ui-preview');
localStorage.setItem('ui-preview__token', 'preview-only');
localStorage.setItem('ui-preview__user', JSON.stringify({
  id: 'preview',
  username: 'preview',
  real_name: 'UI Preview',
  email: 'preview@example.invalid',
  roles: [{ code: 'super_admin' }],
}));
location.assign('/setting/users');
```

确认页面进入 `/setting/users`，且 Network 中所有业务请求只访问 `127.0.0.1:4180`；不得出现 `localhost:3001` 或其他真实 API host。只读服务中的用户列表固定返回下列结构，总数为 128：

```js
const previewUsersResponse = {
  success: true,
  data: {
    items: [
      { id: 1, username: 'zhangsan', real_name: '张三', email: 'zha***@example.com', phone: '138****1001', status: 'active', last_login_at: '2026-08-25T01:32:00.000Z' },
      { id: 2, username: 'lisi', real_name: '李四', email: 'lis***@example.com', phone: '138****1002', status: 'active', last_login_at: '2026-08-25T00:15:00.000Z' },
      { id: 3, username: 'wangwu', real_name: '王五', email: 'wan***@example.com', phone: '138****1003', status: 'active', last_login_at: '2026-08-24T14:47:00.000Z' },
      { id: 4, username: 'zhaoliu', real_name: '赵六', email: 'zha***@example.com', phone: '138****1004', status: 'active', last_login_at: '2026-08-24T10:03:00.000Z' },
      { id: 5, username: 'sunqi', real_name: '孙七', email: 'sun***@example.com', phone: '138****1005', status: 'active', last_login_at: '2026-08-24T08:20:00.000Z' },
      { id: 6, username: 'zhouba', real_name: '周八', email: 'zho***@example.com', phone: '138****1006', status: 'active', last_login_at: '2026-08-24T06:11:00.000Z' },
      { id: 7, username: 'wujiu', real_name: '吴九', email: 'wuj***@example.com', phone: '138****1007', status: 'inactive', last_login_at: '2026-08-20T03:32:00.000Z' },
      { id: 8, username: 'zhengshi', real_name: '郑十', email: 'zhe***@example.com', phone: '138****1008', status: 'active', last_login_at: '2026-08-23T09:58:00.000Z' },
      { id: 9, username: 'chenshiyi', real_name: '陈十一', email: 'che***@example.com', phone: '138****1009', status: 'active', last_login_at: '2026-08-24T01:45:00.000Z' },
      { id: 10, username: 'huangshier', real_name: '黄十二', email: 'hua***@example.com', phone: '138****1010', status: 'active', last_login_at: '2026-08-21T02:21:00.000Z' },
    ],
    pagination: { page: 1, limit: 10, total: 128, totalPages: 13 },
  },
};

const previewMenusResponse = {
  success: true,
  data: {
    businessMenus: [{ id: 1, name: '工作台', path: '/dashboard', icon: 'LayoutDashboard', children: [] }],
    systemMenus: [
      { id: 2, name: '组织架构', path: '/setting/departments', icon: 'Network', children: [] },
      { id: 3, name: '角色管理', path: '/setting/roles', icon: 'ShieldCheck', children: [] },
      { id: 4, name: '用户管理', path: '/setting/users', icon: 'Users', children: [] },
      { id: 5, name: '系统设置', path: '/setting/system', icon: 'Settings', children: [] },
    ],
  },
};
```

系统配置返回 `{ success: true, data: { system_name: 'Owl 管理平台', primary_color: 'blue', enable_theme_switch: true } }`；通知数返回 `{ success: true, data: { count: 8 } }`；水印、敏感字段、部门和角色返回成功的空集合。所有 POST/PUT/PATCH/DELETE 由只读服务明确返回 409，防止写入真实数据。

- [ ] **Step 6: 测试主要交互并检查控制台**

验证：

```text
Sidebar 当前项与菜单展开/收起
390px 下移动导航打开、关闭、遮罩点击与 Esc
搜索与重置
分页与每页条数
状态 Switch 的 UI 乐观状态（写请求被 abort 后应回滚）
编辑、删除按钮权限可见性
删除确认 Dialog 的打开/取消
新增用户 Dialog 的打开、滚动、字段聚焦、取消、Esc
浅色/深色切换
```

Expected: 核心交互可操作；无 hydration error、React key error、不可解释的 console error。被刻意中止的写请求可记录为预期验证行为。

- [ ] **Step 7: 捕获同状态截图**

在 1440×900 捕获浅色用户列表、深色用户列表和新增用户 Dialog；在 1024×768 捕获平板布局；在 390×844 分别捕获主内容和打开的移动导航。保存到 `artifacts/ui-refresh/`。已选参考图的原始尺寸是 1487×1058，因此全视图对比再以 1487×1058 捕获一次实现并保存为 `users-reference-1487.png`。

每次截图前在页面记录 `window.innerWidth`、`window.innerHeight` 与 `window.devicePixelRatio`，截图后使用本地图片元数据确认实际 PNG 像素尺寸。优先使用 Browser 支持的 DPR 1 上下文；若所选 in-app Browser 无法改变 DPR，则保持相同 CSS viewport，把参考图和实现图统一无裁切缩放到同一像素尺寸，并在 `design-qa.md` 明确记录原始 DPR、原始像素尺寸和归一化方式，不能只写“保证 DPR 1”。

- [ ] **Step 8: 执行 design-qa 阻塞循环**

将参考图与 1487×1058 实现截图合成为 `artifacts/ui-refresh/reference-vs-implementation.png` 后一并打开检查。`design-qa.md` 必须记录：

```markdown
source visual truth path
implementation screenshot path
viewport and DPR
light theme user-list state
full-view comparison evidence
focused sidebar, toolbar, table and dialog comparisons
fonts/typography
spacing/layout rhythm
colors/tokens
image/icon fidelity
copy/content
approved deviations from the reference
P0/P1/P2/P3 findings
comparison history
final result: blocked|passed
```

`approved deviations` 必须明确列出参考图中因项目没有真实数据来源或本轮未获功能授权而不实现的元素：全局搜索、生产环境选择器、照片头像、状态标签页、批量选择与批量动作、部门/角色/账号状态筛选、刷新/列设置/导出、额外角色与数据范围列。它们不作为视觉缺陷；侧栏层级、蓝色支撑、工作区密度、标题/工具栏/表格/分页节奏仍必须对齐。

发现 P0/P1/P2 时先写失败报告、修复、重截、再比较；只有无可执行 P0/P1/P2 时才能写 `final result: passed`。

- [ ] **Step 9: 停止预览、最终回归并提交**

先通过记录的两个终端会话分别发送中断并确认 4173、4180 均不再监听；不得在 Next dev 仍运行时执行会删除 `.next` 的 build。

Run:

```bash
cd frontend
npm run test:ui
npm run build
cd ..
git diff --check
git status --short
```

Expected: tests/build PASS；`git diff --check` 无输出；状态中不包含被暂存的 `backend/logs/**`。

```bash
git diff --name-only
git add \
  design-qa.md \
  artifacts/ui-refresh/users-light-1440.png \
  artifacts/ui-refresh/users-dark-1440.png \
  artifacts/ui-refresh/users-dialog-1440.png \
  artifacts/ui-refresh/users-mobile-390.png \
  artifacts/ui-refresh/users-mobile-nav-390.png \
  artifacts/ui-refresh/users-tablet-1024.png \
  artifacts/ui-refresh/users-reference-1487.png \
  artifacts/ui-refresh/reference-vs-implementation.png \
  frontend/test/ui-preview-server.mjs \
  frontend/test/ui-preview-isolation.test.js \
  frontend/test/setup.js \
  frontend/test/smoke.test.js \
  frontend/test/theme-shell-contract.test.js \
  frontend/contexts/SocketContext.jsx \
  frontend/app/globals.css \
  'frontend/app/(authenticated)/layout.js' \
  'frontend/app/(authenticated)/layout.test.jsx' \
  'frontend/app/(authenticated)/setting/users/page.js' \
  'frontend/app/(authenticated)/setting/users/page.test.jsx' \
  frontend/components/layout/sidebar.jsx \
  frontend/components/layout/header.jsx \
  frontend/components/layout/header.test.jsx \
  frontend/components/common/SearchFilter.jsx \
  frontend/components/common/SearchFilter.test.jsx \
  frontend/components/common/DataTable.jsx \
  frontend/components/common/DataTable.test.jsx \
  frontend/components/ui/table-loading.jsx \
  frontend/components/ui/pagination.jsx \
  frontend/components/ui/pagination.test.jsx \
  frontend/components/ui/badge.jsx \
  frontend/components/ui/checkbox.jsx \
  frontend/components/ui/dialog.jsx \
  frontend/components/ui/dialog.test.jsx \
  frontend/components/users/user-form-dialog.jsx \
  frontend/components/users/user-form-dialog.test.jsx \
  frontend/components/form/SensitiveInput.jsx
git commit -m "test: verify admin ui refresh"
```

提交前再次运行 `git diff --cached --name-only`，若出现上述清单之外的路径（尤其 `backend/logs/**`）则停止并修正暂存范围。
