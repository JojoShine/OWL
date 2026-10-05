import { Users, UserCheck, LogIn, Clock, HardDrive } from 'lucide-react';

/**
 * Count Metric Component
 * Displays a single count metric with icon, label, and value
 */
export default function CountMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <h3 className="tabular-data text-3xl font-semibold tracking-tight">{value ?? '-'}</h3>
        </div>
        <div className="rounded-md border bg-muted/40 p-2.5 text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

/**
 * Count Metrics Container Component
 * Displays all 5 count metrics in a grid
 */
export function CountMetricsContainer({ metrics }) {
  const metricConfig = [
    { key: 'activeUsers', label: '活跃用户', icon: UserCheck },
    { key: 'totalUsers', label: '总用户数', icon: Users },
    { key: 'recentLogins', label: '最近登录', icon: LogIn },
    { key: 'runningDays', label: '运行天数', icon: Clock },
    { key: 'diskUsagePercent', label: '磁盘使用', icon: HardDrive },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      {metricConfig.map((config) => (
        <CountMetric
          key={config.key}
          icon={config.icon}
          label={config.label}
          value={metrics?.[config.key]}
        />
      ))}
    </div>
  );
}
