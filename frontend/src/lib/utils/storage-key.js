/**
 * 生成命名空间化的 localStorage key
 * 用于支持多个平台实例同时运行，避免 token/用户信息混乱
 */

// 获取平台 ID（从环境变量或 URL 或生成）
const getPlatformId = () => {
  // 优先从环境变量获取
  if (import.meta.env.VITE_PLATFORM_ID) {
    return import.meta.env.VITE_PLATFORM_ID;
  }

  // 其次从 localStorage 获取或生成
  if (typeof window !== 'undefined') {
    let platformId = localStorage.getItem('__platform_id');
    if (!platformId) {
      // 从 URL 或生成唯一 ID
      const port = window.location.port;
      platformId = port ? `port-${port}` : `instance-${Date.now()}`;
      localStorage.setItem('__platform_id', platformId);
    }
    return platformId;
  }

  return 'default';
};

// 生成命名空间化的 key
export const getStorageKey = (key) => {
  if (typeof window === 'undefined') {
    return key;
  }
  const platformId = getPlatformId();
  return `${platformId}__${key}`;
};
