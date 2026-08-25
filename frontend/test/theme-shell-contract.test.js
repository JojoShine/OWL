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
});
