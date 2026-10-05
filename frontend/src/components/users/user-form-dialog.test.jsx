import React from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { roleApi, userApi } from '@/lib/api';
import * as userFormDialogModule from './user-form-dialog';

const UserFormDialog = userFormDialogModule.default;

beforeAll(() => vi.stubGlobal('React', React));
afterAll(async () => {
  // Ant Form schedules delayed validation feedback after field interactions.
  await act(() => new Promise((resolve) => setTimeout(resolve, 300)));
  vi.unstubAllGlobals();
});

vi.mock('@/lib/utils', async () => {
  const { cn } = await import('@/lib/utils/cn');
  return { cn };
});

vi.mock('@/lib/api', () => ({
  userApi: {
    updateUser: vi.fn().mockResolvedValue({}),
    createUser: vi.fn().mockResolvedValue({}),
  },
  departmentApi: {
    getDepartmentTree: vi.fn().mockResolvedValue({ data: [] }),
  },
  roleApi: {
    getRoles: vi.fn().mockResolvedValue({ data: { items: [] } }),
  },
}));

vi.mock('@/contexts/SensitiveFieldContext', () => ({
  useSensitiveField: () => ({ shouldShowEditButton: () => false }),
}));

vi.mock('@/components/ui/toast', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('UserFormDialog', () => {
  beforeEach(() => {
    userApi.createUser.mockClear();
    userApi.updateUser.mockClear();
    roleApi.getRoles.mockReset();
    roleApi.getRoles.mockResolvedValue({ data: { items: [] } });
  });

  it('keeps the illustrated role empty state', async () => {
    render(<UserFormDialog open onOpenChange={vi.fn()} />);
    const title = await screen.findByText('暂无可用角色');
    expect(title.closest('.text-center')?.querySelector('svg')).toBeInTheDocument();
  });

  it('preserves assigned roles outside the loaded role options', async () => {
    roleApi.getRoles.mockResolvedValueOnce({ data: { items: [{ id: 2, name: '管理员' }] } });
    render(<UserFormDialog open user={{ id: 1, username: 'alice', email: 'alice@example.com', roles: [{ id: 101 }] }} onOpenChange={vi.fn()} />);
    const interaction = userEvent.setup();
    await interaction.click(await screen.findByRole('checkbox', { name: '管理员' }));
    await interaction.click(screen.getByRole('button', { name: '保存', exact: true }));
    await waitFor(() => expect(userApi.updateUser).toHaveBeenCalledWith(1, expect.objectContaining({ role_ids: expect.arrayContaining(['101', '2']) })));
  });

  it('groups fields and resets an edited value when reopened', async () => {
    const interaction = userEvent.setup();
    const user = {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      status: 'active',
      roles: [],
    };
    const props = { user, onOpenChange: vi.fn(), onSuccess: vi.fn() };
    const { rerender } = render(<UserFormDialog open {...props} />);

    expect(screen.getByRole('region', { name: '基本信息' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '组织与权限' })).toBeInTheDocument();

    const email = screen.getByLabelText(/邮箱/);
    expect(email).toHaveValue('alice@example.com');
    await interaction.clear(email);
    await interaction.type(email, 'changed@example.com');
    expect(email).toHaveValue('changed@example.com');

    rerender(<UserFormDialog open={false} {...props} />);
    rerender(<UserFormDialog open {...props} />);

    expect(screen.getByLabelText(/邮箱/)).toHaveValue('alice@example.com');
  });

  it('keeps labelled fields, grouped content and cancel/save actions in the dialog', async () => {
    const interaction = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UserFormDialog open user={null} onOpenChange={onOpenChange} onSuccess={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAccessibleName(/新增用户/);
    expect(screen.getByRole('region', { name: '基本信息' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: '组织与权限' })).toBeInTheDocument();
    expect(screen.getByLabelText('所属部门')).toBeInTheDocument();
    expect(screen.getByLabelText('数据查询权限')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
    await interaction.click(screen.getByRole('button', { name: '取消', exact: true }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByText('放弃未保存的修改？')).not.toBeInTheDocument();
  });

  it('renders backend role descriptions without changing the checkbox label', async () => {
    roleApi.getRoles.mockResolvedValueOnce({
      data: {
        items: [{ id: 2, name: '管理员', description: '管理系统用户' }],
      },
    });

    render(
      <UserFormDialog
        open
        user={null}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(await screen.findByText('管理员')).toBeInTheDocument();
    expect(screen.getByText('管理系统用户')).toHaveClass('text-muted-foreground');
    expect(screen.getByRole('checkbox', { name: '管理员' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('管理系统用户'));
    expect(screen.getByRole('checkbox', { name: '管理员' })).toBeChecked();
    await userEvent.click(screen.getByText('管理系统用户'));
    expect(screen.getByRole('checkbox', { name: '管理员' })).not.toBeChecked();
  });

  it('filters masked edit fields and routes a successful submit to updateUser', async () => {
    const interaction = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    const user = {
      id: 1,
      username: 'alice',
      email: 'alice@example.com',
      status: 'active',
      roles: [],
    };
    expect(userFormDialogModule.buildUserPayload).toBeTypeOf('function');
    const payload = userFormDialogModule.buildUserPayload(
      {
        username: 'alice',
        email: 'ali***@example.com',
        password: '',
        real_name: '王*',
        phone: '138****1001',
        department_id: '',
        status: 'active',
        role_ids: ['2'],
        access_level: 'SELF',
      },
      true
    );

    expect(payload).toEqual({
      username: 'alice',
      department_id: null,
      status: 'active',
      role_ids: ['2'],
      access_level: 'SELF',
    });

    render(
      <UserFormDialog
        open
        user={user}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );
    await interaction.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(userApi.updateUser).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ username: 'alice' })
      )
    );
    expect(userApi.updateUser.mock.calls[0][1]).not.toHaveProperty('password');
    expect(userApi.createUser).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('routes a new user to createUser with normalized defaults', async () => {
    const interaction = userEvent.setup();
    const onSuccess = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <UserFormDialog
        open
        user={null}
        onOpenChange={onOpenChange}
        onSuccess={onSuccess}
      />
    );

    await interaction.type(screen.getByLabelText(/用户名/), 'new_user');
    await interaction.type(screen.getByLabelText(/邮箱/), 'new@example.com');
    await interaction.type(screen.getByLabelText(/密码/), 'secret123');
    await interaction.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() =>
      expect(userApi.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'new_user',
          email: 'new@example.com',
          department_id: null,
          role_ids: [],
        })
      )
    );
    expect(userApi.updateUser).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  it('keeps unsaved changes when dismissal is cancelled and closes clean forms directly', async () => {
    const interaction = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UserFormDialog open user={{ id: 1, username: 'alice', email: 'alice@example.com', status: 'active', roles: [] }} onOpenChange={onOpenChange} />);
    await interaction.type(screen.getByLabelText(/邮箱/), '.new');
    await interaction.click(screen.getByRole('button', { name: '取消', exact: true }));
    expect(await screen.findByText('放弃未保存的修改？')).toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: '继续编辑' }));
    expect(screen.getByLabelText(/邮箱/)).toHaveValue('alice@example.com.new');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('preserves input and displays a retryable save error in the dialog', async () => {
    userApi.updateUser.mockRejectedValueOnce(new Error('保存暂时不可用'));
    const interaction = userEvent.setup();
    render(<UserFormDialog open user={{ id: 1, username: 'alice', email: 'alice@example.com', status: 'active', roles: [] }} onOpenChange={vi.fn()} />);
    await interaction.clear(screen.getByLabelText(/邮箱/));
    await interaction.type(screen.getByLabelText(/邮箱/), 'changed@example.com');
    await interaction.click(screen.getByRole('button', { name: '保存', exact: true }));
    expect(await screen.findByRole('alert')).toHaveTextContent('保存暂时不可用');
    expect(screen.getByLabelText(/邮箱/)).toHaveValue('changed@example.com');
    expect(screen.getByRole('button', { name: '保存', exact: true })).toBeEnabled();
  });

  it('prevents a duplicate write and dismissal during an in-flight save', async () => {
    let resolve;
    userApi.updateUser.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    const interaction = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<UserFormDialog open user={{ id: 1, username: 'alice', email: 'alice@example.com', status: 'active', roles: [] }} onOpenChange={onOpenChange} />);
    await interaction.dblClick(screen.getByRole('button', { name: '保存', exact: true }));
    expect(userApi.updateUser).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: '取消', exact: true })).toBeDisabled();
    resolve({});
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('validates required fields inline and does not submit an invalid new account', async () => {
    const interaction = userEvent.setup();
    render(<UserFormDialog open user={null} onOpenChange={vi.fn()} />);
    await interaction.click(screen.getByRole('button', { name: '保存', exact: true }));
    expect(await screen.findByText('密码是必填项')).toBeInTheDocument();
    expect(userApi.createUser).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/用户名/)).toHaveAttribute('aria-invalid', 'true');
  });

});
