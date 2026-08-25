import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

describe('DataTable workspace variant', () => {
  it('uses a zero row key and exposes the expand control name', async () => {
    const interaction = userEvent.setup();
    const rows = [{ id: 8, name: '八号用户' }, { id: 0, name: '零号用户' }];
    const { rerender } = render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={rows} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    await interaction.click(screen.getByRole('button', { name: '展开零号用户' }));
    expect(screen.getByText('零号用户详情')).toBeInTheDocument();
    rerender(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[rows[1], rows[0]]} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    expect(screen.getByText('零号用户详情')).toBeInTheDocument();
    expect(screen.queryByText('八号用户详情')).not.toBeInTheDocument();
  });

  it('keeps the total visible when only one page exists', () => {
    render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[{ id: 1, name: '用户' }]} pagination={{ page: 1, pageSize: 10, total: 1 }} onPageChange={vi.fn()} variant="workspace" />);
    expect(screen.getByText('共 1 条记录')).toBeInTheDocument();
  });
});
