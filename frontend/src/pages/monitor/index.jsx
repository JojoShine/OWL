
import { useState, useEffect } from 'react';
import {
  CpuIcon,
  HardDriveIcon,
  ActivityIcon,
  DatabaseIcon,
  ZapIcon,
  RefreshCwIcon,
} from 'lucide-react';
import { monitorApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PageHeader, PageShell } from '@/components/layout/page-shell';

export default function MonitorPage() {
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);

  // 历史数据（保留最近20个数据点用于图表展示）
  const [historyData, setHistoryData] = useState({
    cpu: [],
    memory: [],
    responseTime: [],
    network: [],
  });

  /**
   * 加载监控数据
   */
  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await monitorApi.getAllMetrics();
      const data = response.data || null;
      setMetrics(data);

      // 更新历史数据（用于图表展示）
      if (data) {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setHistoryData(prev => {
          const maxPoints = 20;
          return {
            cpu: [...prev.cpu, { time: timeLabel, value: data.system.cpu.usage }].slice(-maxPoints),
            memory: [...prev.memory, { time: timeLabel, value: data.system.memory.percent }].slice(-maxPoints),
            responseTime: [...prev.responseTime, { time: timeLabel, value: data.application.avgResponseTime }].slice(-maxPoints),
            network: [...prev.network, {
              time: timeLabel,
              upload: data.system.network.tx,
              download: data.system.network.rx
            }].slice(-maxPoints),
          };
        });
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
      toast.error('加载监控数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadMetrics();
  }, []);

  const databaseConnection = metrics?.database?.connection;
  const databaseAddress = databaseConnection?.host
    ? `${databaseConnection.host}${databaseConnection.port ? `:${databaseConnection.port}` : ''}`
    : '-';
  const databaseName = databaseConnection?.database || '';

  const cacheHost = metrics?.cache?.host;
  const cachePort = metrics?.cache?.port;
  const cacheAddress = cacheHost
    ? `${cacheHost}${cachePort ? `:${cachePort}` : ''}`
    : cachePort
      ? `:${cachePort}`
      : '-';

  return (
    <PageShell className="[&_.text-2xl]:tabular-data [&_.text-sm.font-medium]:tabular-data">
      <PageHeader
        title="系统监控"
        description="集中查看系统资源、应用、数据库与缓存运行状态。"
        actions={<Button onClick={loadMetrics} variant="outline" disabled={loading}>
          <RefreshCwIcon className={loading ? 'animate-spin' : ''} />
          刷新数据
        </Button>}
      />

      {/* 趋势图表区域 */}
      {metrics && historyData.cpu.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CPU 使用率趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">CPU 使用率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData.cpu}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-1)"
                    fill="var(--chart-1)"
                    fillOpacity={0.2}
                    name="CPU %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 内存使用率趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">内存使用率趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={historyData.memory}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-2)"
                    fill="var(--chart-2)"
                    fillOpacity={0.2}
                    name="内存 %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 响应时间趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">API 响应时间趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData.responseTime}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="响应时间 (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 网络流量趋势 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">网络流量趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={historyData.network}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="time"
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <YAxis
                    className="text-xs"
                    tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                    }}
                    labelStyle={{ color: 'var(--foreground)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="upload"
                    stroke="var(--chart-4)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="上传 (KB/s)"
                  />
                  <Line
                    type="monotone"
                    dataKey="download"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="下载 (KB/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 监控数据展示 */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 系统性能卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">CPU 使用率</CardTitle>
              <CpuIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.system.cpu.usage.toFixed(1)}%
              </div>
              <Progress value={metrics.system.cpu.usage} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.system.cpu.cores} 核心
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">内存使用率</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.system.memory.percent.toFixed(1)}%
              </div>
              <Progress value={metrics.system.memory.percent} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.system.memory.used.toFixed(1)} GB / {metrics.system.memory.total.toFixed(1)} GB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">磁盘使用率</CardTitle>
              <HardDriveIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.system.disk.percent.toFixed(1)}%
              </div>
              <Progress value={metrics.system.disk.percent} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.system.disk.used.toFixed(1)} GB / {metrics.system.disk.total.toFixed(1)} GB
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">网络流量</CardTitle>
              <ZapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">上传</span>
                  <span className="text-sm font-medium">
                    {metrics.system.network.tx.toFixed(2)} KB/s
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">下载</span>
                  <span className="text-sm font-medium">
                    {metrics.system.network.rx.toFixed(2)} KB/s
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 应用监控卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">平均响应时间</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.application.avgResponseTime.toFixed(0)} ms
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                最近 {metrics.application.totalRequests} 个请求
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">请求成功率</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.application.successRate.toFixed(1)}%
              </div>
              <Progress value={metrics.application.successRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">错误率</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.application.errorRate.toFixed(1)}%
              </div>
              <Progress value={metrics.application.errorRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">在线用户数</CardTitle>
              <ActivityIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.application.concurrentUsers}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                最近 15 分钟活跃
              </p>
            </CardContent>
          </Card>

          {/* 数据库监控卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">数据库连接</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">活跃</span>
                <span className="text-sm font-medium">
                  {metrics.database.connections.active}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">空闲</span>
                <span className="text-sm font-medium">
                  {metrics.database.connections.idle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">最大</span>
                <span className="text-sm font-medium">
                  {metrics.database.connections.max}
                </span>
              </div>
              <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">连接地址</span>
                  <span className="font-medium text-foreground">
                    {databaseAddress}
                  </span>
                </div>
                {databaseName ? (
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground">数据库</span>
                    <span className="font-medium text-foreground">{databaseName}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">数据库大小</CardTitle>
              <DatabaseIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.database.dbSize.sizeInMB.toFixed(2)} MB
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {metrics.database.dbSize.size}
              </p>
            </CardContent>
          </Card>

          {/* 缓存监控卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Redis 状态</CardTitle>
              <ZapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="text-2xl font-bold">
                  {metrics.cache.connected ? '已连接' : '未连接'}
                </div>
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {metrics.cache.status}
                </span>
              </div>
              <div className="mt-4 rounded-md border bg-muted/40 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">连接地址</span>
                  <span className="font-medium text-foreground">
                    {cacheAddress}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">缓存命中率</CardTitle>
              <ZapIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.cache.hitRate.toFixed(1)}%
              </div>
              <Progress value={metrics.cache.hitRate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                内存使用: {metrics.cache.memory.used.toFixed(2)} MB
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 加载状态 */}
      {!metrics && loading && (
        <div className="text-center py-12 text-muted-foreground">
          加载监控数据中...
        </div>
      )}
    </PageShell>
  );
}
