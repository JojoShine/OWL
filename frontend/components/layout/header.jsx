'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/utils/auth';
import { ThemeToggle } from '@/components/layout/theme/theme-toggle';
import NotificationIcon from '@/components/notification/NotificationIcon';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, Menu, User } from 'lucide-react';
import { systemConfigApi } from '@/lib/api';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
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

  const handleLogout = () => {
    logout();
  };

  // 获取用户名首字母作为头像
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

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

        {/* 用户菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(user?.username)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.real_name || user?.username}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>个人信息</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
