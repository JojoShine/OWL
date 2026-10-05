import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AuthenticatedLayout from './AuthenticatedLayout.jsx';

globalThis.React = React;
afterEach(() => vi.restoreAllMocks());

vi.mock('@/components/layout/breadcrumbs', () => ({ default: () => null }));

vi.mock('@/components/auth/require-auth', () => ({
  default: ({ children }) => children,
}));
vi.mock('@/contexts/CombinedProviders', () => ({
  CombinedProviders: ({ children }) => children,
}));
vi.mock('@/components/layout/header', () => ({
  default: ({ onMenuClick }) => (
    <button type="button" onClick={onMenuClick}>
      打开导航菜单
    </button>
  ),
}));
vi.mock('@/components/layout/sidebar', () => ({
  default: () => <nav>导航</nav>,
}));
vi.mock('@/components/common/watermark/watermark-renderer', () => ({
  default: () => null,
}));
vi.mock('@/lib/utils', () => ({
  cn: (...classes) => classes.filter(Boolean).join(' '),
}));

describe('AuthenticatedLayout', () => {
  it('collapses and restores the desktop sidebar without opening the mobile overlay', async () => {
    let onResize;
    const query = { matches: true, addEventListener: (_, callback) => { onResize = callback; }, removeEventListener: vi.fn() };
    vi.spyOn(window, 'matchMedia').mockReturnValue(query);
    const user = userEvent.setup();
    render(<AuthenticatedLayout>页面内容</AuthenticatedLayout>);
    const sidebar = document.getElementById('app-sidebar');
    expect(sidebar).not.toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    expect(sidebar).toHaveClass('md:w-16', 'md:visible');
    expect(sidebar).not.toHaveAttribute('inert');
    expect(screen.queryByRole('button', { name: '关闭导航菜单' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    expect(sidebar).toHaveClass('md:w-60', 'md:visible');
    expect(sidebar).not.toHaveAttribute('inert');
    act(() => { query.matches = false; onResize(); });
    expect(sidebar).toHaveAttribute('inert');
    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    expect(sidebar).not.toHaveAttribute('inert');
    act(() => { query.matches = true; onResize(); });
    expect(screen.queryByRole('button', { name: '关闭导航菜单' })).not.toBeInTheDocument();
  });
  it('hides the closed mobile sidebar while keeping the desktop visibility override', async () => {
    const user = userEvent.setup();
    render(<AuthenticatedLayout>页面内容</AuthenticatedLayout>);

    const aside = screen.getByRole('navigation').closest('aside');
    expect(aside).toHaveClass('-translate-x-full', 'invisible', 'md:visible');

    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    expect(aside).toHaveClass('translate-x-0', 'visible', 'md:visible');
    expect(aside).not.toHaveClass('invisible');
  });

  it('closes mobile navigation with Escape or the overlay', async () => {
    const user = userEvent.setup();
    render(<AuthenticatedLayout>页面内容</AuthenticatedLayout>);

    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    expect(screen.getByRole('button', { name: '关闭导航菜单' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('button', { name: '关闭导航菜单' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '打开导航菜单' }));
    await user.click(screen.getByRole('button', { name: '关闭导航菜单' }));
    expect(screen.queryByRole('button', { name: '关闭导航菜单' })).not.toBeInTheDocument();
  });
});
