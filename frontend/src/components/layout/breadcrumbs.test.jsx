import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import PageBreadcrumbs, { getBreadcrumbs } from './breadcrumbs';

const menus = [{ name: '开发工具', path: '#', children: [{ name: '自定义接口', path: '/setting/api-builder' }] }];
vi.mock('@/contexts/AppShellDataContext', () => ({ useAppShellData: () => ({ businessMenus: [], systemMenus: menus, menusLoading: false }) }));

it('uses the actual menu hierarchy and names, including custom modules', () => {
  expect(getBreadcrumbs('/orders/', [{ name: '订单中心', path: '#', children: [{ name: '订单', path: '/orders' }] }])).toEqual([
    { title: '业务应用' }, { title: '订单中心', path: undefined }, { title: '订单', path: '/orders' },
  ]);
});
it('distinguishes creation and editing without exposing route IDs', () => {
  expect(getBreadcrumbs('/setting/api-builder/edit/new', [], menus).at(-1).title).toBe('新增接口');
  expect(getBreadcrumbs('/setting/api-builder/edit/42', [], menus).at(-1).title).toBe('编辑接口');
  expect(getBreadcrumbs('/unknown', [], menus)).toEqual([]);
});
it('does not invent parent access when the parent is absent from user menus', () => {
  expect(getBreadcrumbs('/setting/api-builder/keys')).toEqual([{ title: 'API 构建器' }, { title: '接口密钥' }]);
});
it('links permitted parents with the router basename and marks the current page', async () => {
  function Location() { return <output>{useLocation().pathname}</output>; }
  render(<MemoryRouter basename="/owl" initialEntries={['/owl/setting/api-builder/edit/42']}><PageBreadcrumbs /><Location /></MemoryRouter>);
  expect(screen.getByRole('navigation', { name: '面包屑' })).toBeInTheDocument();
  expect(screen.getByText('编辑接口')).toHaveAttribute('aria-current', 'page');
  expect(screen.queryByRole('link', { name: '开发工具' })).not.toBeInTheDocument();
  expect(screen.getByRole('link', { name: '自定义接口' })).toHaveAttribute('href', '/owl/setting/api-builder');
  await userEvent.click(screen.getByRole('link', { name: '自定义接口' }));
  expect(screen.getByRole('status')).toHaveTextContent('/setting/api-builder');
});
