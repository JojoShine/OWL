
import { useAuth } from '@/lib/utils/auth';
import { ColorThemeToggle } from '@/components/layout/theme/color-theme-toggle';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import NotificationIcon from '@/components/notification/NotificationIcon';
import { Button } from '@/components/ui/button';
import { Menu, PanelLeft } from 'lucide-react';
import { useAppShellData } from '@/contexts/AppShellDataContext';

export default function Header({ onMenuClick, isDesktop = false, navExpanded = false }) {
  const { user } = useAuth();
  const { systemConfig } = useAppShellData();
  const enableThemeSwitch = systemConfig.enable_theme_switch ?? true;
  const menuLabel = isDesktop ? (navExpanded ? '收起侧栏' : '展开侧栏') : (navExpanded ? '关闭导航菜单' : '打开导航菜单');
  const MenuIcon = isDesktop ? PanelLeft : Menu;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={menuLabel}
          title={menuLabel}
          aria-controls="app-sidebar"
          aria-expanded={navExpanded}
          className="rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onMenuClick}
        >
          <MenuIcon aria-hidden="true" className="size-[18px]" strokeWidth={1.75} />
        </Button>
        <h2 className="text-sm font-medium">
          欢迎回来，{user?.real_name || user?.username || '用户'}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* 深浅色切换 */}
        {enableThemeSwitch && <><ColorThemeToggle /><ThemeToggle /></>}

        {/* 通知图标 */}
        <NotificationIcon />
      </div>
    </header>
  );
}
