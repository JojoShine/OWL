import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import DynamicModulePage from '@/pages/dynamic-module';
import SharePage from '@/pages/share/detail';
import http from '@/lib/utils/http-client';

vi.mock('@/lib/utils/http-client', () => ({ default: { get: vi.fn() }, getApiBaseUrl: () => '/api' }));
vi.mock('@/components/dynamic-module/DynamicCrudPage', () => ({ DynamicCrudPage: () => <p>业务表格</p> }));
beforeEach(() => { http.get.mockReset(); });
it('loads the module named in the URL and reloads when its parameter changes', async () => {
  http.get.mockResolvedValue({ data: null });
  render(<MemoryRouter initialEntries={['/orders']}><Link to="/customers">客户</Link><Routes><Route path="/:slug" element={<DynamicModulePage />} /></Routes></MemoryRouter>);
  await screen.findByText('模块不存在');
  expect(http.get).toHaveBeenCalledWith('/generator/page-config/orders');
  await userEvent.click(screen.getByRole('link', { name: '客户' }));
  await waitFor(() => expect(http.get).toHaveBeenCalledWith('/generator/page-config/customers'));
});
it('loads a public share by code and renders an expired-link response', async () => {
  http.get.mockRejectedValue({ response: { data: { message: '链接已过期' } } });
  render(<MemoryRouter initialEntries={['/share/example']}><Routes><Route path="/share/:shareCode" element={<SharePage />} /></Routes></MemoryRouter>);
  expect(await screen.findByText('链接已过期')).toBeInTheDocument();
  expect(http.get).toHaveBeenCalledWith('/file-shares/example');
});
