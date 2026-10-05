import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppearanceProvider } from '@/contexts/AppearanceContext';
import { ColorThemeToggle } from './color-theme-toggle';

beforeEach(() => localStorage.clear());

describe('scene theme menu', () => {
  it('offers scenes instead of raw colors and preserves the selected scene', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<AppearanceProvider><ColorThemeToggle /></AppearanceProvider>);
    await user.click(screen.getByRole('button', { name: /应用场景/ }));
    expect(screen.queryByRole('menuitem', { name: '蓝色' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitemradio', { name: /党政/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitemradio', { name: /政务/ }));
    expect(screen.getByRole('button', { name: '应用场景：政务' })).toBeInTheDocument();
    unmount();
    render(<AppearanceProvider><ColorThemeToggle /></AppearanceProvider>);
    await waitFor(() => expect(screen.getByRole('button', { name: '应用场景：政务' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: '应用场景：政务' }));
    await user.click(screen.getByRole('menuitem', { name: '恢复项目默认' }));
    expect(screen.getByRole('button', { name: '应用场景：通用' })).toBeInTheDocument();
  });
  it('can be opened and closed by keyboard, returning focus to the trigger', async () => {
    const user = userEvent.setup();
    render(<AppearanceProvider><ColorThemeToggle /></AppearanceProvider>);
    const trigger = screen.getByRole('button', { name: /应用场景/ });
    trigger.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('menuitemradio', { name: /政务/ })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
