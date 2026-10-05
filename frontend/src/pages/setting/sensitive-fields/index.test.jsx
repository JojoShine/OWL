import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import SensitiveFieldsPage from './index';
import { sensitiveFieldApi } from '@/lib/api';

Object.defineProperties(HTMLElement.prototype, {
  hasPointerCapture: { configurable: true, value: () => false },
  releasePointerCapture: { configurable: true, value: () => {} },
});

vi.mock('@/lib/api', () => ({ sensitiveFieldApi: { getSensitiveFields: vi.fn() } }));
vi.mock('@/lib/utils', () => ({ cn: (...inputs) => inputs.filter(Boolean).join(' ') }));
vi.mock('@/lib/hooks/usePermission', () => ({ usePermission: () => ({ canCreate: () => true, canUpdate: () => true, canDelete: () => true }) }));
vi.mock('@/components/sensitive-fields/sensitive-field-form-dialog', () => ({ default: () => null }));
vi.mock('@/components/ui/confirm-dialog', () => ({ ConfirmDialog: () => null }));
vi.mock('@/components/ui/date-picker', () => ({ DatePicker: () => null }));
vi.mock('@/components/ui/combobox', () => ({ Combobox: () => null }));

it('shows all filters initially, submits selected filters and clears them on reset', async () => {
  sensitiveFieldApi.getSensitiveFields.mockResolvedValue({ data: { items: [], pagination: { total: 0 } } });
  const user = userEvent.setup();
  render(<SensitiveFieldsPage />);
  await waitFor(() => expect(sensitiveFieldApi.getSensitiveFields).toHaveBeenCalled());
  await user.click(screen.getAllByRole('combobox')[0]);
  await user.click(await screen.findByText('手机号', { selector: '.ant-select-item-option-content' }));
  await user.click(screen.getAllByRole('combobox')[1]);
  await user.click(await screen.findByText('禁用', { selector: '.ant-select-item-option-content' }));
  await user.type(screen.getByPlaceholderText('搜索字段名、表名...'), 'phone');
  await user.click(screen.getByRole('button', { name: '查询' }));
  await waitFor(() => expect(sensitiveFieldApi.getSensitiveFields).toHaveBeenLastCalledWith({
    search: 'phone', mask_type: 'phone', is_active: 'false', page: 1, limit: 10,
  }));
  await user.click(screen.getByRole('button', { name: '重置' }));
  await waitFor(() => expect(sensitiveFieldApi.getSensitiveFields).toHaveBeenLastCalledWith({
    search: '', mask_type: undefined, is_active: undefined, page: 1, limit: 10,
  }));
  expect(screen.getByText('全部脱敏类型', { selector: '.ant-select-content' })).toBeInTheDocument();
});
