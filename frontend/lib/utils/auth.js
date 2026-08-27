'use client';

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi } from '../api';
import { getStorageKey } from './storage-key';
import { syncUiPreviewAuth } from './ui-preview-auth';

// 创建认证Context
const AuthContext = createContext({});

// 自定义Hook：使用认证状态
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内部使用');
  }
  return context;
};

// 认证Provider组件
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('登出API调用失败:', error);
    } finally {
      localStorage.removeItem(getStorageKey('token'));
      localStorage.removeItem(getStorageKey('user'));
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  // 初始化：从localStorage加载用户信息
  useEffect(() => {
    let isActive = true;

    const initAuth = () => {
      try {
        syncUiPreviewAuth({
          storage: localStorage,
          nodeEnv: process.env.NODE_ENV,
          previewEnabled: process.env.NEXT_PUBLIC_UI_PREVIEW,
          hostname: window.location.hostname,
        });

        const token = localStorage.getItem(getStorageKey('token'));
        const userStr = localStorage.getItem(getStorageKey('user'));

        if (token && userStr) {
          const userData = JSON.parse(userStr);
          setUser(userData);

          // 先使用本地信息快速渲染，再后台同步角色、部门等最新资料。
          if (token !== 'preview-only') {
            authApi.getCurrentUser()
              .then((response) => {
                if (!isActive || !response?.data) return;
                localStorage.setItem(getStorageKey('user'), JSON.stringify(response.data));
                setUser(response.data);
              })
              .catch((error) => {
                console.error('同步用户信息失败:', error);
              });
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isActive = false;
    };
  }, [logout]);

  // 监听WebSocket事件（被踢出通知）
  useEffect(() => {
    if (!user || typeof window === 'undefined') return;

    const handleSessionKicked = (data) => {
      console.warn('Session kicked:', data);

      // 显示更友好的通知
      toast.error(
        '账户在其他设备登录',
        {
          description: `设备: ${data.newLogin.device}\n位置: ${data.newLogin.location}\n时间: ${data.newLogin.time}`,
          duration: 10000,
        }
      );

      // 3秒后自动登出
      setTimeout(() => {
        logout();
      }, 3000);
    };

    // 使用 SocketContext 的 socket 实例
    const socket = window.socket || (typeof window !== 'undefined' && window.__socketInstance);
    
    if (socket) {
      socket.on('session:kicked', handleSessionKicked);

      return () => {
        socket.off('session:kicked', handleSessionKicked);
      };
    }
  }, [logout, user]);

  // 登录
  const login = useCallback(async (credentials) => {
    try {
      const response = await authApi.login(credentials);
      const { token, user: userData } = response.data;

      // 保存到localStorage（使用命名空间化的key）
      localStorage.setItem(getStorageKey('token'), token);
      localStorage.setItem(getStorageKey('user'), JSON.stringify(userData));

      // 更新状态
      setUser(userData);

      return { success: true, data: response.data };
    } catch (error) {
      console.error('登录失败:', error);
      return {
        success: false,
        error: error.response?.data?.message || '登录失败',
      };
    }
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      const response = await authApi.getCurrentUser();
      const userData = response.data;

      // 更新localStorage和状态（使用命名空间化的key）
      localStorage.setItem(getStorageKey('user'), JSON.stringify(userData));
      setUser(userData);

      return { success: true, data: userData };
    } catch (error) {
      console.error('刷新用户信息失败:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // 检查是否已登录
  const isAuthenticated = useCallback(() => {
    return !!user && !!localStorage.getItem(getStorageKey('token'));
  }, [user]);

  // 检查权限
  const hasPermission = useCallback((resource, action) => {
    if (!user || !user.roles) return false;

    // 超级管理员拥有所有权限
    if (user.roles.some((role) => role.code === 'super_admin')) {
      return true;
    }

    // 从用户的所有角色中收集权限并检查
    return user.roles.some((role) =>
      role.permissions?.some(
        (permission) =>
          permission.resource === resource && permission.action === action
      )
    );
  }, [user]);

  // 检查角色
  const hasRole = useCallback((roleCode) => {
    if (!user || !user.roles) return false;
    return user.roles.some((role) => role.code === roleCode);
  }, [user]);

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    logout,
    refreshUser,
    isAuthenticated,
    hasPermission,
    hasRole,
  }), [hasPermission, hasRole, isAuthenticated, isLoading, login, logout, refreshUser, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 工具函数：获取token
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(getStorageKey('token'));
  }
  return null;
};

// 工具函数：获取用户信息
export const getUser = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem(getStorageKey('user'));
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('解析用户信息失败:', error);
        return null;
      }
    }
  }
  return null;
};
