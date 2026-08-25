import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { normalizeSelectValue, SearchFilter } from './SearchFilter';

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

vi.mock('@/components/ui/date-picker', () => ({
  DatePicker: ({ className, placeholder }) => (
    <button data-testid="date-picker" className={className}>{placeholder}</button>
  ),
}));

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
  scrollIntoView: { configurable: true, value: () => {} },
});

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

const fields = [{ type: 'text', name: 'keyword', placeholder: '搜索用户' }];

describe('SearchFilter', () => {
  it('submits from a text input when Enter is pressed', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={onSearch} onReset={vi.fn()} variant="toolbar" />);
    await user.type(screen.getByPlaceholderText('搜索用户'), 'alice{enter}');
    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it('does not submit when Enter originates from a non-text control', () => {
    const onSearch = vi.fn();
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={onSearch} onReset={vi.fn()} variant="toolbar" />);
    fireEvent.keyDown(screen.getByRole('button', { name: '重置' }), { key: 'Enter' });
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('does not submit when Enter originates from the real Combobox search input', async () => {
    const onSearch = vi.fn();
    const interaction = userEvent.setup();
    render(
      <SearchFilter
        fields={[{
          type: 'combobox',
          name: 'role',
          placeholder: '选择角色',
          options: [
            { value: 'admin', label: '管理员' },
            { value: 'user', label: '普通用户' },
          ],
        }]}
        values={{}}
        onChange={vi.fn()}
        onSearch={onSearch}
        onReset={vi.fn()}
        variant="toolbar"
      />
    );

    await interaction.click(screen.getByRole('combobox'));
    const comboboxSearch = await screen.findByPlaceholderText('搜索...');
    await interaction.type(comboboxSearch, '管理{enter}');

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('normalizes the all option without changing explicit all values', () => {
    expect(normalizeSelectValue('all', {})).toBe('');
    expect(normalizeSelectValue('all', { preserveAllValue: true })).toBe('all');
  });

  it('renders right-side actions in toolbar mode', () => {
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={vi.fn()} onReset={vi.fn()} variant="toolbar" rightActions={<button>导出</button>} />);
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument();
  });

  it('keeps toolbar controls at 40px', () => {
    render(
      <SearchFilter
        fields={[{ type: 'dateRange', name: 'createdAt' }]}
        values={{}}
        onChange={vi.fn()}
        onSearch={vi.fn()}
        onReset={vi.fn()}
        variant="toolbar"
      />
    );
    const controls = screen.getAllByTestId('date-picker');
    const rangeField = controls[0].parentElement.parentElement;

    expect(controls).toHaveLength(2);
    expect(controls.every((control) => control.className.includes('h-10'))).toBe(true);
    expect(screen.getByRole('button', { name: '查询' })).toHaveClass('h-10');
    expect(screen.getByRole('button', { name: '重置' })).toHaveClass('h-10');
    expect(rangeField).toHaveClass('flex-1', 'min-w-0', 'sm:min-w-[360px]');
    expect(rangeField).not.toHaveClass('min-w-[360px]');
  });
});
