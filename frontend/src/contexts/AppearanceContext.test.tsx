import React from 'react';
import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppearanceProvider, useAppearance } from './AppearanceContext';

function Consumer({ name }: { name: string }) {
  const { sceneTheme, setSceneTheme, resetSceneTheme } = useAppearance();
  return <section aria-label={name}>
    <output aria-label={name}>{sceneTheme}</output>
    <button onClick={() => setSceneTheme('general')}>选择通用 {name}</button>
    <button onClick={resetSceneTheme}>恢复默认 {name}</button>
  </section>;
}

beforeEach(() => { localStorage.clear(); vi.stubEnv('VITE_PLATFORM_ID', 'scene-test'); });

describe('shared scene preferences', () => {
  it('updates all consumers and preserves choice across reload and late defaults', async () => {
    const { rerender, unmount } = render(<AppearanceProvider projectDefault="government-service"><Consumer name="A" /><Consumer name="B" /></AppearanceProvider>);
    fireEvent.click(screen.getByText('选择通用 A'));
    expect(screen.getByLabelText('B', { selector: 'output' })).toHaveTextContent('general');
    rerender(<AppearanceProvider projectDefault="government-service"><Consumer name="A" /><Consumer name="B" /></AppearanceProvider>);
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('general');
    unmount();
    render(<AppearanceProvider projectDefault="government-service"><Consumer name="A" /></AppearanceProvider>);
    await waitFor(() => expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('general'));
    fireEvent.click(screen.getByText('恢复默认 A'));
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('government-service');
    expect(localStorage.getItem('scene-test__appearance-scene')).toBeNull();
  });
  it('ignores legacy colors and keeps switching when storage is unavailable', () => {
    localStorage.setItem('color-theme', 'red');
    render(<AppearanceProvider projectDefault="government-service"><Consumer name="A" /></AppearanceProvider>);
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('government-service');
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('unavailable'); });
    fireEvent.click(screen.getByText('选择通用 A'));
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('general');
    write.mockRestore();
  });
  it('syncs changes from another tab but ignores another project key', async () => {
    render(<AppearanceProvider projectDefault="government-service"><Consumer name="A" /></AppearanceProvider>);
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'other__appearance-scene', newValue: 'general' })));
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('government-service');
    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'scene-test__appearance-scene', newValue: 'general' })));
    expect(screen.getByLabelText('A', { selector: 'output' })).toHaveTextContent('general');
  });
});
