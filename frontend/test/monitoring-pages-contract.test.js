import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file) => readFileSync(resolve(process.cwd(), file), 'utf8');

const monitoringPages = [
  'src/pages/dashboard/index.jsx',
  'src/pages/monitor/index.jsx',
  'src/pages/monitor/alerts/index.jsx',
  'src/pages/monitor/apis/index.jsx',
  'src/pages/monitor/servers/index.jsx',
  'src/pages/logs/index.jsx',
  'src/pages/notifications/index.jsx',
];

const responsiveDialogFiles = [
  'src/pages/monitor/alerts/index.jsx',
  'src/pages/monitor/apis/index.jsx',
  'src/components/monitor/ApiMonitorDetailDialog.jsx',
];

describe('monitoring page design contract', () => {
  it.each(monitoringPages)('%s uses shared page structure', (file) => {
    const source = read(file);
    expect(source).toContain('<PageShell');
    if (file !== 'src/pages/dashboard/index.jsx') {
      expect(source).toContain('<PageHeader');
    }
  });

  it.each(responsiveDialogFiles)('%s stacks dialog fields before the small breakpoint', (file) => {
    const source = read(file);
    expect(source).not.toMatch(/className="grid grid-cols-2\b/);
    expect(source).toContain('className="grid grid-cols-1 gap-4 sm:grid-cols-2"');
  });

  it('gives every server row icon action a specific accessible name', () => {
    const source = read('src/pages/monitor/servers/index.jsx');
    [
      'aria-label={`管理 ${row.name} 的服务`}',
      'aria-label={`立即检查 ${row.name}`}',
      'aria-label={`查看 ${row.name} 的监控历史`}',
      'aria-label={`编辑 ${row.name}`}',
      'aria-label={`删除 ${row.name}`}',
    ].forEach((label) => expect(source).toContain(label));
  });

  it('uses the shared Select for server port protocols', () => {
    const source = read('src/pages/monitor/servers/server-services-dialog.js');

    expect(source).toContain("from '@/components/ui/select'");
    expect(source).toContain('<SelectTrigger id="protocol"');
    expect(source).toContain('<SelectItem value="tcp">TCP</SelectItem>');
    expect(source).toContain('<SelectItem value="udp">UDP</SelectItem>');
    expect(source).not.toContain('<select');
  });

  it('keeps decorative metrics neutral while retaining semantic series, method, and alert colors', () => {
    const metric = read('src/components/dashboard/CountMetric.jsx');
    expect(metric).not.toMatch(/bg-(blue|purple|cyan)-/);
    expect(metric).toContain('tabular-data');
    expect(read('src/components/dashboard/DashboardCard.jsx')).toContain('const CHART_COLORS');
    expect(read('src/components/monitor/ApiMonitorTable.jsx')).toContain("PATCH: 'bg-purple-100");
    expect(read('src/pages/monitor/alerts/index.jsx')).toContain("critical: { className: 'bg-red-100");
  });

  it('uses resolved theme tokens for monitoring chart structure colors', () => {
    const monitor = read('src/pages/monitor/index.jsx');
    const dashboardCard = read('src/components/dashboard/DashboardCard.jsx');

    expect(monitor).not.toMatch(/hsl\((?:var\(--|--)/);
    expect(monitor).toContain("backgroundColor: 'var(--card)'");
    expect(dashboardCard).toContain('const { resolvedTheme } = useTheme()');
    expect(dashboardCard).toContain("attributeFilter: ['class']");
    expect(dashboardCard).toContain('rootThemeVersion');
    expect(dashboardCard).toContain("getTailwindColor('--popover')");
    expect(dashboardCard).toContain("const CHART_COLORS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5']");
    expect(dashboardCard).not.toContain("theme === 'dark'");
  });
});
