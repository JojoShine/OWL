import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
vi.mock('@/lib/utils', async () => { const { cn } = await import('@/lib/utils/cn'); return { cn }; });
describe('Ant Design dialog compatibility', () => {
  it('scopes overlay appearance and preserves caller scrolling layout', () => {
    render(<Dialog open><DialogContent className="flex max-h-[85vh] flex-col overflow-hidden p-0" overlayClassName="bg-slate-950/35"><DialogTitle>用户弹窗</DialogTitle><DialogDescription>说明</DialogDescription></DialogContent></Dialog>);
    expect(document.querySelector('.ant-modal-mask')).toHaveClass('bg-slate-950/35');
    expect(document.querySelector('[data-slot="dialog-content"]')).toHaveClass('flex', 'overflow-hidden', 'p-0');
    expect(screen.getByRole('dialog')).toHaveAccessibleName('用户弹窗');
  });
  it('routes the close button through controlled onOpenChange', () => {
    const change = vi.fn();
    render(<Dialog open onOpenChange={change}><DialogContent><DialogTitle>关闭测试</DialogTitle></DialogContent></Dialog>);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(change).toHaveBeenCalledWith(false);
  });
  it('allows an in-progress form to prevent Escape dismissal', async () => {
    const change = vi.fn();
    const prevent = vi.fn((event) => event.preventDefault());
    render(<Dialog open onOpenChange={change}><DialogContent onEscapeKeyDown={prevent}><DialogTitle>上传中</DialogTitle></DialogContent></Dialog>);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape', keyCode: 27 });
    await waitFor(() => expect(prevent).toHaveBeenCalled());
    expect(change).not.toHaveBeenCalled();
  });
});
