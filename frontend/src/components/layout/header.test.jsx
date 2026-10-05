import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './header';

globalThis.React = React;

vi.mock('@/lib/utils/auth', () => ({
  useAuth: () => ({ user: { username: 'alice' }, logout: vi.fn() }),
}));
vi.mock('@/components/notification/NotificationIcon', () => ({
  default: () => <span>通知</span>,
}));
vi.mock('@/components/layout/theme/theme-toggle', () => ({
  ThemeToggle: () => <button>切换主题</button>,
}));
vi.mock('@/contexts/AppShellDataContext', () => ({
  useAppShellData: () => ({ systemConfig: { enable_theme_switch: false } }),
}));

describe('Header', () => {
  it('labels the desktop toggle and forwards clicks', () => {
    const toggle = vi.fn();
    const view = render(<Header isDesktop navExpanded onMenuClick={toggle} />);
    const button = screen.getByRole('button', { name: '收起侧栏' });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button);
    expect(toggle).toHaveBeenCalledOnce();
    view.rerender(<Header isDesktop navExpanded={false} onMenuClick={toggle} />);
    expect(screen.getByRole('button', { name: '展开侧栏' })).toHaveAttribute('aria-expanded', 'false');
  });
  it('keeps the mobile navigation entry and respects a disabled theme switch', async () => {
    render(<Header onMenuClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '打开导航菜单' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '切换主题' })).not.toBeInTheDocument();
  });
});
