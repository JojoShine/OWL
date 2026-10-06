import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './theme-provider';

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return <><output>{theme}:{resolvedTheme}</output><button onClick={() => setTheme('dark')}>深色</button><button onClick={() => setTheme('system')}>系统</button></>;
}
beforeEach(() => localStorage.clear());
it('persists explicit preference and updates document color scheme', () => {
  render(<ThemeProvider><Probe /></ThemeProvider>);
  fireEvent.click(screen.getByText('深色'));
  expect(screen.getByText('dark:dark')).toBeInTheDocument();
  expect(document.documentElement).toHaveClass('dark');
  expect(document.documentElement.style.colorScheme).toBe('dark');
  expect(localStorage.getItem('theme')).toBe('dark');
});
it('follows system changes only when system is selected and syncs other tabs', () => {
  let listener;
  const original = window.matchMedia;
  const query = { matches: false, addEventListener: vi.fn((_, callback) => { listener = callback; }), removeEventListener: vi.fn() };
  window.matchMedia = () => query;
  const view = render(<ThemeProvider><Probe /></ThemeProvider>);
  fireEvent(window, new StorageEvent('storage', { key: 'theme', newValue: 'dark' }));
  expect(screen.getByText('dark:dark')).toBeInTheDocument();
  fireEvent.click(screen.getByText('系统'));
  expect(screen.getByText('system:light')).toBeInTheDocument();
  query.matches = true;
  act(() => listener());
  expect(screen.getByText('system:dark')).toBeInTheDocument();
  fireEvent.click(screen.getByText('深色'));
  query.matches = false;
  act(() => listener());
  expect(document.documentElement).toHaveClass('dark');
  view.unmount();
  expect(query.removeEventListener).toHaveBeenCalled();
  window.matchMedia = original;
});
it('defaults to light even when the system is dark', () => {
  const original = window.matchMedia;
  window.matchMedia = () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() });
  const view = render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText('light:light')).toBeInTheDocument();
  expect(document.documentElement).not.toHaveClass('dark');
  view.unmount();
  window.matchMedia = original;
});
