import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RequireAuth from '@/components/auth/require-auth';
import LegacyLogsPage from '@/pages/setting/logs/index';
import { useRouter } from '@/lib/navigation';

const auth = vi.hoisted(() => ({ authenticated: false, loading: false }));
vi.mock('@/lib/utils/auth', () => ({ useAuth: () => ({ isLoading: auth.loading, isAuthenticated: () => auth.authenticated }) }));

it('redirects anonymous deep links without rendering protected data', async () => {
  auth.authenticated = false;
  render(<MemoryRouter basename="/owl" initialEntries={['/owl/setting/users']}><Routes>
    <Route path="/setting/users" element={<RequireAuth>私有内容</RequireAuth>} />
    <Route path="/login" element={<p>登录入口</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText('登录入口')).toBeInTheDocument();
  expect(screen.queryByText('私有内容')).not.toBeInTheDocument();
});
it('retains the legacy logs redirect under a basename', async () => {
  render(<MemoryRouter basename="/owl" initialEntries={['/owl/setting/logs']}><Routes>
    <Route path="/setting/logs" element={<LegacyLogsPage />} />
    <Route path="/logs" element={<p>日志内容</p>} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText('日志内容')).toBeInTheDocument();
});
it('keeps the router identity stable across navigation', async () => {
  const seen = [];
  function Probe() {
    const router = useRouter();
    seen.push(router);
    return <button onClick={() => router.push('/files')}>{useLocation().pathname}</button>;
  }
  render(<MemoryRouter initialEntries={['/dashboard']}><Probe /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: '/dashboard' }));
  expect(screen.getByRole('button', { name: '/files' })).toBeInTheDocument();
  expect(seen.every((router) => router === seen[0])).toBe(true);
});
