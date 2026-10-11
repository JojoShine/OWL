import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App, ConfigProvider } from 'antd';
import { AxiosError } from 'axios';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/components/ui/toast';
import client from '@/lib/utils/http-client';
import { getStorageKey } from '@/lib/utils/storage-key';
import PermissionDialog from './PermissionDialog';

const originalAdapter = client.defaults.adapter;
let requests;

beforeEach(() => {
  requests = [];
  localStorage.setItem(getStorageKey('token'), 'test-session-token');
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403 })));
});
afterEach(() => {
  client.defaults.adapter = originalAdapter;
  localStorage.removeItem(getStorageKey('token'));
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function mount({ denied = false } = {}) {
  let deleted = false;
  client.defaults.adapter = async config => {
    requests.push(config);
    const response = { status: 200, statusText: 'OK', headers: {}, config };
    if (config.method === 'delete') {
      if (denied) throw new AxiosError('Forbidden', 'ERR_BAD_REQUEST', config, {}, {
        ...response, status: 403, data: { message: '您没有权限删除此权限' },
      });
      deleted = true;
      return { ...response, data: { code: 200, message: '权限删除成功' } };
    }
    return { ...response, data: config.url === '/roles'
      ? { data: { items: [] } }
      : { data: deleted ? [] : [{ id: 'permission-1', permission: 'read', role: { name: '测试角色' } }] } };
  };
  render(<ConfigProvider theme={{ token: { motion: false } }}><App><ToastProvider>
    <PermissionDialog open onClose={vi.fn()} item={{ id: 'file-1', name: '文件' }} isFolder={false} />
  </ToastProvider></App></ConfigProvider>);
}

it('deletes through the API layer using the configured API base and session token', async () => {
  mount();
  const interaction = userEvent.setup();
  await interaction.click(await screen.findByTitle('删除权限'));
  expect(await screen.findByText('权限删除成功')).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByTitle('删除权限')).not.toBeInTheDocument());
  const deletion = requests.find(request => request.method === 'delete');
  expect(deletion).toMatchObject({ url: '/file-permissions/permission-1', baseURL: expect.stringMatching(/\/api\/system$/) });
  expect(deletion.headers.get('Authorization')).toBe('Bearer test-session-token');
  expect(fetch).not.toHaveBeenCalled();
});

it('keeps the permission and shows only the failure when deletion is denied', async () => {
  mount({ denied: true });
  const interaction = userEvent.setup();
  await interaction.click(await screen.findByTitle('删除权限'));
  expect(await screen.findAllByText('您没有权限删除此权限')).toHaveLength(1);
  expect(screen.getByTitle('删除权限')).toBeInTheDocument();
  expect(screen.queryByText('权限删除成功')).not.toBeInTheDocument();
});
