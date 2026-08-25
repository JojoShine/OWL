import React from 'react';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { userApi } from '@/lib/api';
import * as userFormDialogModule from './user-form-dialog';

const UserFormDialog = userFormDialogModule.default;

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());

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

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe('UserFormDialog', () => {
  beforeEach(() => {
    userApi.createUser.mockClear();
    userApi.updateUser.mockClear();
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

  it('uses a bounded dialog with fixed regions, responsive grids, and scrolling roles', () => {
    render(
      <UserFormDialog
        open
        user={null}
        onOpenChange={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    const basicSection = screen.getByRole('region', { name: '基本信息' });
    const accessSection = screen.getByRole('region', { name: '组织与权限' });
    const emptyRoles = screen.getByText('暂无可用角色');
    const rolesScroller = emptyRoles.parentElement;
    const rolesField = rolesScroller.parentElement;

    expect(dialog).toHaveClass(
      'flex',
      'max-h-[85vh]',
      'max-w-3xl',
      'overflow-hidden',
      'p-0'
    );
    expect(dialog.querySelector('[data-slot="dialog-header"]')).toHaveClass('border-b');
    expect(dialog.querySelector('form')).toHaveClass('flex', 'min-h-0', 'flex-1', 'flex-col');
    expect(basicSection.parentElement).toHaveClass('min-h-0', 'flex-1', 'overflow-y-auto');
    expect(basicSection.querySelector('.grid')).toHaveClass('md:grid-cols-2');
    expect(accessSection.querySelector('.grid')).toHaveClass('md:grid-cols-2');
    expect(rolesField).toHaveClass('md:col-span-2');
    expect(rolesScroller).toHaveClass('max-h-40', 'overflow-y-auto');
    expect(dialog.querySelector('[data-slot="dialog-footer"]')).toHaveClass('border-t');
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
});
