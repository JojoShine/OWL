import React from 'react';
import { describe, expect, it } from 'vitest';
import { matchRoutes, MemoryRouter, Link, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { routes, Screen } from './routes';
import { useRouter, useSearchParams } from '@/lib/navigation';

function Probe() {
  const router = useRouter();
  const location = useLocation();
  const query = useSearchParams();
  return <><Link to="/setting/users">用户</Link><button onClick={() => router.push('/files?folder=3')}>文件</button><output>{location.pathname}:{query.get('folder')}</output></>;
}

describe('SPA routing', () => {
  it.each([
    ['/share/example', '/share/:shareCode', { shareCode: 'example' }],
    ['/orders', ':slug', { slug: 'orders' }],
    ['/setting/api-builder/edit/18', 'setting/api-builder/edit/:id', { id: '18' }],
    ['/setting/logs', 'setting/logs', {}],
    ['/missing/deep/path', '*', { '*': 'missing/deep/path' }],
  ])('matches deep link %s', (url, route, params) => {
    const matches = matchRoutes(routes, url);
    expect(matches.at(-1).route.path).toBe(route);
    expect(matches.at(-1).params).toEqual(params);
    if (url.startsWith('/share/')) expect(matches.some((match) => match.route.id === 'authenticated')).toBe(false);
  });
  it('prefixes links once and supports imperative navigation with query params', async () => {
    render(<MemoryRouter basename="/owl" initialEntries={['/owl/dashboard']}><Probe /></MemoryRouter>);
    expect(screen.getByRole('link', { name: '用户' })).toHaveAttribute('href', '/owl/setting/users');
    await userEvent.click(screen.getByRole('button', { name: '文件' }));
    expect(screen.getByRole('status')).toHaveTextContent('/files:3');
  });
});

it('remounts a page for a new path parameter but preserves it for query changes', async () => {
  function StatefulPage() {
    const [value, setValue] = React.useState('');
    return <input aria-label="草稿" value={value} onChange={(event) => setValue(event.target.value)} />;
  }
  function TestScreen() {
    const router = useRouter();
    return <><button onClick={() => router.push('/orders?page=2')}>筛选</button><button onClick={() => router.push('/customers')}>换模块</button><Screen Page={StatefulPage} /></>;
  }
  render(<MemoryRouter initialEntries={['/orders']}><TestScreen /></MemoryRouter>);
  await userEvent.type(screen.getByLabelText('草稿'), '当前模块');
  await userEvent.click(screen.getByRole('button', { name: '筛选' }));
  expect(screen.getByLabelText('草稿')).toHaveValue('当前模块');
  await userEvent.click(screen.getByRole('button', { name: '换模块' }));
  expect(screen.getByLabelText('草稿')).toHaveValue('');
});
