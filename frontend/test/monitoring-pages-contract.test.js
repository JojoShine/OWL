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

const responsiveDialogFiles = [
  'app/(authenticated)/monitor/alerts/page.js',
  'app/(authenticated)/monitor/apis/page.js',
  'components/monitor/ApiMonitorDetailDialog.jsx',
];

describe('monitoring page design contract', () => {
  it.each(monitoringPages)('%s uses shared page structure', (file) => {
    const source = read(file);
    expect(source).toContain('<PageShell');
    expect(source).toContain('<PageHeader');
  });

  it.each(responsiveDialogFiles)('%s stacks dialog fields before the small breakpoint', (file) => {
    const source = read(file);
    expect(source).not.toMatch(/className="grid grid-cols-2\b/);
    expect(source).toContain('className="grid grid-cols-1 gap-4 sm:grid-cols-2"');
  });

  it('gives every server row icon action a specific accessible name', () => {
    const source = read('app/(authenticated)/monitor/servers/page.js');
    [
      'aria-label={`管理 ${row.name} 的服务`}',
      'aria-label={`立即检查 ${row.name}`}',
      'aria-label={`查看 ${row.name} 的监控历史`}',
      'aria-label={`编辑 ${row.name}`}',
      'aria-label={`删除 ${row.name}`}',
    ].forEach((label) => expect(source).toContain(label));
  });

  it('keeps decorative metrics neutral while retaining semantic series, method, and alert colors', () => {
    const metric = read('components/dashboard/CountMetric.jsx');
    expect(metric).not.toMatch(/bg-(blue|purple|cyan)-/);
    expect(metric).toContain('tabular-data');
    expect(read('components/dashboard/DashboardCard.jsx')).toContain('const CHART_COLORS');
    expect(read('components/monitor/ApiMonitorTable.jsx')).toContain("PATCH: 'bg-purple-100");
    expect(read('app/(authenticated)/monitor/alerts/page.js')).toContain("critical: { className: 'bg-red-100");
  });
});
