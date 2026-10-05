import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BusinessTableDialog, { validateForm } from './BusinessTableDialog';
import { generatorApi } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  generatorApi: { createBusinessTable: vi.fn() },
}));
vi.mock('@/components/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

describe('BusinessTableDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the enforced prefix and automatic fields', async () => {
    render(<BusinessTableDialog open onOpenChange={vi.fn()} onCreated={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('biz_')).toBeVisible());
    expect(screen.getByText(/系统将自动添加主键与审计字段/)).toBeVisible();
    expect(screen.getByRole('button', { name: '创建业务表' })).toBeDisabled();
  });

  it('creates a business table without sending raw SQL', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    generatorApi.createBusinessTable.mockResolvedValue({
      data: { tableName: 'biz_customer', moduleConfig: { id: 'module-1', fields: [] } },
    });
    render(<BusinessTableDialog open onOpenChange={vi.fn()} onCreated={onCreated} />);

    await user.type(screen.getByPlaceholderText('customer'), 'customer');
    await user.type(screen.getByPlaceholderText('customer_name'), 'customer_name');
    fireEvent.change(screen.getByPlaceholderText('客户名称'), { target: { value: '客户名称' } });
    await user.click(screen.getByRole('button', { name: '创建业务表' }));

    await waitFor(() => expect(generatorApi.createBusinessTable).toHaveBeenCalledTimes(1));
    const payload = generatorApi.createBusinessTable.mock.calls[0][0];
    expect(payload).toMatchObject({ table_name: 'customer', fields: [{ name: 'customer_name', type: 'string' }] });
    expect(JSON.stringify(payload).toLowerCase()).not.toContain('create table');
    expect(onCreated).toHaveBeenCalledWith({ id: 'module-1', fields: [] }, 'biz_customer');
  });

  it('rejects duplicate and reserved field names locally', () => {
    expect(validateForm('customer', [
      { name: 'name', type: 'string', length: 255 },
      { name: 'name', type: 'string', length: 255 },
    ])).toContain('重复');
    expect(validateForm('customer', [{ name: 'created_at', type: 'datetime' }])).toContain('保留');
  });
});
