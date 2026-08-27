import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from './page';
import { userApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  userApi: {
    getUsers: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));
vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));
vi.mock('@/components/ui/date-picker', () => ({ DatePicker: () => null }));
vi.mock('@/components/ui/combobox', () => ({ Combobox: () => null }));
vi.mock('@/components/ui/table-loading', () => ({ TableLoading: () => null }));
vi.mock('@/lib/hooks/usePermission', () => ({
  usePermission: () => ({
    canCreate: () => true,
    canUpdate: () => true,
    canDelete: () => true,
  }),
}));
vi.mock('@/components/users/user-form-dialog', () => ({ default: () => null }));
vi.mock('@/components/ui/confirm-dialog', () => ({ ConfirmDialog: () => null }));
vi.mock('@/components/sensitive-fields/plain-access-button', () => ({
  default: ({ recordId }) => <span data-testid="plain-access-record">{recordId.substring(0, 8)}</span>,
}));

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

describe('UsersPage queries', () => {
  beforeEach(() => {
    userApi.getUsers.mockResolvedValue({
      data: { items: [], pagination: { total: 0 } },
    });
  });

  it('searches with the latest draft and resets with an empty query', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalled());
    await user.type(screen.getByPlaceholderText('搜索用户名、邮箱...'), 'alice');
    await user.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenLastCalledWith({
      search: 'alice',
      page: 1,
      limit: 10,
    }));
    await user.click(screen.getByRole('button', { name: '重置' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenLastCalledWith({
      search: '',
      page: 1,
      limit: 10,
    }));
  });

  it('keeps the status action visible and adds a semantic label', async () => {
    userApi.getUsers.mockResolvedValueOnce({
      data: {
        items: [{ id: 1, username: 'alice', status: 'active' }],
        pagination: { total: 1 },
      },
    });
    render(<UsersPage />);
    expect((await screen.findAllByText('正常')).length).toBeGreaterThan(0);
    expect((await screen.findAllByRole('switch', { name: '切换用户 alice 状态' })).length).toBeGreaterThan(0);
  });

  it('normalizes numeric record IDs before rendering masked-field actions', async () => {
    userApi.getUsers.mockResolvedValueOnce({
      data: {
        items: [{ id: 1, username: 'alice', email: 'ali***@example.com', status: 'active' }],
        pagination: { total: 1 },
      },
    });

    render(<UsersPage />);

    const recordActions = await screen.findAllByTestId('plain-access-record');
    expect(recordActions.length).toBeGreaterThan(0);
    recordActions.forEach((action) => expect(action).toHaveTextContent('1'));
  });

  it('runs an identical query again and ignores an older slow response', async () => {
    const interaction = userEvent.setup();
    const slow = deferred();
    const fast = deferred();
    userApi.getUsers
      .mockResolvedValueOnce({ data: { items: [], pagination: { total: 0 } } })
      .mockImplementationOnce(() => slow.promise)
      .mockImplementationOnce(() => fast.promise);

    render(<UsersPage />);
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(1));
    const input = screen.getByPlaceholderText('搜索用户名、邮箱...');
    await interaction.type(input, 'alice');
    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(2));
    await interaction.clear(input);
    await interaction.type(input, 'bob');
    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(3));

    await act(async () => fast.resolve({
      data: {
        items: [{ id: 2, username: 'bob', status: 'active' }],
        pagination: { total: 1 },
      },
    }));
    expect((await screen.findAllByText('bob')).length).toBeGreaterThan(0);
    await act(async () => slow.resolve({
      data: {
        items: [{ id: 1, username: 'alice', status: 'active' }],
        pagination: { total: 1 },
      },
    }));
    expect(screen.getAllByText('bob').length).toBeGreaterThan(0);
    expect(screen.queryByText('alice')).not.toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: '查询' }));
    await waitFor(() => expect(userApi.getUsers).toHaveBeenCalledTimes(4));
  });
});
