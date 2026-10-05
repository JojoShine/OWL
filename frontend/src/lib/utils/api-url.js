import { getApiRoot } from '@/lib/config/runtime';
/**
 * 获取完整的对外 API 地址
 * 
 * 使用模块：API Builder（接口构建器）
 * 使用场景：
 *   - API 密钥对话框：展示接口完整地址、生成 curl 命令供用户复制
 *   - 接口测试对话框：显示要测试的完整 URL
 *   - API Builder 列表页：表格中展示每个接口的完整调用地址
 * 
 * 示例：
 *   开发环境: /users → http://localhost:3001/api/custom/users
 *   生产环境: /users → /owl/api/custom/users
 * 
 * @param {string} endpoint - 接口端点（如 /users, /orders 等）
 * @returns {string} 完整的对外 API 地址
 */
export const getFullApiUrl = (endpoint) => {
  const baseURL = getApiRoot();
  
  // 处理endpoint的路径
  const path = endpoint.startsWith('/custom') ? endpoint : `/custom${endpoint}`;
  
  // 移除baseURL末尾的斜杠，确保格式正确
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  
  return new URL(`${cleanBaseURL}${path}`, window.location.origin).href;
};
