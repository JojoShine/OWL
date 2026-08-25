import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Pagination } from './pagination';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
  scrollIntoView: { configurable: true, value: () => {} },
});

describe('Pagination', () => {
  it('uses disabled buttons at the first page', () => {
    render(<Pagination page={1} total={80} pageSize={10} onPageChange={vi.fn()} onPageSizeChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '上一页' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveAttribute('aria-current', 'page');
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
