import { act, render, screen } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { AxiosError } from 'axios';
import { Blob } from 'node:buffer';
import { expect, it } from 'vitest';
import { toast, ToastProvider } from '@/components/ui/toast';
import { createHttpClient } from './create-http-client';

function mountToasts() {
  render(<ConfigProvider theme={{ token: { motion: false } }}><App><ToastProvider /></App></ConfigProvider>);
}

function failingClient({ status, data, code = 'ERR_BAD_RESPONSE', errorMode, responseType } = {}) {
  const client = createHttpClient();
  client.defaults.adapter = async config => {
    throw new AxiosError('technical transport message', code, config, {}, status ? {
      status, statusText: 'failure', config, headers: {}, data,
    } : undefined);
  };
  return client.get('/example', { errorMode, responseType });
}

it.each([
  [400, { message: ['姓名不能为空', '手机号格式错误'] }, '姓名不能为空；手机号格式错误'],
  [403, {}, '您没有权限访问此资源'],
  [404, {}, '请求的资源不存在'],
  [404, { message: '分享链接已过期' }, '分享链接已过期'],
  [409, { message: '名称已存在' }, '名称已存在'],
  [422, { message: '请输入有效邮箱' }, '请输入有效邮箱'],
  [500, { message: 'SELECT * FROM private_data' }, '服务器出错，请稍后重试'],
  [502, {}, '服务器出错，请稍后重试'],
  [503, {}, '服务器出错，请稍后重试'],
])('shows one useful notice for HTTP %s, including the page catch', async (status, data, message) => {
  mountToasts();
  let failure;
  await act(async () => {
    failure = await failingClient({ status, data }).catch(error => {
      toast.requestError(error, '操作失败');
      return error;
    });
  });
  expect(await screen.findAllByText(message)).toHaveLength(1);
  expect(failure.userMessage).toBe(message);
  expect(failure.response.data).toEqual(data);
  expect(failure.errorHandled).toBe(true);
  expect(screen.queryByText('操作失败')).not.toBeInTheDocument();
});

it.each([
  ['ECONNABORTED', '请求超时，请稍后重试'],
  ['ETIMEDOUT', '请求超时，请稍后重试'],
  ['ERR_NETWORK', '网络连接失败，请检查网络'],
])('distinguishes %s from other transport failures', async (code, message) => {
  mountToasts();
  await act(async () => { await failingClient({ code }).catch(() => {}); });
  expect(await screen.findByText(message)).toBeInTheDocument();
});

it('leaves inline errors to the form with a normalized explanation', async () => {
  mountToasts();
  const failure = await failingClient({ status: 422, data: { message: '请输入有效邮箱' }, errorMode: 'inline' }).catch(error => error);
  expect(failure.userMessage).toBe('请输入有效邮箱');
  expect(failure.errorHandled).not.toBe(true);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('keeps silent background failures quiet even if a caller uses the page helper', async () => {
  mountToasts();
  let failure;
  await act(async () => {
    failure = await failingClient({ status: 503, errorMode: 'silent' }).catch(error => {
      toast.requestError(error, '获取通知失败');
      return error;
    });
  });
  expect(failure.userMessage).toBe('服务器出错，请稍后重试');
  expect(failure.errorHandled).toBe(true);
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('does not display cancellations as errors', async () => {
  mountToasts();
  await act(async () => {
    await failingClient({ code: 'ERR_CANCELED' }).catch(error => toast.requestError(error, '加载失败'));
  });
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('reads validation messages from failed blob downloads without replacing the original body', async () => {
  mountToasts();
  const data = new Blob([JSON.stringify({ message: '导出范围过大，请缩小范围' })], { type: 'application/json' });
  let failure;
  await act(async () => { failure = await failingClient({ status: 400, data, responseType: 'blob' }).catch(error => error); });
  expect(await screen.findByText('导出范围过大，请缩小范围')).toBeInTheDocument();
  expect(failure.response.data).toBe(data);
});

it('rejects business failures in HTTP 200 responses before callers can show success', async () => {
  mountToasts();
  const client = createHttpClient();
  const data = { success: false, message: '该记录已被其他用户删除', code: 'RECORD_MISSING' };
  client.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data });
  let failure;
  await act(async () => {
    failure = await client.post('/example', {}).then(() => {
      toast.success('操作成功');
    }, error => error);
  });
  expect(failure).toBeInstanceOf(AxiosError);
  expect(failure.response.data).toEqual(data);
  expect(failure.userMessage).toBe('该记录已被其他用户删除');
  expect(await screen.findByText('该记录已被其他用户删除')).toBeInTheDocument();
  expect(screen.queryByText('操作成功')).not.toBeInTheDocument();
});

it('preserves successful response envelopes and nested operation results', async () => {
  const client = createHttpClient();
  const data = { success: true, data: { success: false, error: '监控目标不可达' } };
  client.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data });
  expect(await client.get('/example')).toEqual(data);
});
