import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import RoleFormDialog from './role-form-dialog';
import { roleApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  roleApi: { getRole: vi.fn().mockResolvedValue({ data: { name: 'Original role', code: 'original', description: 'Before', status: 'active', sort: 3 } }), updateRole: vi.fn().mockResolvedValue({}) },
  permissionApi: { getAllPermissions: vi.fn().mockResolvedValue({ data: { items: [] } }) },
  menuApi: { getMenuTree: vi.fn().mockResolvedValue({ data: { items: [] } }) },
}));
vi.mock('@/components/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

it('loads edit defaults, validates cleared numeric fields, and submits edited values', async () => {
  const user = userEvent.setup();
  render(<RoleFormDialog open role={{ id: 'role-1' }} onOpenChange={vi.fn()} />);
  const name = await screen.findByDisplayValue('Original role');
  expect(screen.getByDisplayValue('Before')).toBeInTheDocument();
  await user.clear(name); await user.type(name, 'Changed role');
  const sort = screen.getByRole('spinbutton');
  await user.clear(sort);
  await user.click(screen.getByRole('button', { name: /保\s*存/ }));
  expect(roleApi.updateRole).not.toHaveBeenCalled();
  await user.type(sort, '8');
  await user.click(screen.getByRole('button', { name: /保\s*存/ }));
  await waitFor(() => expect(roleApi.updateRole).toHaveBeenCalledWith('role-1', expect.objectContaining({ name: 'Changed role', description: 'Before', code: 'original', sort: 8 })));
});
