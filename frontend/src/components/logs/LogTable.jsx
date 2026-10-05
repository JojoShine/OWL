import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EyeIcon } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/date';
import { DataTable } from '@/components/common/DataTable';
import { Badge } from '@/components/ui/badge';

export default function LogTable({ type, logs, loading, pagination, onPageChange, onPageSizeChange }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const currentPage = pagination?.page ?? 1;
  const pageSize = pagination?.limit ?? 10;
  const totalItems = pagination?.total ?? 0;

  /**
   * 查看详情
   */
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setDetailsOpen(true);
  };

  /**
   * 获取表头（根据日志类型）
   */
  const getColumns = () => {
    const common = [
      {
        key: 'timestamp',
        label: '时间',
        cellClassName: 'tabular-data',
        render: (value) => formatDateTime(value)
      },
    ];

    const typeColumns = {
      operation: [
        { key: 'user', label: '用户ID' },
        {
          key: 'method',
          label: '方法',
          render: (value) => {
            const colors = {
              GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              POST: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            };
            return (
              <Badge className={colors[value] || ''} variant={colors[value] ? 'outline' : 'neutral'}>
                {value}
              </Badge>
            );
          }
        },
        { key: 'url', label: 'URL' },
        { key: 'ip', label: 'IP地址' },
      ],
      login: [
        { key: 'username', label: '用户名' },
        {
          key: 'action',
          label: '操作',
          render: (value) => value === 'login' ? '登录' : value === 'logout' ? '登出' : value
        },
        {
          key: 'status',
          label: '状态',
          render: (value) => (
            <Badge variant={value === 'success' ? 'success' : 'destructive'}>
              {value === 'success' ? '成功' : '失败'}
            </Badge>
          )
        },
        { key: 'ip', label: 'IP地址' },
        { key: 'message', label: '消息' },
      ],
      system: [
        { key: 'level', label: '级别' },
        { key: 'message', label: '消息' },
      ],
      access: [
        {
          key: 'method',
          label: '方法',
          render: (value) => {
            const colors = {
              GET: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              POST: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
              DELETE: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            };
            return (
              <Badge className={colors[value] || ''} variant={colors[value] ? 'outline' : 'neutral'}>
                {value}
              </Badge>
            );
          }
        },
        { key: 'url', label: 'URL' },
        { key: 'ip', label: 'IP地址' },
      ],
      error: [
        { key: 'level', label: '级别' },
        { key: 'message', label: '错误消息' },
      ],
      database: [
        {
          key: 'type',
          label: '数据库类型',
          render: (value) => {
            const colors = {
              redis: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
              postgresql: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              sensitive_data_access: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
            };
            const label = value === 'redis' ? 'Redis' : value === 'postgresql' ? 'PostgreSQL' : value === 'sensitive_data_access' ? '敏感数据访问' : value;
            return (
              <Badge className={colors[value] || ''} variant={colors[value] ? 'outline' : 'neutral'}>
                {label}
              </Badge>
            );
          }
        },
        {
          key: 'action',
          label: '操作',
          render: (value, record) => {
            // 登录日志的action
            if (record.type === 'login' || value === 'login' || value === 'logout') {
              return value === 'login' ? '登录' : value === 'logout' ? '登出' : value;
            }

            // 数据库日志的action
            if (record.type === 'redis' || record.type === 'postgresql') {
              const labels = {
                set: 'SET',
                get: 'GET',
                del: 'DEL',
                query: 'QUERY',
              };
              return labels[value] || value;
            }

            // 敏感数据访问的action
            const sensitiveLabels = {
              plain_access_granted: '权限授予',
              password_verify_failed: '密码验证失败',
              batch_masking: '批量脱敏',
            };

            return sensitiveLabels[value] || value;
          }
        },
        {
          key: 'details',
          label: '详情',
          render: (value, record) => {
            // 根据类型显示不同的详情
            if (record.type === 'redis') {
              const parts = [];
              if (record.key) parts.push(`Key: ${record.key}`);
              if (record.ttl) parts.push(`TTL: ${record.ttl}s`);
              if (record.user_id) parts.push(`User: ${record.user_id}`);
              return parts.length > 0 ? parts.join(' | ') : '-';
            }

            if (record.type === 'postgresql') {
              const parts = [];
              if (record.timing) parts.push(`耗时: ${record.timing}`);
              return parts.length > 0 ? parts.join(' | ') : '-';
            }

            return '-';
          }
        },
      ],
    };

    return [...common, ...(typeColumns[type] || [])];
  };

  const columns = getColumns();

  return (
    <>
      <DataTable
        variant="workspace"
        density="compact"
        columns={columns}
        data={logs}
        loading={loading}
        emptyText="暂无日志数据"
        pagination={{
          page: currentPage,
          total: totalItems,
          pageSize: pageSize
        }}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        actions={(log) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetails(log)}
            aria-label="查看日志详情"
          >
            <EyeIcon className="w-4 h-4" />
          </Button>
        )}
      />

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto rounded-md bg-muted/30 p-4">
            {/* 基本信息 */}
            {selectedLog && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">类型:</span>
                    <span className="ml-2 font-medium">{selectedLog.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">操作:</span>
                    <span className="ml-2 font-medium">{selectedLog.action}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">时间:</span>
                    <span className="tabular-data ml-2 font-medium">{formatDateTime(selectedLog.timestamp)}</span>
                  </div>
                  {selectedLog.timing && (
                    <div>
                      <span className="text-muted-foreground">耗时:</span>
                      <span className="ml-2 font-medium">{selectedLog.timing}</span>
                    </div>
                  )}
                </div>

                {/* SQL 代码框 */}
                {selectedLog.sql && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">SQL 查询:</div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto border whitespace-pre-wrap break-all">
                      <code>{selectedLog.sql}</code>
                    </pre>
                  </div>
                )}

                {/* Redis Key */}
                {selectedLog.key && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">Redis Key:</div>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto border">
                      <code>{selectedLog.key}</code>
                    </pre>
                  </div>
                )}

                {/* 其他字段 */}
                {Object.keys(selectedLog).length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm font-medium mb-2">完整数据:</div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">
                      {JSON.stringify(selectedLog, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
