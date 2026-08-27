import React from 'react';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());

vi.mock('@/lib/utils', async () => {
  const { cn } = await import('@/lib/utils/cn');
  return { cn };
});

describe('DialogContent overlayClassName', () => {
  it('keeps the default overlay and scopes a custom overlay', () => {
    const { rerender } = render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>默认弹窗</DialogTitle>
          <DialogDescription>默认弹窗说明</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'bg-black/35',
      'backdrop-blur-[1px]'
    );
    expect(document.querySelector('[data-slot="dialog-content"]')).toHaveClass(
      'w-[calc(100%-2rem)]',
      'sm:w-full'
    );

    rerender(
      <Dialog open>
        <DialogContent overlayClassName="bg-slate-950/35 backdrop-blur-[1px]">
          <DialogTitle>用户弹窗</DialogTitle>
          <DialogDescription>用户弹窗说明</DialogDescription>
        </DialogContent>
      </Dialog>
    );

    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass(
      'bg-slate-950/35',
      'backdrop-blur-[1px]'
    );
  });
});
