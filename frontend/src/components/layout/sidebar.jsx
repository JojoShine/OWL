import { getBasePath } from '@/lib/config/runtime';

import { useState, useCallback } from 'react';
import { Dropdown, Tooltip } from 'antd';
import { Link } from 'react-router-dom';
import { usePathname } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import { getMenuIcon } from '@/lib/config/menu-icons';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ChevronDown, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/utils/auth';
import { getApiBaseUrl } from '@/lib/utils/http-client';
import { useAppShellData } from '@/contexts/AppShellDataContext';

const basePath = getBasePath();

function SidebarUserMenu({ collapsed }) {
  const { user, logout } = useAuth();
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const displayName = user?.real_name || user?.username || '用户';
  const roleText = user?.roles
    ?.map((role) => (typeof role === 'string' ? role : role?.name || role?.code))
    .filter(Boolean)
    .join('、') || '未分配角色';
  const emailText = user?.email || '未填写邮箱';
  const departmentText = user?.department?.name || user?.department_name || '未分配部门';
  const initials = (user?.username || displayName).charAt(0).toUpperCase();

  return (
    <>
      <div className="border-t border-sidebar-border px-3 py-2.5">
        <div className={cn('flex items-center gap-2.5 rounded-lg', collapsed ? 'flex-col' : 'px-1.5')} title={collapsed ? displayName : undefined}>
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-sidebar-accent text-xs text-sidebar-accent-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className={cn('min-w-0 flex-1 leading-4', collapsed && 'hidden')}>
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground" title={displayName}>
              {displayName}
            </p>
            <p
              className="truncate text-[11px] text-sidebar-foreground/60"
              title={`${roleText} · ${departmentText}`}
            >
              {roleText} · {departmentText}
            </p>
            <p className="truncate text-[11px] text-sidebar-foreground/45" title={emailText}>
              {emailText}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="退出登录"
            title="退出登录"
            onClick={() => setLogoutConfirmOpen(true)}
            className="h-7 w-7 shrink-0 text-sidebar-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={logoutConfirmOpen}
        onOpenChange={setLogoutConfirmOpen}
        onConfirm={logout}
        title="确认退出登录"
        description="确定退出当前账号吗？退出后需要重新登录。"
        confirmText="退出登录"
        cancelText="取消"
        variant="default"
      />
    </>
  );
}

// 单个菜单项组件 - 使用React.memo优化
const MenuItemComponent = ({
  item,
  level = 0,
  expandedMenus,
  toggleMenu,
  pathname,
  onNavigate,
}) => {
  const Icon = getMenuIcon(item.icon);
  const isActive = pathname === item.path;
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus.has(item.id);
  const hasValidPath = item.path && item.path !== '#';
  const expansionLabel = `${isExpanded ? '收起' : '展开'}${item.name}`;
  const rowClassName = cn(
    'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
    level > 0 && 'ml-4',
    isActive
      ? 'relative bg-sidebar-accent text-sidebar-primary font-medium before:absolute before:left-0 before:top-1/2 before:h-5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-sidebar-primary'
      : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground'
  );

  return (
    <div key={item.id}>
      {hasValidPath ? (
        <div className={rowClassName}>
          <Link
            to={item.path}
            className="flex min-w-0 flex-1 items-center gap-2"
            onClick={onNavigate}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.name}</span>
          </Link>
          {hasChildren && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-label={expansionLabel}
              onClick={() => toggleMenu(item.id)}
              className="shrink-0 p-0 hover:opacity-70"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
        </div>
      ) : hasChildren ? (
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={expansionLabel}
          className={cn(rowClassName, 'w-full cursor-pointer text-left')}
          onClick={() => toggleMenu(item.id)}
        >
          <Icon className="h-4 w-4" />
          <span className="flex-1">{item.name}</span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0" />
          )}
        </button>
      ) : (
        <div className={rowClassName}>
          <div className="flex flex-1 items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.name}</span>
          </div>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children.map(child => (
            <MenuItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              expandedMenus={expandedMenus}
              toggleMenu={toggleMenu}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function CollapsedMenuItem({ item, pathname, onNavigate }) {
  const Icon = getMenuIcon(item.icon);
  const hasChildren = Boolean(item.children?.length);
  const active = (menu) => menu.path === pathname || menu.children?.some(active);
  const linkable = (menu) => menu.path?.startsWith('/') && !menu.path.startsWith('//');
  const label = (menu) => linkable(menu) ? <Link to={menu.path} onClick={onNavigate}>{menu.name}</Link> : menu.name;
  const menuItems = (menus) => menus.map((menu) => ({
    key: String(menu.id), label: label(menu),
    children: menu.children?.length ? menuItems(menu.children) : undefined,
  }));
  const className = cn('flex size-10 items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring',
    active(item) ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground');
  if (hasChildren) return <Dropdown placement="rightTop" align={{ offset: [24, 0] }} trigger={['hover', 'click']} menu={{ items: [
    ...(linkable(item) ? [{ key: `self-${item.id}`, label: label(item) }, { type: 'divider' }] : []),
    ...menuItems(item.children),
  ] }}>
    <button type="button" className={className} aria-label={item.name} aria-haspopup="menu"><Icon className="size-4" /></button>
  </Dropdown>;
  return <Tooltip title={item.name} placement="right">
    {linkable(item) ? <Link to={item.path} onClick={onNavigate} className={className} aria-label={item.name} aria-current={active(item) ? 'page' : undefined}><Icon className="size-4" /></Link>
      : <span className={className} aria-label={item.name}><Icon className="size-4" /></span>}
  </Tooltip>;
}

export default function Sidebar({ onNavigate, collapsed = false }) {
  const pathname = usePathname();
  const { businessMenus, systemMenus, menusLoading: loading, systemConfig } = useAppShellData();
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const systemName = systemConfig.system_name || 'Owl管理平台';
  const configuredLogo = systemConfig.logo_url;
  const logoUrl = configuredLogo
    ? (configuredLogo.startsWith('http') ? configuredLogo : `${getApiBaseUrl()}${configuredLogo}`)
    : `${basePath}/logo.png`;

  // 切换菜单展开/收起状态
  const toggleMenu = useCallback((menuId) => {
    setExpandedMenus(prev => {
      const next = new Set(prev);
      if (next.has(menuId)) {
        next.delete(menuId);
      } else {
        next.add(menuId);
      }
      return next;
    });
  }, []);

  const renderMenuGroup = (title, menus) => {
    if (menus.length === 0) return null;

    return (
      <section>
        <h2 className={cn('mb-2 px-3 text-xs font-medium tracking-wide text-sidebar-foreground/55', collapsed && 'sr-only')}>
          {title}
        </h2>
        <div className="space-y-1">
          {menus.map((item) => (
            collapsed ? <CollapsedMenuItem key={item.id} item={item} pathname={pathname} onNavigate={onNavigate} /> : <MenuItemComponent
              key={item.id}
              item={item}
              expandedMenus={expandedMenus}
              toggleMenu={toggleMenu}
              pathname={pathname}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo区域 */}
      <div className={cn('flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        {logoUrl ? (
          // 系统 Logo 可由后端配置为任意资源地址，无法预先加入 Next Image 域名白名单。
          <img
            src={logoUrl}
            alt="Logo"
            className="w-8 h-8 rounded dark:invert"
          />
        ) : null}
        <h1 className={cn('text-lg font-semibold', collapsed && 'sr-only')}>{systemName}</h1>
      </div>

      {/* 菜单区域 */}
      <nav className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        {loading ? (
          <Loading size="sm" variant="pulse" />
        ) : businessMenus.length === 0 && systemMenus.length === 0 ? (
          <EmptyState title="暂无可用菜单" compact className="py-4" />
        ) : (
          <div className="space-y-6">
            {renderMenuGroup('业务应用', businessMenus)}
            {renderMenuGroup('系统管理', systemMenus)}
          </div>
        )}
      </nav>

      <SidebarUserMenu collapsed={collapsed} />
    </div>
  );
}
