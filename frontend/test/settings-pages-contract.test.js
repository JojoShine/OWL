import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const settingsPages = [
  'app/(authenticated)/setting/config-management/page.jsx',
  'app/(authenticated)/setting/dashboard-widgets/page.js',
  'app/(authenticated)/setting/notification-settings/page.js',
  'app/(authenticated)/setting/watermark-settings/page.js',
];

describe('settings page surfaces', () => {
  it.each(settingsPages)('%s uses shared setting surfaces', (file) => {
    const source = read(file);
    expect(source).toContain('<PageShell');
    expect(source).toContain('<PageHeader');
    expect(source).not.toMatch(/bg-(blue|slate|gray)-/);
    expect(source).not.toMatch(/text-(slate|gray)-/);
  });
});
