import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { menuApi, systemConfigApi } from '@/lib/api';
import Sidebar from './sidebar';

const stableMocks = vi.hoisted(() => ({
  applySystemConfigTheme: vi.fn(),
}));

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());

vi.mock('next/link', () => ({
  default: ({ children, href, onClick, ...props }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onClick?.(event);
      }}
      {...props}
    >
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/reports/daily',
}));

vi.mock('@/lib/utils', () => ({
  cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));

vi.mock('@/lib/config/menu-icons', () => ({
  getMenuIcon: () => function MenuIcon(props) {
    return <svg aria-hidden="true" {...props} />;
  },
}));

vi.mock('@/components/ui/loading', () => ({
  Loading: () => <div>加载中</div>,
}));

vi.mock('@/lib/api', () => ({
  menuApi: { getUserMenus: vi.fn() },
  systemConfigApi: { getConfig: vi.fn() },
}));

vi.mock('@/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: null, isConnected: false }),
}));

vi.mock('@/lib/utils/theme', () => ({
  useColorTheme: () => ({ applySystemConfigTheme: stableMocks.applySystemConfigTheme }),
}));

vi.mock('@/lib/utils/auth', () => ({
  useAuth: () => ({
    user: { username: 'tester', real_name: '测试用户', email: 'tester@example.com' },
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/utils/http-client', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
}));

describe('Sidebar nested menu controls', () => {
  beforeEach(() => {
    menuApi.getUserMenus.mockResolvedValue({
      data: {
        businessMenus: [{
          id: 1,
          name: '报表中心',
          path: '/reports',
          icon: 'Chart',
          children: [{ id: 11, name: '日报', path: '/reports/daily', icon: 'File', children: [] }],
        }],
        systemMenus: [{
          id: 2,
          name: '系统工具',
          path: '#',
          icon: 'Settings',
          children: [{ id: 21, name: '用户工具', path: '/tools/users', icon: 'Users', children: [] }],
        }],
      },
    });
    systemConfigApi.getConfig.mockResolvedValue({ success: true, data: {} });
    stableMocks.applySystemConfigTheme.mockClear();
  });

  it('uses sibling navigation and named expansion buttons without nested controls', async () => {
    const interaction = userEvent.setup();
    const onNavigate = vi.fn();
    render(<Sidebar onNavigate={onNavigate} />);

    const reportLink = await screen.findByRole('link', { name: '报表中心' });
    const reportToggle = screen.getByRole('button', { name: '展开报表中心' });
    const toolsToggle = screen.getByRole('button', { name: '展开系统工具' });

    expect(reportLink.querySelector('button')).toBeNull();
    expect(document.querySelectorAll('a button')).toHaveLength(0);
    expect(reportToggle).toHaveAttribute('type', 'button');
    expect(reportToggle).toHaveAttribute('aria-expanded', 'false');
    expect(toolsToggle).toHaveAttribute('type', 'button');
    expect(toolsToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: '系统工具' })).not.toBeInTheDocument();

    await interaction.click(reportToggle);
    expect(screen.getByRole('button', { name: '收起报表中心' })).toHaveAttribute('aria-expanded', 'true');
    const childLink = screen.getByRole('link', { name: '日报' });
    await interaction.click(childLink);
    expect(onNavigate).toHaveBeenCalledTimes(1);

    await interaction.click(toolsToggle);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '收起系统工具' })).toHaveAttribute('aria-expanded', 'true')
    );
    expect(screen.getByRole('link', { name: '用户工具' })).toBeInTheDocument();
  });
});
