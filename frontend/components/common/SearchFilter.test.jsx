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
vi.mock('@/components/ui/combobox', () => ({ Combobox: () => null }));

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

  it('normalizes the all option without changing explicit all values', () => {
    expect(normalizeSelectValue('all', {})).toBe('');
    expect(normalizeSelectValue('all', { preserveAllValue: true })).toBe('all');
  });

  it('renders right-side actions in toolbar mode', () => {
    render(<SearchFilter fields={fields} values={{}} onChange={vi.fn()} onSearch={vi.fn()} onReset={vi.fn()} variant="toolbar" rightActions={<button>导出</button>} />);
    expect(screen.getByRole('button', { name: '导出' })).toBeInTheDocument();
  });

  it('renders both date range controls at 36px in toolbar mode', () => {
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
    expect(screen.getAllByTestId('date-picker')).toHaveLength(2);
    expect(screen.getAllByTestId('date-picker').every((control) => control.className.includes('h-9'))).toBe(true);
  });
});
