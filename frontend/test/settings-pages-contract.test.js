import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const settingsPages = [
  'src/pages/setting/config-management/index.jsx',
  'src/pages/setting/dashboard-widgets/index.jsx',
  'src/pages/setting/notification-settings/index.jsx',
  'src/pages/setting/watermark-settings/index.jsx',
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
