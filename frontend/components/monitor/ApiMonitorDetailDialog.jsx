'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loading } from '@/components/ui/loading';
import { CheckCircle2, XCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { apiMonitorApi } from '@/lib/api';

export default function ApiMonitorDetailDialog({ open, onOpenChange, monitor }) {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && monitor?.id) {
      loadData();
    }
  }, [open, monitor]);

  const loadData = async () => {
    if (!monitor?.id) return;

    setLoading(true);
    try {
      // 并行加载统计和日志
      const [statsRes, logsRes] = await Promise.all([
        apiMonitorApi.getMonitorStats(monitor.id, { hours: 24 }),
        apiMonitorApi.getMonitorLogs(monitor.id, { limit: 20 })
      ]);

      setStats(statsRes.data);
      setLogs(logsRes.data?.items || logsRes.data || []);
    } catch (error) {
      console.error('加载监控详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 渲染状态徽章
   */
  const renderStatusBadge = (status) => {
    const statusConfig = {
      success: {
        icon: CheckCircle2,
        variant: 'success',
        label: '成功'
      },
      failed: {
        icon: XCircle,
        variant: 'destructive',
        label: '失败'
      },
      timeout: {
        icon: Clock,
        variant: 'warning',
        label: '超时'
      }
    };

    const config = statusConfig[status] || statusConfig.failed;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  /**
   * 格式化响应时间
   */
  const formatResponseTime = (ms) => {
    if (!ms && ms !== 0) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (!monitor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[1200px]">
        <DialogHeader>
          <DialogTitle>监控详情 - {monitor.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card className="bg-muted/30 shadow-none">
            <CardHeader>
              <CardTitle className="text-base">配置信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">URL：</span>
                  <span className="font-mono break-all">{monitor.url}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">方法：</span>
                  <Badge variant="outline">{monitor.method}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">检测间隔：</span>
                  <span className="tabular-data">{monitor.interval}秒</span>
                </div>
                <div>
                  <span className="text-muted-foreground">超时时间：</span>
                  <span className="tabular-data">{monitor.timeout}秒</span>
                </div>
                <div>
                  <span className="text-muted-foreground">期望状态码：</span>
                  <span className="tabular-data">{monitor.expect_status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">状态：</span>
                  <Badge variant={monitor.enabled ? 'default' : 'secondary'}>
                    {monitor.enabled ? '已启用' : '已禁用'}
                  </Badge>
                </div>
              </div>
              {monitor.expect_response && (
                <div>
                  <span className="text-muted-foreground">期望响应内容：</span>
                  <span className="font-mono">{monitor.expect_response}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 统计信息 */}
          {stats && (
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    可用率（24h）
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="tabular-data text-2xl font-semibold">
                    {stats.availability !== undefined
                      ? `${stats.availability.toFixed(2)}%`
                      : '-'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    平均响应时间
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="tabular-data text-2xl font-semibold">
                    {formatResponseTime(stats.avgResponseTime)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    检测次数
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="tabular-data text-2xl font-semibold">
                    {stats.totalChecks || 0}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    成功 {stats.successCount || 0} / 失败 {stats.failedCount || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 监控日志 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">最近检测记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loading size="sm" variant="pulse" />
              ) : logs.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">暂无检测记录</div>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead style={{ width: '180px' }}>时间</TableHead>
                        <TableHead style={{ width: '100px' }}>状态</TableHead>
                        <TableHead style={{ width: '100px' }}>状态码</TableHead>
                        <TableHead style={{ width: '120px' }}>响应时间</TableHead>
                        <TableHead style={{ width: 'auto' }}>错误信息</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="tabular-data text-sm">
                            {formatDateTime(log.created_at)}
                          </TableCell>
                          <TableCell>
                            {renderStatusBadge(log.status)}
                          </TableCell>
                          <TableCell className="tabular-data">
                            {log.status_code || '-'}
                          </TableCell>
                          <TableCell className="tabular-data">
                            {formatResponseTime(log.response_time)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.error_message ? (
                              <span className="text-red-600 dark:text-red-400">
                                {log.error_message.length > 50
                                  ? `${log.error_message.substring(0, 50)}...`
                                  : log.error_message}
                              </span>
                            ) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
