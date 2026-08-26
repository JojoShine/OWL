'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/utils/auth';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import NotificationIcon from '@/components/notification/NotificationIcon';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { systemConfigApi } from '@/lib/api';

export default function Header({ onMenuClick }) {
  const { user } = useAuth();
  const [enableThemeSwitch, setEnableThemeSwitch] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const response = await systemConfigApi.getConfig();
      if (response.success) {
        setEnableThemeSwitch(response.data?.enable_theme_switch ?? true);
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="打开导航菜单"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-sm font-medium">
          欢迎回来，{user?.real_name || user?.username || '用户'}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* 深浅色切换 */}
        {enableThemeSwitch && <ThemeToggle />}

        {/* 通知图标 */}
        <NotificationIcon />
      </div>
    </header>
  );
}
