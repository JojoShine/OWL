'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { getMenuIcon } from '@/lib/config/menu-icons';
import { Loading } from '@/components/ui/loading';
import { menuApi } from '@/lib/api';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, ChevronRight, ChevronsUpDown, LogOut, User } from 'lucide-react';
import { useSocket } from '@/contexts/SocketContext';
import { useColorTheme } from '@/lib/utils/theme';
import { useAuth } from '@/lib/utils/auth';
import { systemConfigApi } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/utils/http-client';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function SidebarUserMenu() {
  const { user, logout } = useAuth();
  const displayName = user?.real_name || user?.username || '用户';
  const secondaryText = user?.email || (user?.username ? `@${user.username}` : '当前账号');
  const initials = (user?.username || displayName).charAt(0).toUpperCase();

  return (
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto w-full justify-start gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-sidebar-accent-foreground">
                {displayName}
              </span>
              <span className="mt-0.5 block truncate text-xs font-normal text-sidebar-foreground/60">
                {secondaryText}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-sidebar-foreground/45" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-0"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="space-y-1">
              <p className="truncate text-sm font-medium leading-none">{displayName}</p>
              {user?.username ? (
                <p className="truncate text-xs leading-none text-muted-foreground">@{user.username}</p>
              ) : null}
              {user?.email ? (
                <p className="truncate text-xs leading-none text-muted-foreground">{user.email}</p>
              ) : null}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="h-4 w-4" />
            <span>个人信息</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="h-4 w-4" />
            <span>退出登录</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
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
            href={item.path}
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

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const [businessMenus, setBusinessMenus] = useState([]);
  const [systemMenus, setSystemMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const { socket, isConnected } = useSocket();
  const { applySystemConfigTheme } = useColorTheme();
  const [systemName, setSystemName] = useState('Owl管理平台');
  const [logoUrl, setLogoUrl] = useState(`${basePath}/logo.png`);

  // 获取系统配置并应用主题
  const fetchSystemConfig = useCallback(async () => {
    try {
      const response = await systemConfigApi.getConfig();
      if (response?.success) {
        if (response.data?.primary_color) {
          applySystemConfigTheme(response.data.primary_color);
        }
        if (response.data?.system_name) {
          setSystemName(response.data.system_name);
        }
        if (response.data?.logo_url) {
          const url = response.data.logo_url;
          const fullUrl = url.startsWith('http')
            ? url
            : `${getApiBaseUrl()}${url}`;
          if (fullUrl) setLogoUrl(fullUrl);
        }
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  }, [applySystemConfigTheme]);

  // 获取用户菜单的函数
  const fetchUserMenus = useCallback(async () => {
    try {
      const response = await menuApi.getUserMenus();
      const { businessMenus: business, systemMenus: system } = response.data || {};
      setBusinessMenus(business || []);
      setSystemMenus(system || []);
    } catch (error) {
      console.error('获取菜单失败:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载菜单和系统配置
  useEffect(() => {
    fetchUserMenus();
    fetchSystemConfig();
    setExpandedMenus(new Set());
    // 两个请求仅在挂载时执行；主题 hook 返回的应用函数当前不是稳定引用。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听WebSocket菜单更新事件
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleMenuUpdated = () => {
      console.log('Menu updated event received');
      fetchUserMenus();
    };

    socket.on('menu:updated', handleMenuUpdated);

    return () => {
      socket.off('menu:updated', handleMenuUpdated);
    };
  }, [socket, isConnected, fetchUserMenus]);

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
        <h2 className="mb-2 px-3 text-xs font-medium tracking-wide text-sidebar-foreground/55">
          {title}
        </h2>
        <div className="space-y-1">
          {menus.map((item) => (
            <MenuItemComponent
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
      <div className="flex h-14 items-center gap-3 border-b border-sidebar-border px-5">
        {logoUrl ? (
          // 系统 Logo 可由后端配置为任意资源地址，无法预先加入 Next Image 域名白名单。
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt="Logo"
            className="w-8 h-8 rounded dark:invert"
          />
        ) : null}
        <h1 className="text-lg font-semibold">{systemName}</h1>
      </div>

      {/* 菜单区域 */}
      <nav className="scrollbar-hide flex-1 overflow-y-auto overscroll-contain px-3 py-4">
        {loading ? (
          <Loading size="sm" variant="pulse" />
        ) : businessMenus.length === 0 && systemMenus.length === 0 ? (
          <div className="py-4 text-center text-sm text-sidebar-foreground/60">
            暂无可用菜单
          </div>
        ) : (
          <div className="space-y-6">
            {renderMenuGroup('业务应用', businessMenus)}
            {renderMenuGroup('系统管理', systemMenus)}
          </div>
        )}
      </nav>

      <SidebarUserMenu />
    </div>
  );
}
