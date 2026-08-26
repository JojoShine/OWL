'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, Trash2, Send, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NotificationList from '@/components/notification/NotificationList';
import NotificationFilter from '@/components/notification/NotificationFilter';
import SendNotificationDialog from '@/components/notification/SendNotificationDialog';
import BroadcastNotificationDialog from '@/components/notification/BroadcastNotificationDialog';
import { useSocket } from '@/contexts/SocketContext';
import { useAuth } from '@/lib/utils/auth';
import { notificationApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  PageHeader,
  PageShell,
  PageSurface,
  PageToolbar,
  PageWorkspace,
} from '@/components/layout/page-shell';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    readStatus: 'all',
    type: 'all',
  });
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [broadcastDialogOpen, setBroadcastDialogOpen] = useState(false);
  const { on, off } = useSocket();
  const { user: currentUser } = useAuth();
  const latestRequestId = useRef(0);

  // 获取通知列表
  const fetchNotifications = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    try {
      const params = {
        page,
        limit,
      };

      // 添加筛选条件
      if (filters.readStatus !== 'all') {
        params.isRead = filters.readStatus === 'read';
      }

      if (filters.type !== 'all') {
        params.type = filters.type;
      }

      const response = await notificationApi.getNotifications(params);
      if (requestId !== latestRequestId.current) return;
      if (response.success) {
        const data = response.data;
        // 适配后端返回的数据结构：items 或 notifications
        const items = data.items || data.notifications || [];
        const total = data.pagination?.total || data.total || 0;
        setNotifications(items);
        setTotal(total);
      }
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('Failed to fetch notifications:', error);
      toast.error('获取通知失败');
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [page, limit, filters]);

  // 标记为已读
  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      // 更新本地数据
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      toast.success('已标记为已读');
    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('标记失败');
    }
  };

  // 标记所有为已读
  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      // 刷新列表
      fetchNotifications();
      toast.success('已全部标记为已读');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('标记失败');
    }
  };

  // 删除通知
  const handleDelete = async (id) => {
    try {
      await notificationApi.deleteNotification(id);
      if (notifications.length === 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      } else {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success('已删除');
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error('删除失败');
    }
  };

  // 清空已读消息
  const handleClearRead = async () => {
    try {
      await notificationApi.clearReadNotifications();
      // 刷新列表
      fetchNotifications();
      toast.success('已清空已读消息');
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
      toast.error('清空失败');
    }
  };

  // 通知点击处理
  const handleNotificationClick = async (notification) => {
    // 如果未读，标记为已读
    if (!notification.is_read) {
      await handleMarkAsRead(notification.id);
    }

    // 如果有链接，跳转（内部路径自动拼接 basePath）
    if (notification.link) {
      const link = notification.link;
      const isInternal = link.startsWith('/') && !link.startsWith('//');
      window.location.href = isInternal
        ? `${process.env.NEXT_PUBLIC_BASE_PATH || ''}${link}`
        : link;
    }
  };

  // 监听实时通知
  // 模块归属：通知模块 - 通知列表页面
  // 使用场景：实时接收新通知并插入列表顶部
  useEffect(() => {
    const handleNewNotification = (notification) => {
      // 如果当前筛选条件匹配，添加到列表顶部
      const matchesReadStatus = filters.readStatus === 'all' || filters.readStatus === 'unread';
      const matchesType = filters.type === 'all' || filters.type === notification.type;

      if (matchesReadStatus && matchesType) {
        setNotifications((prev) => [notification, ...prev.slice(0, limit - 1)]);
        setTotal((prev) => prev + 1);
      }
    };

    on('notification', handleNewNotification);

    return () => {
      off('notification', handleNewNotification);
    };
  }, [on, off, filters.readStatus, filters.type, limit]);

  // 监听跨组件的已读事件
  useEffect(() => {
    const handleNotificationRead = (event) => {
      const { id } = event.detail;
      // 更新本地通知列表
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    };

    const handleAllRead = () => {
      // 更新所有通知为已读
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    };

    window.addEventListener('notification:read', handleNotificationRead);
    window.addEventListener('notification:readAll', handleAllRead);

    return () => {
      window.removeEventListener('notification:read', handleNotificationRead);
      window.removeEventListener('notification:readAll', handleAllRead);
    };
  }, []);

  // 加载数据
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 处理筛选条件变化
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1); // 重置页码
  };

  const handlePageSizeChange = (pageSize) => {
    setLimit(pageSize);
    setPage(1);
  };

  // 处理发送通知
  const handleSendNotification = async (data) => {
    try {
      await notificationApi.sendNotification(data);
      toast.success('通知发送成功');
      // 刷新通知列表
      fetchNotifications();
    } catch (error) {
      console.error('Failed to send notification:', error);
      toast.error('发送通知失败');
      throw error;
    }
  };

  // 处理广播通知
  const handleBroadcastNotification = async (data) => {
    try {
      await notificationApi.broadcastNotification(data);
      toast.success('广播通知发送成功');
      // 刷新通知列表
      fetchNotifications();
    } catch (error) {
      console.error('Failed to broadcast notification:', error);
      toast.error('广播通知失败');
      throw error;
    }
  };

  // 检查是否为管理员（包括 admin 和 super_admin）
  const isAdmin = currentUser?.roles?.some(role =>
    role.code === 'admin' || role.code === 'super_admin'
  );

  // 调试日志（可以在生产环境中删除）
  useEffect(() => {
    if (currentUser) {
      // console.log('[Notifications] User:', currentUser.username);
      // console.log('[Notifications] Roles:', currentUser.roles?.map(r => r.code));
      // console.log('[Notifications] Is Admin:', isAdmin);
    }
  }, [currentUser, isAdmin]);

  return (
    <PageShell>
      <PageHeader
        title="通知中心"
        description="查看个人通知并执行发送与广播操作。"
        actions={<>
          {isAdmin && (
            <>
              <Button onClick={() => setSendDialogOpen(true)}>
                <Send className="h-4 w-4 mr-2" />
                发送通知
              </Button>
              <Button variant="outline" onClick={() => setBroadcastDialogOpen(true)}>
                <Radio className="h-4 w-4 mr-2" />
                广播通知
              </Button>
            </>
          )}
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <Check className="h-4 w-4 mr-2" />
            全部已读
          </Button>
          <Button variant="outline" onClick={handleClearRead}>
            <Trash2 className="h-4 w-4 mr-2 text-destructive" />
            清空已读
          </Button>
        </>}
      />

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总通知数</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="tabular-data text-2xl font-semibold">{total}</div>
            <p className="text-xs text-muted-foreground">
              当前筛选条件下的通知总数
            </p>
          </CardContent>
        </Card>
      </div>

      <PageWorkspace>
        <PageToolbar>
          <NotificationFilter
            filters={filters}
            onChange={handleFiltersChange}
          />
        </PageToolbar>
        <PageSurface className="p-0">
          <NotificationList
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
            onNotificationClick={handleNotificationClick}
            isLoading={isLoading}
            pagination={{ page, total, pageSize: limit }}
            onPageChange={setPage}
            onPageSizeChange={handlePageSizeChange}
          />
        </PageSurface>
      </PageWorkspace>

      {/* 发送通知对话框 */}
      <SendNotificationDialog
        open={sendDialogOpen}
        onOpenChange={setSendDialogOpen}
        onSuccess={handleSendNotification}
      />

      {/* 广播通知对话框 */}
      <BroadcastNotificationDialog
        open={broadcastDialogOpen}
        onOpenChange={setBroadcastDialogOpen}
        onSuccess={handleBroadcastNotification}
      />
    </PageShell>
  );
}
