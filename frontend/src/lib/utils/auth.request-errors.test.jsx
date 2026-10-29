import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { App, ConfigProvider } from 'antd';
import { AxiosError } from 'axios';
import { useState } from 'react';
import { AuthProvider, useAuth } from './auth';
import client from './http-client';
import { getStorageKey } from './storage-key';
import { ToastProvider } from '@/components/ui/toast';

const originalAdapter = client.defaults.adapter;

function LoginResult() {
  const { login } = useAuth();
  const [message, setMessage] = useState('');
  return <>
    <button onClick={async () => {
      const result = await login({ username: 'alice', password: 'wrong-password' });
      setMessage(result.error);
    }}>登录</button>
    {message && <p role="alert">{message}</p>}
  </>;
}

beforeEach(() => {
  localStorage.setItem(getStorageKey('token'), 'existing-token');
  localStorage.removeItem(getStorageKey('user'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  client.defaults.adapter = originalAdapter;
  localStorage.removeItem(getStorageKey('token'));
  vi.restoreAllMocks();
});

it.each([
  [401, { message: '用户名或密码错误' }, {}, '用户名或密码错误'],
  [429, 'Too many requests', { 'retry-after': '400' }, '请求过于频繁，请在 6 分 40 秒后重试。'],
  [500, { message: 'SQL connection failed' }, {}, '服务器出错，请稍后重试'],
])('shows the shared explanation through AuthProvider for login HTTP %s', async (status, data, headers, message) => {
  let requestConfig;
  client.defaults.adapter = async config => {
    requestConfig = config;
    throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, {}, {
      status, data, headers, config, statusText: 'failure',
    });
  };
  render(<MemoryRouter><ConfigProvider theme={{ token: { motion: false } }}><App>
    <ToastProvider /><AuthProvider><LoginResult /></AuthProvider>
  </App></ConfigProvider></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: '登录' }));
  expect(await screen.findByRole('alert')).toHaveTextContent(message);
  expect(screen.getAllByText(message)).toHaveLength(1);
  expect(requestConfig.url).toBe('/auth/challenge');
  expect(requestConfig.errorMode).toBe('inline');
  expect(requestConfig.authenticated).toBe(false);
  expect(requestConfig.headers.Authorization).toBeUndefined();
  expect(localStorage.getItem(getStorageKey('token'))).toBe('existing-token');
  expect(screen.queryByText('登录已过期，请重新登录')).not.toBeInTheDocument();
  expect(screen.queryByText('SQL connection failed')).not.toBeInTheDocument();
  expect(console.error).not.toHaveBeenCalled();
});
