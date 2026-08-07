'use client';

import { useState, useEffect } from 'react';
import DashboardCard from '@/components/dashboard/DashboardCard';
import { dashboardWidgetApi, menuApi } from '@/lib/api';

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
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-muted rounded mb-2 w-1/2"></div>
              <div className="h-8 bg-muted rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4 w-1/3"></div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 数字指标行 */}
      {metricWidgets.length > 0 && (
        <div className={`grid ${getMetricCols(metricWidgets.length)} gap-4`}>
          {metricWidgets.map(({ widget, data, error }) => {
            const value = data?.[0]?.[widget.data_key] ?? '-';
            return (
              <div key={widget.id} className="bg-card border rounded-lg p-6 hover:shadow-md transition-shadow">
                <p className="text-sm text-muted-foreground mb-1">{widget.title}</p>
                <h3 className="text-3xl font-bold">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
    </div>
  );
}
