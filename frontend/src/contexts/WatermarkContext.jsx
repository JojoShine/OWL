
import React, { createContext, useContext, useState, useEffect } from 'react';
import { watermarkApi } from '@/lib/api';

const WatermarkContext = createContext();

export function WatermarkProvider({ children }) {
  const [config, setConfig] = useState({
    enabled: false,
    lines: [],
    font_size: 24,
    font_weight: '400',
    color: '#000000',
    opacity: 0.1,
    rotation: 45,
    spacing: 150,
  });
  const [isLoading, setIsLoading] = useState(true);

  // 初始加载配置
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      // 调用 getRendered API 来获取替换变量后的水印
      const response = await watermarkApi.getRendered();
      if (response.data) {
        setConfig(response.data);
      }
    } catch (error) {
      console.error('加载水印配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = async (newConfig) => {
    try {
      await watermarkApi.updateConfig(newConfig);
      setConfig(newConfig);
      return true;
    } catch (error) {
      console.error('更新水印配置失败:', error);
      throw error;
    }
  };

  const value = {
    config,
    isLoading,
    loadConfig,
    updateConfig,
  };

  return (
    <WatermarkContext.Provider value={value}>
      {children}
    </WatermarkContext.Provider>
  );
}

export function useWatermark() {
  const context = useContext(WatermarkContext);
  if (!context) {
    throw new Error('useWatermark必须在WatermarkProvider内使用');
  }
  return context;
}

export default WatermarkContext;
