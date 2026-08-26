'use client';

import React from 'react';
import { Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/common/DataTable';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

// 通知类型配置
const notificationTypeConfig = {
  info: {
    variant: 'info',
    label: '信息',
  },
  system: {
    variant: 'neutral',
    label: '系统',
  },
  warning: {
    variant: 'warning',
    label: '警告',
  },
  error: {
    variant: 'destructive',
    label: '错误',
  },
  success: {
    variant: 'success',
    label: '成功',
  },
};

export default function NotificationList({
  notifications = [],
  onMarkAsRead,
  onDelete,
  onNotificationClick,
  isLoading = false,
  pagination,
  onPageChange,
  onPageSizeChange,
}) {
  const handleNotificationClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const columns = [
    {
      key: 'type',
      label: '类型',
      width: '120px',
      render: (value, notification) => {
        const typeConfig = notificationTypeConfig[value] || notificationTypeConfig.info;
        return (
          <div className="flex items-center gap-2">
            <Badge variant={typeConfig.variant} className="text-xs">
              {typeConfig.label}
            </Badge>
            {!notification.is_read && (
              <span className="h-2 w-2 rounded-full bg-primary" title="未读" />
            )}
          </div>
        );
      },
    },
    {
      key: 'title',
      label: '标题',
      width: '200px',
      render: (value, notification) => (
        <span className={notification.is_read ? 'text-muted-foreground' : 'font-medium'}>
          {value}
        </span>
      ),
    },
    {
      key: 'content',
      label: '内容',
      render: (value) => (
        <p className="max-w-xl whitespace-normal text-sm text-muted-foreground line-clamp-2">
          {value}
        </p>
      ),
    },
    {
      key: 'created_at',
      label: '时间',
      width: '150px',
      numeric: true,
      cellClassName: 'text-sm text-muted-foreground',
      render: (value) => value ? formatDistanceToNow(new Date(value), {
        addSuffix: true,
        locale: zhCN,
      }) : '-',
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={notifications}
      loading={isLoading}
      emptyText="暂无通知"
      pagination={pagination}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      actionsLabel="操作"
      actions={(notification) => (
        <>
          {notification.link && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleNotificationClick(notification)}
              title="查看详情"
              aria-label={`查看通知 ${notification.title}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
          {!notification.is_read && onMarkAsRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              title="标记为已读"
              aria-label={`标记通知 ${notification.title} 为已读`}
            >
              <Check className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              title="删除"
              aria-label={`删除通知 ${notification.title}`}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </>
      )}
    />
  );
}
