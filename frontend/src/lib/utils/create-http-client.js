import { getApiRoot } from '@/lib/config/runtime';
import { getBasePath } from '@/lib/config/runtime';
import axios from 'axios';
import { toast } from '@/components/ui/toast';
import { getStorageKey } from './storage-key';

export function resolveApiBaseUrl(kind, configuredUrl = getApiRoot()) {
  const root = (configuredUrl || getApiRoot()).replace(/\/$/, '').replace(/\/system$/, '');
  if (kind === 'system') return `${root}/system`;
  if (kind === 'public') return `${root}/public`;
  return root;
}

function handleRequestError(error, { authenticated }) {
  if (error.config?.inlineError) return Promise.reject(error);
  if (error.response) {
    const { status, data } = error.response;
    if (status === 401 && authenticated && typeof window !== 'undefined') {
      localStorage.removeItem(getStorageKey('token'));
      localStorage.removeItem(getStorageKey('user'));
      toast.error(data?.message || '登录已过期，请重新登录');
      setTimeout(() => {
        window.location.href = `${getBasePath()}/login`;
      }, 500);
    } else if (status === 403) {
      toast.error('您没有权限访问此资源');
    } else if (status === 404) {
      toast.error('请求的资源不存在');
    } else if (status === 500) {
      toast.error('服务器出错，请稍后重试');
    } else {
      toast.error(data?.message || '请求失败，请重试');
    }
  } else if (error.request) {
    toast.error('网络连接失败，请检查网络');
  } else {
    toast.error('请求出错，请稍后重试');
  }
  return Promise.reject(error);
}

export function createHttpClient({ kind = 'module', authenticated = true, timeout = 10_000 } = {}) {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(kind),
    timeout,
    headers: { 'Content-Type': 'application/json' },
  });

  if (authenticated) {
    client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(getStorageKey('token'));
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => Promise.reject(error));
  }

  client.interceptors.response.use((response) => (
    response.config.responseType === 'blob' ? response : response.data
  ), (error) => handleRequestError(error, { authenticated }));

  return client;
}
