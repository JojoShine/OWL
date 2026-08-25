import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Header from './header';
import { systemConfigApi } from '@/lib/api';

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
vi.mock('@/lib/api', () => ({ systemConfigApi: { getConfig: vi.fn() } }));

describe('Header', () => {
  it('keeps the mobile navigation entry and respects a disabled theme switch', async () => {
    systemConfigApi.getConfig.mockResolvedValue({
      success: true,
      data: { enable_theme_switch: false },
    });

    render(<Header onMenuClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '打开导航菜单' })).toBeInTheDocument();
    await waitFor(() => expect(systemConfigApi.getConfig).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: '切换主题' })).not.toBeInTheDocument();
  });
});
