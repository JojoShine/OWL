'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { menuApi, systemConfigApi } from '@/lib/api';
import { useSocket } from './SocketContext';
import { useColorTheme } from '@/lib/utils/theme';

const AppShellDataContext = createContext(null);

export function AppShellDataProvider({ children }) {
  const [businessMenus, setBusinessMenus] = useState([]);
  const [systemMenus, setSystemMenus] = useState([]);
  const [menusLoading, setMenusLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState({});
  const { socket, isConnected } = useSocket();
  const { applySystemConfigTheme } = useColorTheme();

  const refreshMenus = useCallback(async () => {
    try {
      const response = await menuApi.getUserMenus();
      const data = response?.data || {};
      setBusinessMenus(data.businessMenus || []);
      setSystemMenus(data.systemMenus || []);
    } catch (error) {
      console.error('获取菜单失败:', error);
    } finally {
      setMenusLoading(false);
    }
  }, []);

  const refreshSystemConfig = useCallback(async () => {
    try {
      const response = await systemConfigApi.getConfig();
      if (!response?.success) return;
      const nextConfig = response.data || {};
      setSystemConfig(nextConfig);
      if (nextConfig.primary_color) applySystemConfigTheme(nextConfig.primary_color);
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  }, [applySystemConfigTheme]);

  useEffect(() => {
    refreshMenus();
    refreshSystemConfig();
  }, [refreshMenus, refreshSystemConfig]);

  useEffect(() => {
    if (!socket || !isConnected) return undefined;
    socket.on('menu:updated', refreshMenus);
    return () => socket.off('menu:updated', refreshMenus);
  }, [socket, isConnected, refreshMenus]);

  const value = useMemo(() => ({
    businessMenus,
    systemMenus,
    menusLoading,
    systemConfig,
    refreshMenus,
    refreshSystemConfig,
  }), [businessMenus, systemMenus, menusLoading, systemConfig, refreshMenus, refreshSystemConfig]);

  return <AppShellDataContext.Provider value={value}>{children}</AppShellDataContext.Provider>;
}
export function useAppShellData() {
  const context = useContext(AppShellDataContext);
  if (!context) throw new Error('useAppShellData must be used within AppShellDataProvider');
  return context;
}
