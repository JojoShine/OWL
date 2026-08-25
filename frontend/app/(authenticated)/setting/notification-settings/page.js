'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Mail, Save, RotateCcw, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { notificationSettingsApi, monitorApi } from '@/lib/api';
import { toast } from 'sonner';
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState({
    email_enabled: true,
    push_enabled: true,
    system_notification: true,
    warning_notification: true,
    error_notification: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);

  // 获取设置
  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await notificationSettingsApi.getSettings();
      // http-client 拦截器已解包 response.data
      if (response?.success) {
        setSettings(response.data || {});
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      toast.error('获取设置失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 更新设置
  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  // 保存设置
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await notificationSettingsApi.updateSettings(settings);
      toast.success('设置已保存');
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 重置设置
  const handleReset = async () => {
    try {
      const response = await notificationSettingsApi.resetSettings();
      // http-client 拦截器已解包 response.data
      if (response?.success) {
        setSettings(response.data || {});
        setHasChanges(false);
        toast.success('设置已重置为默认值');
      }
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('重置失败');
    }
  };

  // 获取系统状态
  const fetchSystemStatus = useCallback(async () => {
    try {
      const response = await monitorApi.getSystemStatus();
      if (response?.data) {
        setSystemStatus(response.data);
      }
    } catch (error) {
      console.error('获取系统状态失败:', error);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchSettings();
    fetchSystemStatus();
  }, [fetchSettings, fetchSystemStatus]);

  if (isLoading) {
    return (
      <PageShell>
        <PageHeader
          title="通知设置"
          description="选择通知渠道与需要接收的消息类型。"
        />
        <PageSurface className="space-y-4 p-5">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-48 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </PageSurface>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="通知设置"
        description="选择通知渠道与需要接收的消息类型。"
        actions={(
          <>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isSaving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              重置为默认
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? '保存中...' : '保存更改'}
            </Button>
          </>
        )}
      />

      {/* 通知渠道设置 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知渠道
          </CardTitle>
          <CardDescription>
            选择您希望接收通知的渠道
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 推送通知 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push_enabled" className="text-base">
                站内推送通知
              </Label>
              <p className="text-sm text-muted-foreground">
                在浏览器中接收实时推送通知
              </p>
            </div>
            <Switch
              id="push_enabled"
              checked={settings.push_enabled}
              onCheckedChange={(checked) => handleSettingChange('push_enabled', checked)}
            />
          </div>

          <Separator />

          {/* 邮件通知 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email_enabled" className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  邮件通知
                </Label>
                <p className="text-sm text-muted-foreground">
                  通过电子邮件接收重要通知
                </p>
              </div>
              <Switch
                id="email_enabled"
                checked={settings.email_enabled}
                onCheckedChange={(checked) => handleSettingChange('email_enabled', checked)}
                disabled={!systemStatus?.email?.available}
              />
            </div>

            {/* 邮件服务状态提示 */}
            {systemStatus && !systemStatus.email?.available && (
              <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
                <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                  {systemStatus.email.message}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 通知类型设置 */}
      <Card>
        <CardHeader>
          <CardTitle>通知类型</CardTitle>
          <CardDescription>
            选择您希望接收的通知类型
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 系统通知 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="system_notification" className="text-base">
                系统通知
              </Label>
              <p className="text-sm text-muted-foreground">
                接收系统更新、维护等重要通知
              </p>
            </div>
            <Switch
              id="system_notification"
              checked={settings.system_notification}
              onCheckedChange={(checked) => handleSettingChange('system_notification', checked)}
            />
          </div>

          <Separator />

          {/* 警告通知 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="warning_notification" className="text-base">
                警告通知
              </Label>
              <p className="text-sm text-muted-foreground">
                接收需要注意的警告信息
              </p>
            </div>
            <Switch
              id="warning_notification"
              checked={settings.warning_notification}
              onCheckedChange={(checked) => handleSettingChange('warning_notification', checked)}
            />
          </div>

          <Separator />

          {/* 错误通知 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="error_notification" className="text-base">
                错误通知
              </Label>
              <p className="text-sm text-muted-foreground">
                接收系统错误和故障通知
              </p>
            </div>
            <Switch
              id="error_notification"
              checked={settings.error_notification}
              onCheckedChange={(checked) => handleSettingChange('error_notification', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 帮助说明 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>温馨提示</AlertTitle>
        <AlertDescription className="space-y-2 text-muted-foreground">
          <p>• 站内推送通知会实时显示在页面右上角的通知图标中</p>
          <p>• 邮件通知会发送到您的注册邮箱</p>
          <p>• 关闭某类通知后，您将不会收到该类型的任何通知</p>
          <p>• 建议保持错误通知开启，以便及时了解系统问题</p>
        </AlertDescription>
      </Alert>

      {/* 保存提示 */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-background border shadow-lg rounded-lg p-4 flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            您有未保存的更改
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              保存
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
