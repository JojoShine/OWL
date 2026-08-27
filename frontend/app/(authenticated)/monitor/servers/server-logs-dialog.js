'use client';

import { useCallback, useState, useEffect } from 'react';
import { serverMonitorApi } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DataTable } from '@/components/common/DataTable';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function ServerLogsDialog({ open, onOpenChange, server }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  // 加载日志
  const fetchLogs = useCallback(async () => {
    if (!server || !open) return;

    try {
      setLoading(true);
      const response = await serverMonitorApi.getServerLogs(server.id, {
        page: pagination.page,
        limit: pagination.pageSize,
      });
      setLogs(response.data?.items || []);
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
      }
    } catch (error) {
      console.error('加载日志失败:', error);
      toast.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  }, [open, pagination.page, pagination.pageSize, server]);

  useEffect(() => {
    if (open && server) {
      fetchLogs();
    }
  }, [fetchLogs, open, server]);

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 状态徽章
  const getStatusBadge = (log) => {
    if (log.check_status === 'failed') {
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" />
          失败
        </Badge>
      );
    }
    
    // 检查是否有告警
    const hasAlert = log.cpu_usage > 90 || log.memory_usage > 90 || log.disk_usage > 90;
    if (hasAlert) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          告警
        </Badge>
      );
    }
    
    return (
      <Badge variant="success" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        正常
      </Badge>
    );
  };

  // 表格列配置
  const columns = [
    {
      key: 'checked_at',
      label: '检查时间',
      width: '180px',
      cellClassName: 'tabular-data',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    },
    {
      key: 'cpu_usage',
      label: 'CPU使用率',
      width: '100px',
      cellClassName: 'tabular-data',
      render: (value) => value !== null && value !== undefined ? `${value}%` : '-'
    },
    {
      key: 'memory_usage',
      label: '内存使用率',
      width: '120px',
      cellClassName: 'tabular-data',
      render: (value, record) => {
        if (value === null || value === undefined) return '-';
        const usedMb = parseFloat(record.memory_used_mb) || 0;
        const totalMb = parseFloat(record.memory_total_mb) || 0;
        return (
          <div className="text-xs">
            <div>{value}%</div>
            <div className="text-muted-foreground">
              {usedMb.toFixed(0)} / {totalMb.toFixed(0)} MB
            </div>
          </div>
        );
      }
    },
    {
      key: 'disk_usage',
      label: '磁盘使用率',
      width: '120px',
      cellClassName: 'tabular-data',
      render: (value, record) => {
        if (value === null || value === undefined) return '-';
        const usedGb = parseFloat(record.disk_used_gb) || 0;
        const totalGb = parseFloat(record.disk_total_gb) || 0;
        return (
          <div className="text-xs">
            <div>{value}%</div>
            <div className="text-muted-foreground">
              {usedGb.toFixed(1)} / {totalGb.toFixed(1)} GB
            </div>
          </div>
        );
      }
    },
    {
      key: 'load_avg_1m',
      label: '系统负载',
      width: '140px',
      cellClassName: 'tabular-data',
      render: (value, record) => {
        if (value === null || value === undefined) return '-';
        const load5m = parseFloat(record.load_avg_5m) || 0;
        const load15m = parseFloat(record.load_avg_15m) || 0;
        return (
          <div className="text-xs">
            <div>{value}</div>
            <div className="text-muted-foreground">
              5m: {load5m.toFixed(2)}, 15m: {load15m.toFixed(2)}
            </div>
          </div>
        );
      }
    },
    {
      key: 'check_status',
      label: '状态',
      width: '100px',
      render: (value, record) => getStatusBadge(record)
    },
    {
      key: 'error_message',
      label: '错误信息',
      render: (value) => value ? <span className="text-xs text-destructive">{value}</span> : '-'
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {server?.name} - 监控历史
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 flex-1 overflow-auto rounded-lg border">
          <DataTable
            columns={columns}
            data={logs}
            loading={loading}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50, 100]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
