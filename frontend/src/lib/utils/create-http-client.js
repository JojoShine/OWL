import { getApiRoot } from '@/lib/config/runtime';
import { getBasePath } from '@/lib/config/runtime';
import axios from 'axios';
import { toast } from '@/components/ui/toast';
import { getStorageKey } from './storage-key';
import { normalizeRequestError } from './request-error';

let sessionRedirectTimer;

export function resolveApiBaseUrl(kind, configuredUrl = getApiRoot()) {
  const root = (configuredUrl || getApiRoot()).replace(/\/$/, '').replace(/\/system$/, '');
  if (kind === 'system') return `${root}/system`;
  if (kind === 'public') return `${root}/public`;
  return root;
}

async function handleRequestError(error, { authenticated }) {
  await normalizeRequestError(error);
  const mode = error.config?.inlineError ? 'inline' : error.config?.errorMode || 'global';
  if (error.errorKind === 'cancelled') return Promise.reject(error);
  if (error.response?.status === 401 && authenticated && error.config?.authenticated !== false && !error.config?.inlineError && typeof window !== 'undefined') {
    error.userMessage = '登录已过期，请重新登录';
    if (!sessionRedirectTimer) {
      localStorage.removeItem(getStorageKey('token'));
      localStorage.removeItem(getStorageKey('user'));
      toast.error(error.userMessage, { id: 'owl-session-expired' });
      sessionRedirectTimer = setTimeout(() => {
        window.location.href = `${getBasePath()}/login`;
        sessionRedirectTimer = undefined;
      }, 500);
    }
    error.errorHandled = true;
  } else if (mode === 'global') {
    toast.error(error.userMessage, {
      id: error.errorKind === 'rate-limit' ? 'owl-rate-limit' : `owl-request-error:${error.response?.status || error.errorKind}:${error.userMessage}`,
      duration: error.errorKind === 'rate-limit' ? 6000 : 3000,
    });
    error.errorHandled = true;
  } else if (mode === 'silent') {
    error.errorHandled = true;
  }
  return Promise.reject(error);
}

export function createHttpClient({ kind = 'module', authenticated = true, timeout = 10_000, errorMode = 'global' } = {}) {
  const client = axios.create({
    baseURL: resolveApiBaseUrl(kind),
    timeout,
    errorMode,
    headers: { 'Content-Type': 'application/json' },
  });

  if (authenticated) {
    client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem(getStorageKey('token'));
        if (token && config.authenticated !== false) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => Promise.reject(error));
  }

  client.interceptors.response.use((response) => {
    if (response.config.responseType === 'blob') return response;
    if (response.data?.success === false) {
      return handleRequestError(new axios.AxiosError('Business request failed', 'ERR_BAD_RESPONSE', response.config, response.request, response), { authenticated });
    }
    return response.data;
  }, (error) => handleRequestError(error, { authenticated }));

  return client;
}
