import React from 'react';
import { render, screen, within } from '@testing-library/react';
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
  it('preserves custom renderers, cell classes, record keys and desktop expansion through Ant Table', async () => {
    const row = { code: 'r-1', name: '订单', amount: 8 };
    const action = vi.fn();
    render(<DataTable rowKey="code" columns={[
      { key: 'name', label: '名称', headerClassName: 'name-heading', cellClassName: 'name-cell', render: (value, record) => `${value}:${record.code}` },
      { key: 'amount', label: '数量', numeric: true },
    ]} data={[row]} renderSubRow={(record) => <p>详情:{record.code}</p>} actions={(record) => <button onClick={() => action(record)}>查看</button>} />);
    const table = screen.getByRole('table');
    expect(table.closest('.ant-table')).toBeInTheDocument();
    expect(within(table).getByText('订单:r-1').closest('td')).toHaveClass('name-cell');
    expect(within(table).getByRole('columnheader', { name: '名称' })).toHaveClass('name-heading');
    await userEvent.click(within(table).getByRole('button', { name: '展开订单' }));
    expect(within(table).getByText('详情:r-1')).toBeInTheDocument();
    await userEvent.click(within(table).getByRole('button', { name: '查看' }));
    expect(action).toHaveBeenCalledWith(row);
  });

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

    const desktopEmptyState = screen.getAllByText('暂无数据')
      .find((element) => element.closest('td'));
    expect(desktopEmptyState.closest('td').querySelector('svg')).toBeInTheDocument();
    expect(screen.getByRole('table').closest('[data-slot="data-table"]')).toHaveClass('overflow-hidden', 'rounded-lg', 'border', 'bg-card');
    expect(screen.getByText('共 0 条记录').parentElement.parentElement.parentElement).toHaveClass('border-t', 'px-4', 'py-3');
  });

  it('applies tabular data alignment to numeric columns', () => {
    render(
      <DataTable
        columns={[{ key: 'createdAt', label: '创建时间', numeric: true }]}
        data={[{ id: 1, createdAt: '2026-08-25 10:30:00' }]}
      />
    );

    const desktopValue = screen.getAllByText('2026-08-25 10:30:00')
      .find((element) => element.closest('td'));
    expect(desktopValue.closest('td')).toHaveClass('tabular-data');
  });

  it('keeps current rows visible under the loading state until the next page arrives', () => {
    const columns = [
      { key: 'name', label: '名称' },
      { key: 'createdAt', label: '创建时间', numeric: true },
    ];
    const actions = () => <button>编辑</button>;
    const { rerender } = render(
      <DataTable
        columns={columns}
        data={[{ id: 1, name: '用户', createdAt: '2026-08-25' }]}
        actions={actions}
        pagination={{ page: 1, pageSize: 10, total: 20 }}
        onPageChange={vi.fn()}
      />
    );

    expect(screen.getAllByRole('cell')).toHaveLength(3);

    rerender(
      <DataTable
        columns={columns}
        data={[]}
        actions={actions}
        loading
        pagination={{ page: 2, pageSize: 10, total: 20 }}
        onPageChange={vi.fn()}
      />
    );
    const desktopUser = screen.getAllByText('用户')
      .find((element) => element.closest('tbody'));
    expect(desktopUser).toBeInTheDocument();
    expect(desktopUser.closest('[data-slot="data-table"]')).toHaveAttribute('aria-busy', 'true');
    expect(desktopUser.closest('tbody')).not.toHaveClass('opacity-0');
    rerender(<DataTable columns={columns} data={[{ id: 2, name: '新用户', createdAt: '2026-08-26' }]} actions={actions} />);
    expect(within(screen.getByRole('table')).getByText('新用户')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).queryByText('用户')).not.toBeInTheDocument();
  });

  it('uses a zero row key and exposes the expand control name', async () => {
    const interaction = userEvent.setup();
    const rows = [{ id: 8, name: '八号用户' }, { id: 0, name: '零号用户' }];
    const { rerender } = render(<DataTable columns={[{ key: 'name', label: '名称' }]} data={rows} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    let zeroCard = screen.getByRole('article', { name: '零号用户' });
    await interaction.click(within(zeroCard).getByRole('button', { name: '展开零号用户' }));
    expect(within(zeroCard).getByText('零号用户详情')).toBeInTheDocument();
    rerender(<DataTable columns={[{ key: 'name', label: '名称' }]} data={[rows[1], rows[0]]} rowKey="id" renderSubRow={(row) => <div>{row.name}详情</div>} variant="workspace" />);
    zeroCard = screen.getByRole('article', { name: '零号用户' });
    expect(within(zeroCard).getByText('零号用户详情')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: '八号用户' })).queryByText('八号用户详情')).not.toBeInTheDocument();
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

  it('renders each row as a labelled mobile card without duplicating the primary field', () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: 'name', label: '名称' },
          { key: 'email', label: '邮箱', mobileLabel: '联系邮箱' },
          { key: 'internal', label: '内部字段', mobileHidden: true },
        ]}
        data={[{ id: 1, name: '林海', email: 'lin@example.com', internal: 'hidden' }]}
        actions={() => <button>编辑</button>}
      />
    );

    const card = container.querySelector('[data-slot="data-table-mobile-card"]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('aria-label', '林海');
    expect(within(card).getAllByText('林海')).toHaveLength(1);
    expect(within(card).getByText('联系邮箱')).toBeInTheDocument();
    expect(within(card).getByText('lin@example.com')).toBeInTheDocument();
    expect(within(card).queryByText('内部字段')).not.toBeInTheDocument();
    expect(within(card).queryByText('hidden')).not.toBeInTheDocument();
    expect(within(card).getByRole('button', { name: '编辑' })).toBeInTheDocument();
  });

  it('uses an explicitly marked column as the mobile card primary content', () => {
    const { container } = render(
      <DataTable
        columns={[
          { key: 'code', label: '代码' },
          { key: 'name', label: '名称', mobilePrimary: true },
        ]}
        data={[{ id: 1, code: 'ROLE_ADMIN', name: '管理员' }]}
      />
    );

    const card = container.querySelector('[data-slot="data-table-mobile-card"]');
    expect(card).toHaveAttribute('aria-label', '管理员');
    expect(within(card).getAllByText('管理员')).toHaveLength(1);
    expect(within(card).getByText('代码')).toBeInTheDocument();
    expect(within(card).getByText('ROLE_ADMIN')).toBeInTheDocument();
  });
});
