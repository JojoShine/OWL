'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { getStorageKey } from '@/lib/utils/storage-key';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  // 获取token
  const getToken = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(getStorageKey('token'));
    }
    return null;
  }, []);

  // 连接Socket.io服务器
  const connectSocket = useCallback(() => {
    const token = getToken();

    if (!token) {
      // console.log('No token found, skipping socket connection');
      return;
    }

    // 如果已经有连接，先断开
    if (socket) {
      socket.disconnect();
    }

    // 生产环境使用域名根路径，开发环境使用完整URL
    const socketUrl = process.env.NODE_ENV === 'production' ? '/' : 'http://localhost:3001';
    // 提取路径前缀（如 /owl）
    const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
    const socketPath = basePath ? `${basePath}/socket.io/` : '/socket.io/';

    // console.log('Connecting to WebSocket server:', socketUrl, 'with path:', socketPath);

    const newSocket = io(socketUrl, {
      path: socketPath,
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // 最大延迟10秒
      reconnectionAttempts: Infinity, // 无限重连
    });

    // 连接成功
    newSocket.on('connect', () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    // 连接错误
    newSocket.on('connect_error', (error) => {
      // console.error('Socket.io connection error:', error.message);
      setIsConnected(false);
      setIsReconnecting(true);
      setConnectionError(error.message);
      reconnectAttemptsRef.current++;

      // 如果是认证错误（token过期或无效），停止重连
      if (error.message.includes('Authentication') || error.message.includes('认证失败')) {
        // console.error('Authentication failed, stopping reconnection');
        newSocket.disconnect();
        setIsReconnecting(false);
      }
    });

    // 断开连接
    newSocket.on('disconnect', (reason) => {
      // console.log('Socket.io disconnected:', reason);
      setIsConnected(false);

      // 如果是服务器断开或网络问题，标记为重连中
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'ping timeout') {
        // console.log('Connection lost, will attempt to reconnect...');
        setIsReconnecting(true);
      }
    });

    // 重连尝试
    newSocket.on('reconnect_attempt', (attemptNumber) => {
      // console.log(`Reconnection attempt #${attemptNumber}...`);
      setIsReconnecting(true);
    });

    // 重连成功
    newSocket.on('reconnect', (attemptNumber) => {
      // console.log('Socket.io reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setIsReconnecting(false);
      setConnectionError(null);
      reconnectAttemptsRef.current = 0;
    });

    // 重连失败 (注意：由于设置了无限重连，这个事件理论上不会触发)
    newSocket.on('reconnect_failed', () => {
      // console.error('Socket.io reconnection failed');
      setIsReconnecting(false);
      setConnectionError('Failed to reconnect to server');
    });

    setSocket(newSocket);

    return newSocket;
  }, [socket, getToken]);

  // 断开连接
  const disconnectSocket = useCallback(() => {
    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [socket]);

  // 监听特定事件
  const on = useCallback((event, callback) => {
    if (socket) {
      socket.on(event, callback);
    }
  }, [socket]);

  // 取消监听事件
  const off = useCallback((event, callback) => {
    if (socket) {
      socket.off(event, callback);
    }
  }, [socket]);

  // 发送事件
  const emit = useCallback((event, data) => {
    if (socket && isConnected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket is not connected, cannot emit event:', event);
    }
  }, [socket, isConnected]);

  // 组件挂载时连接
  useEffect(() => {
    const token = getToken();
    if (token) {
      connectSocket();
    }

    // 组件卸载时断开
    return () => {
      disconnectSocket();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 监听token变化（登录/登出）
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === getStorageKey('token')) {
        if (e.newValue) {
          // 登录了，连接socket
          connectSocket();
        } else {
          // 登出了，断开socket
          disconnectSocket();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    socket,
    isConnected,
    isReconnecting,
    connectionError,
    connect: connectSocket,
    disconnect: disconnectSocket,
    on,
    off,
    emit,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
