import { beforeEach, expect, it, vi } from 'vitest';
import { createHttpClient } from './create-http-client';
import { toast } from '@/components/ui/toast';
vi.mock('@/components/ui/toast', () => ({ toast: { error: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
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
  expect(toast.error).toHaveBeenCalledWith('服务器出错，请稍后重试');
});
