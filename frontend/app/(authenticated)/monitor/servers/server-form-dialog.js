'use client';

import { useState, useEffect } from 'react';
import { serverMonitorApi, emailTemplateApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ServerFormDialog({ open, onOpenChange, server, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    ip_address: '',
    port: 22,
    username: '',
    password: '',
    private_key: '',
    auth_type: 'password',
    interval: 60,
    timeout: 30,
    cpu_threshold: 90,
    memory_threshold: 90,
    disk_threshold: 90,
    enabled: true,
    alert_enabled: false,
    alert_template_id: null,
    alert_recipients: [],
  });

  // 获取邮件模板列表
  const fetchEmailTemplates = async () => {
    try {
      const response = await emailTemplateApi.getTemplates({ limit: 100 });
      setEmailTemplates(response.data?.items || response.data || []);
    } catch (error) {
      console.error('获取邮件模板失败:', error);
    }
  };

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      fetchEmailTemplates();
    }

    if (server) {
      setFormData({
        name: server.name || '',
        ip_address: server.ip_address || '',
        port: server.port || 22,
        username: server.username || '',
        password: '',
        private_key: '',
        auth_type: server.auth_type || 'password',
        interval: server.interval || 60,
        timeout: server.timeout || 30,
        cpu_threshold: parseFloat(server.cpu_threshold) || 90,
        memory_threshold: parseFloat(server.memory_threshold) || 90,
        disk_threshold: parseFloat(server.disk_threshold) || 90,
        enabled: server.enabled ?? true,
        alert_enabled: server.alert_enabled ?? false,
        alert_template_id: server.alert_template_id || null,
        alert_recipients: server.alert_recipients || [],
      });
    } else {
      setFormData({
        name: '',
        ip_address: '',
        port: 22,
        username: '',
        password: '',
        private_key: '',
        auth_type: 'password',
        interval: 60,
        timeout: 30,
        cpu_threshold: 90,
        memory_threshold: 90,
        disk_threshold: 90,
        enabled: true,
        alert_enabled: false,
        alert_template_id: null,
        alert_recipients: [],
      });
    }
  }, [server, open]);

  // 保存
  const handleSave = async () => {
    if (!formData.name || !formData.ip_address || !formData.username) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      setLoading(true);
      if (server) {
        await serverMonitorApi.updateServer(server.id, formData);
        toast.success('更新成功');
      } else {
        await serverMonitorApi.createServer(formData);
        toast.success('创建成功');
      }
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('保存失败:', error);
      toast.error(error.response?.data?.message || '保存失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{server ? '编辑服务器' : '添加服务器'}</DialogTitle>
          <DialogDescription>
            配置远程服务器的SSH连接信息和监控参数
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="mt-4">
          <TabsList stretch>
            <TabsTrigger value="basic">基本信息</TabsTrigger>
            <TabsTrigger value="monitoring">监控设置</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">服务器名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：Web服务器01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ip_address">IP地址 *</Label>
                <Input
                  id="ip_address"
                  value={formData.ip_address}
                  onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                  placeholder="192.168.1.100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="port">SSH端口</Label>
                <Input
                  id="port"
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  placeholder="22"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">用户名 *</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="root"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>认证方式</Label>
              <RadioGroup
                value={formData.auth_type}
                onValueChange={(value) => setFormData({ ...formData, auth_type: value })}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="password" id="auth-password" />
                  <Label htmlFor="auth-password" className="cursor-pointer font-normal">密码认证</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="key" id="auth-key" />
                  <Label htmlFor="auth-key" className="cursor-pointer font-normal">密钥认证</Label>
                </div>
              </RadioGroup>
            </div>

            {formData.auth_type === 'password' ? (
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={server ? '输入新密码（留空则不修改）' : '输入SSH密码'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="private_key">私钥内容</Label>
                <Textarea
                  id="private_key"
                  value={formData.private_key}
                  onChange={(e) => setFormData({ ...formData, private_key: e.target.value })}
                  placeholder={server ? '粘贴新私钥（留空则不修改）' : '粘贴SSH私钥内容'}
                  rows={6}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4 mt-4">
            <div className="grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="interval">采集间隔（秒）</Label>
                <Input
                  id="interval"
                  type="number"
                  value={formData.interval}
                  onChange={(e) => setFormData({ ...formData, interval: parseInt(e.target.value) })}
                  min={30}
                  max={3600}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">超时时间（秒）</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) => setFormData({ ...formData, timeout: parseInt(e.target.value) })}
                  min={5}
                  max={120}
                />
              </div>
            </div>

            <div className="grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cpu_threshold">CPU告警阈值%</Label>
                <Input
                  id="cpu_threshold"
                  type="number"
                  value={formData.cpu_threshold}
                  onChange={(e) => setFormData({ ...formData, cpu_threshold: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memory_threshold">内存告警阈值%</Label>
                <Input
                  id="memory_threshold"
                  type="number"
                  value={formData.memory_threshold}
                  onChange={(e) => setFormData({ ...formData, memory_threshold: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disk_threshold">磁盘告警阈值%</Label>
                <Input
                  id="disk_threshold"
                  type="number"
                  value={formData.disk_threshold}
                  onChange={(e) => setFormData({ ...formData, disk_threshold: parseFloat(e.target.value) })}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">启用监控</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="alert_enabled">启用告警通知</Label>
              <Switch
                id="alert_enabled"
                checked={formData.alert_enabled}
                onCheckedChange={(checked) => setFormData({ ...formData, alert_enabled: checked })}
              />
            </div>

            {formData.alert_enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="alert_template_id">告警邮件模板</Label>
                  <Select
                    value={formData.alert_template_id || 'default'}
                    onValueChange={(value) => setFormData({ ...formData, alert_template_id: value === 'default' ? null : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="选择邮件模板" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">使用默认模板</SelectItem>
                      {emailTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    选择告警邮件使用的模板，不选择则使用默认格式
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alert_recipients">告警接收邮箱（逗号分隔）</Label>
                  <Textarea
                    id="alert_recipients"
                    value={Array.isArray(formData.alert_recipients) ? formData.alert_recipients.join(', ') : ''}
                    onChange={(e) => {
                      const emails = e.target.value.split(',').map(email => email.trim()).filter(Boolean);
                      setFormData({ ...formData, alert_recipients: emails });
                    }}
                    placeholder="admin@example.com, ops@example.com"
                    rows={2}
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : server ? '更新' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
