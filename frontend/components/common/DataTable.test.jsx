import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DataTable } from './DataTable';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
  scrollIntoView: { configurable: true, value: () => {} },
});

describe('DataTable workspace variant', () => {
  it('keeps the prior page-size reset callback order for implicit-default callers', async () => {
    const interaction = userEvent.setup();
    const calls = [];
    render(
      <DataTable
        columns={[{ key: 'name', label: '名称' }]}
        data={[{ id: 1, name: '用户' }]}
        pagination={{ page: 2, pageSize: 10, total: 80 }}
        onPageChange={(page) => calls.push(`page:${page}`)}
        onPageSizeChange={(pageSize) => calls.push(`size:${pageSize}`)}
      />
    );

    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));

    expect(calls).toEqual(['size:20', 'page:1']);
  });

  it('uses the mature workspace treatment by default', () => {
    render(
      <DataTable
        columns={[{ key: 'name', label: '名称' }]}
        data={[]}
        pagination={{ page: 1, pageSize: 10, total: 0 }}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getByText('暂无数据').closest('[data-slot="table-cell"]')).toHaveClass('py-12');
    expect(screen.getByRole('table').parentElement.parentElement).toHaveClass('overflow-hidden', 'rounded-lg', 'border', 'bg-card');
    expect(screen.getByText('共 0 条记录').parentElement.parentElement.parentElement).toHaveClass('border-t', 'px-4', 'py-3');
  });

  it('applies tabular data alignment to numeric columns', () => {
    render(
      <DataTable
        columns={[{ key: 'createdAt', label: '创建时间', numeric: true }]}
        data={[{ id: 1, createdAt: '2026-08-25 10:30:00' }]}
      />
    );

    expect(screen.getByText('2026-08-25 10:30:00').closest('[data-slot="table-cell"]')).toHaveClass('tabular-data');
  });

  it('keeps loading rows aligned to the loaded column geometry', () => {
    const columns = [
      { key: 'name', label: '名称' },
      { key: 'createdAt', label: '创建时间', numeric: true },
    ];
    const actions = () => <button>编辑</button>;
    const { rerender } = render(
      <DataTable columns={columns} data={[{ id: 1, name: '用户', createdAt: '2026-08-25' }]} actions={actions} />
    );

    expect(screen.getAllByRole('cell')).toHaveLength(3);

    rerender(<DataTable columns={columns} data={[]} actions={actions} loading />);
    expect(screen.getByText('加载中...').closest('[data-slot="table-cell"]')).toHaveAttribute('colspan', '3');
  });

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

  it('keeps workspace pagination inside the mobile surface', () => {
    render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[{ id: 1, name: '用户' }]} pagination={{ page: 1, pageSize: 10, total: 128 }} onPageChange={vi.fn()} variant="workspace" />);
    const paginationRoot = screen.getByText('共 128 条记录').parentElement.parentElement;

    expect(paginationRoot).toHaveClass(
      'flex-col',
      'items-start',
      'sm:flex-row',
      'sm:items-center',
      '[&>nav]:max-w-full',
      '[&>nav]:overflow-x-auto'
    );
  });
});
