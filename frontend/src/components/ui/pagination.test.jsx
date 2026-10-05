import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext } from './pagination';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
  scrollIntoView: { configurable: true, value: () => {} },
});

describe('Pagination', () => {
  it('keeps composable pagination links and disabled next actions compatible', async () => {
    const onPageChange = vi.fn();
    render(<Pagination><PaginationContent>
      <PaginationItem><PaginationLink isActive onClick={() => onPageChange(1)}>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationNext disabled onClick={() => onPageChange(2)} /></PaginationItem>
    </PaginationContent></Pagination>);
    expect(screen.getByRole('button', { name: '1' })).toHaveAttribute('aria-current', 'page');
    await userEvent.click(screen.getByRole('button', { name: '下一页' }));
    expect(onPageChange).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: '1' }));
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('uses Ant pagination and emits one page change for keyboard activation', async () => {
    const onPageChange = vi.fn();
    const { container } = render(<Pagination page={1} total={80} pageSize={10} onPageChange={onPageChange} />);
    expect(container.querySelector('.ant-pagination')).toBeInTheDocument();
    screen.getByRole('button', { name: '第 2 页' }).focus();
    await userEvent.keyboard(' ');
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2);
    onPageChange.mockClear();
    await userEvent.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledExactlyOnceWith(2);
  });

  it('uses disabled buttons at the first page', () => {
    render(<Pagination page={1} total={80} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
  });

  it('disables Next on the last page', () => {
    render(<Pagination page={8} total={80} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '下一页' })).toBeDisabled();
  });

  it('invokes the page-size callback before the reset callback', async () => {
    const interaction = userEvent.setup();
    const calls = [];
    render(
      <Pagination
        page={2}
        total={80}
        pageSize={10}
        onPageChange={(page) => calls.push(`page:${page}`)}
        onPageSizeChange={(pageSize) => calls.push(`size:${pageSize}`)}
      />
    );

    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));
    expect(calls).toEqual(['size:20', 'page:1']);
  });

  it('preserves the default page-size reset contract and allows an opt-out', async () => {
    const interaction = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    const { rerender } = render(<Pagination page={2} total={80} pageSize={10} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPageChange).toHaveBeenCalledWith(1);

    onPageChange.mockClear();
    onPageSizeChange.mockClear();
    rerender(<Pagination page={2} total={80} pageSize={10} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} resetPageOnPageSizeChange={false} />);
    await interaction.click(screen.getByRole('combobox'));
    await interaction.click(screen.getByRole('option', { name: '20' }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
