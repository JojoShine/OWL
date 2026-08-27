import { createHttpClient } from './create-http-client';

const axiosInstance = createHttpClient({ kind: 'system', authenticated: true });

export default axiosInstance;

export const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/system';
  return apiUrl.replace(/\/api(\/system)?\/?$/, '');
};

export const getStaticResourcePrefix = () => process.env.NEXT_PUBLIC_BASE_PATH || '';
