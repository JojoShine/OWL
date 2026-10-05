import { act, render, screen, waitFor } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { expect, it } from 'vitest';
import { toast, ToastProvider } from './toast';

it('shows and dismisses a loading message using its returned key', async () => {
  render(<ConfigProvider theme={{ token: { motion: false } }}><App><ToastProvider /></App></ConfigProvider>);
  let key;
  act(() => { key = toast.loading('正在采集指标'); });
  expect(await screen.findByText('正在采集指标')).toBeInTheDocument();
  act(() => toast.dismiss(key));
  await waitFor(() => expect(screen.queryByText('正在采集指标')).not.toBeInTheDocument());
});
it('preserves notification title and description', async () => {
  render(<ConfigProvider theme={{ token: { motion: false } }}><App><ToastProvider /></App></ConfigProvider>);
  act(() => toast.info('系统通知', { description: '审批已完成' }));
  expect(await screen.findByText('系统通知')).toBeInTheDocument();
  expect(screen.getByText('审批已完成')).toBeInTheDocument();
  act(() => toast.dismiss());
});
