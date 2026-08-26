'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { dashboardWidgetApi, menuApi } from '@/lib/api';
import { PageShell } from '@/components/layout/page-shell';

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

  useEffect(() => {
    const init = async () => {
      try {
        const response = await menuApi.getUserMenus();
        const { businessMenus = [], systemMenus = [] } = response.data || {};
        const accessible = hasPath([...businessMenus, ...systemMenus], '/dashboard');
        setHasAccess(accessible);

        if (accessible) {
          const widgetRes = await dashboardWidgetApi.executeAll();
          setWidgets(widgetRes.data || []);
        }
      } catch (error) {
        console.error('Failed to init dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

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
      <PageShell className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
              <div className="mb-2 h-4 w-1/2 rounded bg-muted"></div>
              <div className="h-7 rounded bg-muted"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border bg-card p-4">
              <div className="mb-3 h-5 w-1/3 rounded bg-muted"></div>
              <div className="h-[clamp(180px,24vh,240px)] rounded bg-muted"></div>
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
    <PageShell className="space-y-4">
      {/* 数字指标行 */}
      {metricWidgets.length > 0 && (
        <div className={`grid ${getMetricCols(metricWidgets.length)} gap-3`}>
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
