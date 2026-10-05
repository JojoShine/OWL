import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import Sidebar from './sidebar';

const stableMocks = vi.hoisted(() => ({
  applySystemConfigTheme: vi.fn(),
  logout: vi.fn(),
}));

beforeAll(() => vi.stubGlobal('React', React));
afterAll(() => vi.unstubAllGlobals());

vi.mock('react-router-dom', () => ({
  Link: ({ children, to: href, onClick, ...props }) => (
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

vi.mock('@/lib/navigation', () => ({
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

vi.mock('@/contexts/AppShellDataContext', () => ({
  useAppShellData: () => ({
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
    menusLoading: false,
    systemConfig: {},
  }),
}));

vi.mock('@/contexts/SocketContext', () => ({
  useSocket: () => ({ socket: null, isConnected: false }),
}));

vi.mock('@/lib/utils/theme', () => ({
  useColorTheme: () => ({ applySystemConfigTheme: stableMocks.applySystemConfigTheme }),
}));

vi.mock('@/lib/utils/auth', () => ({
  useAuth: () => ({
    user: {
      username: 'tester',
      real_name: '测试用户',
      email: 'tester@example.com',
      roles: [{ name: '系统管理员', code: 'admin' }],
      department: { name: '研发中心' },
    },
    logout: stableMocks.logout,
  }),
}));

vi.mock('@/lib/utils/http-client', () => ({
  getApiBaseUrl: () => 'http://localhost:3000',
}));

describe('Sidebar nested menu controls', () => {
  it('keeps icon groups accessible and opens their child links when collapsed', async () => {
    const onNavigate = vi.fn();
    render(<Sidebar collapsed onNavigate={onNavigate} />);
    const button = screen.getByRole('button', { name: '报表中心' });
    expect(button).toHaveAttribute('aria-haspopup', 'menu');
    expect(button).toHaveClass('bg-sidebar-accent');
    expect(button).not.toHaveTextContent('报表中心');
    await userEvent.click(button);
    const child = await screen.findByRole('link', { name: '日报' });
    expect(child).toHaveAttribute('href', '/reports/daily');
    await userEvent.click(child);
    expect(onNavigate).toHaveBeenCalledOnce();
  });
  beforeEach(() => {
    stableMocks.applySystemConfigTheme.mockClear();
    stableMocks.logout.mockClear();
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

  it('shows complete user information and confirms before logout', async () => {
    const interaction = userEvent.setup();
    render(<Sidebar />);

    expect(await screen.findByText('测试用户')).toBeInTheDocument();
    expect(screen.getByText(/系统管理员/)).toBeInTheDocument();
    expect(screen.getByText('tester@example.com')).toBeInTheDocument();
    expect(screen.getByText(/研发中心/)).toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: '退出登录' }));
    expect(stableMocks.logout).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: '确认退出登录' })).toBeInTheDocument();

    await interaction.click(within(screen.getByRole('dialog')).getByRole('button', { name: '退出登录' }));
    expect(stableMocks.logout).toHaveBeenCalledTimes(1);
  });
});
