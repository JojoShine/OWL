import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('admin shell design contract', () => {
  it('defines the approved light palette', () => {
    const css = read('app/globals.css');
    expect(css).toContain('--background: #f4f7fb');
    expect(css).toContain('--foreground: #182230');
    expect(css).toContain('--primary: #2563eb');
    expect(css).toContain('--sidebar: #f8fafd');
    expect(css).toContain('--sidebar-accent: #eef4ff');
  });

  it('uses a lightweight sidebar rather than a primary color block', () => {
    const sidebar = read('components/layout/sidebar.jsx');
    expect(sidebar).toContain('bg-sidebar');
    expect(sidebar).toContain('text-sidebar-foreground');
    expect(sidebar).toContain('bg-sidebar-accent');
    expect(sidebar).not.toContain("'bg-primary text-primary-foreground'");
  });

  it('uses the real authenticated layout at the approved density', () => {
    const layout = read('app/(authenticated)/layout.js');
    expect(layout).toContain('w-60');
    expect(layout).toContain('p-4 md:p-5');
    expect(layout).toContain('md:translate-x-0');
    expect(layout).toContain('md:static');
  });

  it('loads the bundled Geist fonts without a network dependency', () => {
    const layout = read('app/layout.js');
    expect(layout).toContain('import localFont from "next/font/local"');
    expect(layout).toContain('../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2');
    expect(layout).toContain('../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2');
    expect(layout).not.toContain('next/font/google');
  });

  it('bootstraps the fixed QA identity only for an explicit local development preview', () => {
    const auth = read('lib/utils/auth.js');
    const bootstrapIndex = auth.indexOf("localStorage.setItem('__platform_id', 'ui-preview')");
    const tokenReadIndex = auth.indexOf("localStorage.getItem(getStorageKey('token'))");

    expect(auth).toContain("process.env.NODE_ENV !== 'production'");
    expect(auth).toContain("process.env.NEXT_PUBLIC_UI_PREVIEW === 'true'");
    expect(auth).toContain("['localhost', '127.0.0.1'].includes(window.location.hostname)");
    expect(auth).toContain("localStorage.setItem('ui-preview__token', 'preview-only')");
    expect(auth).toContain("email: 'preview@example.invalid'");
    expect(auth).toContain("roles: [{ code: 'super_admin' }]");
    expect(bootstrapIndex).toBeGreaterThan(-1);
    expect(bootstrapIndex).toBeLessThan(tokenReadIndex);
  });
});
