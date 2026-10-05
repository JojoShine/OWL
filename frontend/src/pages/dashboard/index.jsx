
import { useState, useEffect } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { dashboardWidgetApi } from '@/lib/api';
import { PageShell } from '@/components/layout/page-shell';
import { useAppShellData } from '@/contexts/AppShellDataContext';

function hasPath(menus, targetPath) {
  for (const menu of menus) {
    if (menu.path === targetPath) return true;
    if (menu.children?.length && hasPath(menu.children, targetPath)) return true;
  }
  return false;
}

export default function DashboardPage() {
  const [widgets, setWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(true);
  const { businessMenus, systemMenus, menusLoading } = useAppShellData();

  useEffect(() => {
    if (menusLoading) return undefined;
    let active = true;
    const init = async () => {
      try {
        const accessible = hasPath([...businessMenus, ...systemMenus], '/dashboard');
        if (active) setHasAccess(accessible);

        if (accessible) {
          const widgetRes = await dashboardWidgetApi.executeAll();
          if (active) setWidgets(widgetRes.data || []);
        }
      } catch (error) {
        console.error('Failed to init dashboard:', error);
      } finally {
        if (active) setLoading(false);
      }
    };
    init();
    return () => { active = false; };
  }, [businessMenus, menusLoading, systemMenus]);

  const metricWidgets = widgets.filter(({ widget }) => widget.widget_type === 'metric');
  const chartWidgets = widgets.filter(({ widget }) => widget.widget_type === 'chart');
  const metricCount = metricWidgets.length || 5;

  // 根据数量选择合适的列数
  const getMetricCols = (count) => {
    if (count <= 3) return 'grid-cols-1 md:grid-cols-3';
    if (count <= 4) return 'grid-cols-2 md:grid-cols-4';
    if (count <= 5) return 'grid-cols-2 md:grid-cols-5';
    if (count <= 6) return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
    return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5';
  };

  if (loading) {
    return (
      <PageShell className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
              <div className="mb-2 h-4 w-1/2 rounded bg-muted"></div>
              <div className="h-7 rounded bg-muted"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex animate-pulse flex-col rounded-lg border bg-card p-4 lg:h-full lg:min-h-0">
              <div className="mb-3 h-5 w-1/3 rounded bg-muted"></div>
              <div className="h-60 rounded bg-muted lg:min-h-0 lg:flex-1"></div>
            </div>
          ))}
        </div>
      </PageShell>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <PageShell className="space-y-4 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-4 lg:space-y-0">
      {/* 数字指标行 */}
      {metricWidgets.length > 0 && (
        <div className={`grid shrink-0 ${getMetricCols(metricWidgets.length)} gap-3`}>
          {metricWidgets.map(({ widget, data, error }) => {
            const value = data?.[0]?.[widget.data_key] ?? '-';
            return (
              <div key={widget.id} className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground mb-1">{widget.title}</p>
                <h3 className="tabular-data text-2xl font-semibold tracking-tight">
                  {value}
                  {widget.unit && (
                    <span className="text-base font-normal ml-1 text-muted-foreground">{widget.unit}</span>
                  )}
                </h3>
                {error && <p className="text-xs text-destructive mt-2">{error}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* 图表网格 */}
      {chartWidgets.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:min-h-0 lg:flex-1 lg:auto-rows-fr lg:grid-cols-3">
          {chartWidgets.map(({ widget, data, error }) => (
            <DashboardCard
              key={widget.id}
              title={widget.title}
              data={error ? [] : data}
              mode={widget.chart_type || 'bar'}
              dataKey={widget.data_key || 'value'}
              xKey={widget.x_key || 'name'}
              unit={widget.unit || ''}
            />
          ))}
        </div>
      )}
    </PageShell>
  );
}
