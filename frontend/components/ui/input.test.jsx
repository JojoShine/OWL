import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

import { Input } from './input';

describe('Input', () => {
  it('uses a single brand border without a focus ring', () => {
    render(<Input aria-label="用户名" />);

    const input = screen.getByRole('textbox', { name: '用户名' });
    expect(input).toHaveClass('focus-visible:border-primary');
    expect(input.className).not.toContain('focus-visible:ring');
    expect(input).not.toHaveClass('focus-visible:border-foreground');
  });
});
