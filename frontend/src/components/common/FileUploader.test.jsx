import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import FileUploader from './FileUploader';
import { uploadApi } from '@/lib/api/system/upload.api';
vi.mock('@/lib/api/system/upload.api', () => ({ uploadApi: { uploadFile: vi.fn(), getFileStreamUrl: (path) => path } }));
vi.mock('@/components/ui/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
it('can replace an existing cover repeatedly and remove it', async () => {
  uploadApi.uploadFile.mockResolvedValueOnce({ data: { path: 'second.png' } }).mockResolvedValueOnce({ data: { path: 'third.png' } });
  function Example() { const [value, setValue] = useState('first.png'); return <FileUploader label="登录背景" value={value} onUpload={setValue} />; }
  render(<Example />);
  const input = screen.getByLabelText('上传登录背景');
  const click = vi.spyOn(input, 'click');
  fireEvent.click(screen.getByRole('button', { name: '更换图片' }));
  expect(click).toHaveBeenCalledOnce();
  const file = new File(['image'], 'cover.png', { type: 'image/png' });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText('登录背景')).toHaveAttribute('src', 'second.png'));
  expect(input.value).toBe('');
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByAltText('登录背景')).toHaveAttribute('src', 'third.png'));
  fireEvent.click(screen.getByRole('button', { name: '移除登录背景' }));
  expect(screen.queryByAltText('登录背景')).not.toBeInTheDocument();
  expect(screen.getByLabelText('上传登录背景')).toBe(input);
});
