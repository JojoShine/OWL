import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PageHeader, PageShell, PageSurface, PageToolbar } from './page-shell';

describe('admin page shell', () => {
  it('exposes the approved page hierarchy without owning business state', () => {
    render(
      <PageShell data-testid="shell">
        <PageHeader title="角色管理" description="维护角色及权限范围" actions={<button>新增角色</button>} />
        <PageToolbar data-testid="toolbar">筛选</PageToolbar>
        <PageSurface data-testid="surface">数据</PageSurface>
      </PageShell>
    );

    expect(screen.getByTestId('shell')).toHaveClass('max-w-[1600px]', 'space-y-5');
    expect(screen.getByRole('heading', { name: '角色管理' })).toHaveClass('text-xl', 'font-semibold');
    expect(screen.getByText('维护角色及权限范围')).toHaveClass('text-muted-foreground');
    expect(screen.getByTestId('toolbar')).toHaveClass('rounded-lg', 'border', 'bg-card');
    expect(screen.getByTestId('surface')).toHaveClass('overflow-hidden', 'rounded-lg', 'border', 'bg-card');
  });
});
