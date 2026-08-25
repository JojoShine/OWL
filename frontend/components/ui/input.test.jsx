import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

import { Input } from './input';

describe('Input', () => {
  it('uses a single brand border with the ring explicitly reset', () => {
    render(<Input aria-label="用户名" />);

    const input = screen.getByRole('textbox', { name: '用户名' });
    expect(input).toHaveClass('focus-visible:border-primary');
    expect(input).toHaveClass('focus-visible:ring-0');
    expect(input.className).not.toMatch(/focus-visible:ring-(?:\[3px\]|2)/);
    expect(input).not.toHaveClass('focus-visible:border-foreground');
  });
});
