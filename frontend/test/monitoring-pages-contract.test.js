import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const monitoringPages = [
  'app/(authenticated)/dashboard/page.js',
  'app/(authenticated)/monitor/page.js',
  'app/(authenticated)/monitor/alerts/page.js',
  'app/(authenticated)/monitor/apis/page.js',
  'app/(authenticated)/monitor/servers/page.js',
  'app/(authenticated)/monitor/zabbix/page.js',
  'app/(authenticated)/logs/page.js',
  'app/(authenticated)/notifications/page.js',
];

describe('monitoring page design contract', () => {
  it.each(monitoringPages)('%s uses shared page structure', (file) => {
    expect(read(file)).toContain('<PageShell');
  });

  it('metric cards avoid decorative accent backgrounds', () => {
    const metric = read('components/dashboard/CountMetric.jsx');
    expect(metric).not.toMatch(/bg-(blue|purple|cyan)-/);
    expect(metric).toContain('tabular-data');
  });
});
