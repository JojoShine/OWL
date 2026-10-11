import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createHttpClient } from './create-http-client';
import { toast } from '@/components/ui/toast';
import { getStorageKey } from './storage-key';
vi.mock('@/components/ui/toast', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
it('lets the login form handle failures without an overlay or session expiry redirect', async () => {
  const client = createHttpClient();
  const error = new Error('登录失败');
  client.defaults.adapter = async config => { throw Object.assign(error, { config, response: { status: 401, data: { message: '登录失败' } } }); };
  await expect(client.post('/auth/login', {}, { inlineError: true })).rejects.toBe(error);
  expect(toast.error).not.toHaveBeenCalled();
});
it('retains global errors for other requests', async () => {
  const client = createHttpClient();
  client.defaults.adapter = async config => { throw Object.assign(new Error('failure'), { config, response: { status: 500 } }); };
  await expect(client.get('/users')).rejects.toThrow('failure');
  expect(toast.error).toHaveBeenCalledWith('服务器出错，请稍后重试', expect.objectContaining({ duration: 3000 }));
});
it('expires a session once when multiple authenticated requests return 401', async () => {
  vi.useFakeTimers();
  const location = { href: '/dashboard', port: '' };
  vi.stubGlobal('window', { location });
  localStorage.setItem(getStorageKey('token'), 'expired-token');
  localStorage.setItem(getStorageKey('user'), '{"id":"user-1"}');
  const clients = ['system', 'module'].map(kind => {
    const client = createHttpClient({ kind });
    client.defaults.adapter = async config => { throw Object.assign(new Error('Unauthorized'), { config, response: { status: 401 } }); };
    return client;
  });
  await Promise.allSettled(clients.map(client => client.get('/example')));
  expect(toast.error).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(getStorageKey('token'))).toBeNull();
  expect(localStorage.getItem(getStorageKey('user'))).toBeNull();
  await vi.advanceTimersByTimeAsync(500);
  expect(location.href).toMatch(/\/login$/);
});

it.each(['inline', 'silent'])('expires an authenticated session even with %s presentation', async errorMode => {
  vi.useFakeTimers();
  const location = { href: '/setting/users', port: '' };
  vi.stubGlobal('window', { location });
  localStorage.setItem(getStorageKey('token'), 'expired-token');
  const client = createHttpClient();
  client.defaults.adapter = async config => { throw Object.assign(new Error('Unauthorized'), { config, response: { status: 401 } }); };
  await client.get('/users', { errorMode }).catch(() => {});
  const remainingToken = localStorage.getItem(getStorageKey('token'));
  await vi.advanceTimersByTimeAsync(500);
  expect(remainingToken).toBeNull();
  expect(location.href).toMatch(/\/login$/);
});
