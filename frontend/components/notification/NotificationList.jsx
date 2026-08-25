'use client';

import React from 'react';
import { Bell, Check, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
}) {
  const handleNotificationClick = (notification) => {
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">暂无通知</h3>
        <p className="text-sm text-muted-foreground">
          当有新通知时，会在这里显示
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[120px]">类型</TableHead>
          <TableHead className="w-[200px]">标题</TableHead>
          <TableHead>内容</TableHead>
          <TableHead className="w-[150px]">时间</TableHead>
          <TableHead className="w-[200px] text-right">操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notifications.map((notification) => {
          const typeConfig = notificationTypeConfig[notification.type] || notificationTypeConfig.info;
          const isUnread = !notification.is_read;

          return (
            <TableRow key={notification.id}>
              {/* 类型列 */}
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge variant={typeConfig.variant} className="text-xs">
                    {typeConfig.label}
                  </Badge>
                  {isUnread && (
                    <span className="h-2 w-2 rounded-full bg-primary" title="未读" />
                  )}
                </div>
              </TableCell>

              {/* 标题列 */}
              <TableCell className={isUnread ? 'font-medium' : 'text-muted-foreground'}>
                {notification.title}
              </TableCell>

              {/* 内容列 */}
              <TableCell>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {notification.content}
                </p>
              </TableCell>

              {/* 时间列 */}
              <TableCell className="tabular-data text-sm text-muted-foreground">
                {notification.created_at ? formatDistanceToNow(new Date(notification.created_at), {
                  addSuffix: true,
                  locale: zhCN,
                }) : '-'}
              </TableCell>

              {/* 操作列 */}
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
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

                  {isUnread && onMarkAsRead && (
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
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
