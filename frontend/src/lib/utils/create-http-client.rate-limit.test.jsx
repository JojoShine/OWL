import { act, render, screen } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { AxiosError } from 'axios';
import { afterEach, expect, it, vi } from 'vitest';
import { toast, ToastProvider } from '@/components/ui/toast';
import { createHttpClient } from './create-http-client';

afterEach(() => vi.restoreAllMocks());

function mountToasts() {
  render(<ConfigProvider theme={{ token: { motion: false } }}><App><ToastProvider /></App></ConfigProvider>);
}

function rateLimitedClient(options, headers = {}, data = '请求过于频繁，请稍后再试') {
  const client = createHttpClient(options);
  client.defaults.adapter = async config => {
    throw new AxiosError('Request failed with status code 429', 'ERR_BAD_REQUEST', config, {}, {
      status: 429, statusText: 'Too Many Requests', headers, data, config,
    });
  };
  return client;
}

it('explains the wait from a plain-text 429 and preserves the rejection', async () => {
  mountToasts();
  const client = rateLimitedClient({}, { 'Retry-After': '400' });
  let failure;
  await act(async () => { failure = await client.get('/users').catch(error => error); });
  expect(await screen.findByText('请求过于频繁，请在 6 分 40 秒后重试。')).toBeInTheDocument();
  expect(failure.response.status).toBe(429);
  expect(failure.userMessage).toBe('请求过于频繁，请在 6 分 40 秒后重试。');
  expect(failure.response.data).toBe('请求过于频繁，请稍后再试');
});

it.each([undefined, 'invalid', '0', '-1'])('uses a useful fallback when Retry-After is %s', async retryAfter => {
  mountToasts();
  const client = rateLimitedClient({}, { 'retry-after': retryAfter });
  await act(async () => { await client.get('/users').catch(() => {}); });
  expect(await screen.findByText('请求过于频繁，请稍后再试。')).toBeInTheDocument();
  expect(screen.queryByText('请求失败，请重试')).not.toBeInTheDocument();
});

it('reads an HTTP-date Retry-After header', async () => {
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-11T02:00:00Z'));
  mountToasts();
  const client = rateLimitedClient({}, { 'retry-after': 'Sun, 11 Oct 2026 02:01:00 GMT' });
  await act(async () => { await client.get('/users').catch(() => {}); });
  expect(await screen.findByText('请求过于频繁，请在 1 分后重试。')).toBeInTheDocument();
});

it('passes the same explanation to the login form without a global popup', async () => {
  mountToasts();
  const client = rateLimitedClient({}, { 'retry-after': '400' }, { message: '请求过于频繁', code: 'TOO_MANY_REQUESTS' });
  const failure = await client.post('/auth/login', {}, { inlineError: true }).catch(error => error);
  expect(failure.response.data).toMatchObject({
    message: '请求过于频繁', code: 'TOO_MANY_REQUESTS',
  });
  expect(failure.userMessage).toBe('请求过于频繁，请在 6 分 40 秒后重试。');
  expect(failure.errorHandled).not.toBe(true);
  expect(screen.queryByText('请求过于频繁，请在 6 分 40 秒后重试。')).not.toBeInTheDocument();
});

it('merges concurrent rate-limit notices across clients and skips page fallback popups', async () => {
  mountToasts();
  const clients = ['system', 'module', 'public'].map(kind => rateLimitedClient({ kind }, { 'retry-after': '400' }));
  let results;
  await act(async () => {
    results = await Promise.allSettled(clients.map(client => client.get('/users').catch(error => {
      toast.requestError(error, '加载数据失败');
      throw error;
    })));
  });
  expect(results.every(result => result.status === 'rejected' && result.reason.response?.status === 429)).toBe(true);
  expect(await screen.findAllByText('请求过于频繁，请在 6 分 40 秒后重试。')).toHaveLength(1);
  expect(screen.queryByText('加载数据失败')).not.toBeInTheDocument();
});
