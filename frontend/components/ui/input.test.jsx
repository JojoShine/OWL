import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

import { Input } from './input';

describe('Input', () => {
  it('uses the brand focus treatment instead of the foreground color', () => {
    render(<Input aria-label="用户名" />);

    const input = screen.getByRole('textbox', { name: '用户名' });
    expect(input).toHaveClass('focus-visible:border-ring');
    expect(input).toHaveClass('focus-visible:ring-ring/20');
    expect(input).toHaveClass('focus-visible:ring-[3px]');
    expect(input).not.toHaveClass('focus-visible:border-foreground');
  });
});
