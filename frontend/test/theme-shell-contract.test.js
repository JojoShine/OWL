import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('admin shell design contract', () => {
  it('defines the approved light palette', () => {
    const css = read('src/styles.css');
    expect(css).toContain('--background: #f5f6f8');
    expect(css).toContain('--foreground: #1f2328');
    expect(css).toContain('--primary: #25282d');
    expect(css).toContain('--accent: #f1f3f5');
    expect(css).toContain('--sidebar: #ffffff');
    expect(css).toContain('--sidebar-primary: #25282d');
    expect(css).toContain('--sidebar-accent: #f1f3f5');
  });

  it('defines the approved layered charcoal dark palette', () => {
    const css = read('src/styles.css');
    expect(css).toContain('--background: #0b0b0c');
    expect(css).toContain('--card: #18181b');
    expect(css).toContain('--popover: #202023');
    expect(css).toContain('--foreground: #f1f1f2');
    expect(css).toContain('--muted-foreground: #a1a1aa');
    expect(css).toContain('--border: #2e2e33');
    expect(css).toContain('--sidebar: #161618');
    expect(css).toContain('color-scheme: dark');
  });

  it('keeps every explicit color theme legible on dark chart surfaces', () => {
    const css = read('src/styles.css');

    for (const theme of ['blue', 'green', 'purple', 'orange', 'red', 'cyan']) {
      expect(css).toMatch(
        new RegExp(`\\.theme-${theme}\\.dark\\s*\\{[^}]*--chart-1:[^}]*--chart-5:`)
      );
    }
  });

  it('uses a lightweight sidebar rather than a primary color block', () => {
    const sidebar = read('src/components/layout/sidebar.jsx');
    expect(sidebar).toContain('bg-sidebar');
    expect(sidebar).toContain('text-sidebar-foreground');
    expect(sidebar).toContain('bg-sidebar-accent');
    expect(sidebar).not.toContain("'bg-primary text-primary-foreground'");
  });

  it('uses the real authenticated layout at the approved density', () => {
    const layout = read('src/layouts/AuthenticatedLayout.jsx');
    expect(layout).toContain('w-60');
    expect(layout).toContain('p-4 md:p-5');
    expect(layout).toContain('md:translate-x-0');
    expect(layout).toContain('md:static');
  });

  it('loads the bundled Geist fonts without a network dependency', () => {
    const entry = read('src/main.tsx');
    expect(entry).toContain("import '@fontsource/geist/latin-400.css'");
    expect(entry).toContain("import '@fontsource/geist-mono/latin-400.css'");
    expect(entry).not.toContain('next/font');
  });

  it('bootstraps the fixed QA identity only for an explicit local development preview', () => {
    const auth = read('src/lib/utils/auth.js');
    const syncIndex = auth.indexOf('syncUiPreviewAuth({');
    const tokenReadIndex = auth.indexOf("localStorage.getItem(getStorageKey('token'))");

    expect(auth).toContain("import { syncUiPreviewAuth } from './ui-preview-auth';");
    expect(auth).toContain("nodeEnv: (import.meta.env.PROD ? 'production' : 'development')");
    expect(auth).toContain('previewEnabled: import.meta.env.VITE_UI_PREVIEW');
    expect(auth).toContain('hostname: window.location.hostname');
    expect(syncIndex).toBeGreaterThan(-1);
    expect(syncIndex).toBeLessThan(tokenReadIndex);
  });
});
