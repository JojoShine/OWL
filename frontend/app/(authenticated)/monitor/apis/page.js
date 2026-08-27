'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  PlusIcon,
  PlayIcon,
  Edit2Icon,
  TrashIcon,
  FileTextIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from 'lucide-react';
import { apiMonitorApi, emailTemplateApi } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';
import { Pagination } from '@/components/ui/pagination';

export default function ApiMonitorPage() {
  const [loading, setLoading] = useState(false);
  const [monitors, setMonitors] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // 对话框状态
  const [formOpen, setFormOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [selectedMonitor, setSelectedMonitor] = useState(null);

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    monitorId: null,
  });

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'GET',
    headers: '{}',
    body: '',
    interval: 60,
    timeout: 30,
    expect_status: 200,
    expect_response: '',
    enabled: true,
    alert_enabled: false,
    alert_template_id: '',
    alert_recipients: [],
    alert_interval: 1800, // 默认30分钟
  });

  // 邮件模版列表
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [recipientInput, setRecipientInput] = useState('');

  // 日志数据
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [logsPage, setLogsPage] = useState(1);
  const [logsLimit] = useState(10);
  const [logsTotal, setLogsTotal] = useState(0);

  const parseRecipients = (value) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean);
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean);
        }
      } catch (err) {
        // ignore JSON parse errors, fall back to delimiter split
      }

      return trimmed
        .split(/[;,\s]+/)
        .map(item => item.trim())
        .filter(Boolean);
    }

    return [];
  };

  /**
   * 加载监控列表
   */
  const loadMonitors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiMonitorApi.getAllMonitors({ page, limit });
      setMonitors(response.data.items || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to load monitors:', error);
      toast.error('加载监控列表失败');
    } finally {
      setLoading(false);
    }
  }, [limit, page]);

  useEffect(() => {
    loadMonitors();
  }, [loadMonitors]);

  /**
   * 加载接口监控告警类型的邮件模版
   */
  const loadEmailTemplates = async () => {
    try {
      const response = await emailTemplateApi.getTemplates();
      if (response?.success) {
        const templates = response?.data?.items || [];
        setEmailTemplates(templates);
        return templates;
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
    return [];
  };

  /**
   * 处理模版选择
   */
  const handleTemplateSelect = (templateId) => {
    setFormData((prev) => ({
      ...prev,
      alert_template_id: templateId || '',
    }));
  };

  /**
   * 打开添加对话框
   */
  const handleAdd = async () => {
    setEditingMonitor(null);
    setFormData({
      name: '',
      url: '',
      method: 'GET',
      headers: '{}',
      body: '',
      interval: 60,
      timeout: 30,
      expect_status: 200,
      expect_response: '',
      enabled: true,
      alert_enabled: false,
      alert_template_id: '',
      alert_recipients: [],
      alert_interval: 1800, // 默认30分钟
    });
    setRecipientInput('');
    await loadEmailTemplates();
    setFormOpen(true);
  };

  /**
   * 打开编辑对话框
   */
  const handleEdit = async (monitor) => {
    setEditingMonitor(monitor);
    setRecipientInput('');

    try {
      const detailResponse = await apiMonitorApi.getMonitorById(monitor.id);
      await loadEmailTemplates();

      const detail = detailResponse?.data || {};
      const normalizedRecipients = parseRecipients(detail.alert_recipients);

      setFormData({
        name: detail.name || monitor.name,
        url: detail.url || monitor.url,
        method: detail.method || monitor.method,
        headers: JSON.stringify(detail.headers || {}, null, 2),
        body: detail.body || '',
        interval: detail.interval || monitor.interval,
        timeout: detail.timeout || monitor.timeout,
        expect_status: detail.expect_status ?? monitor.expect_status,
        expect_response: detail.expect_response || '',
        enabled: detail.enabled ?? monitor.enabled,
        alert_enabled: Boolean(detail.alert_enabled),
        alert_template_id: detail.alert_template_id || '',
        alert_recipients: normalizedRecipients,
        alert_interval: detail.alert_interval || monitor.alert_interval || 1800,
      });
    } catch (error) {
      console.error('Failed to load monitor detail:', error);
      toast.error('加载监控详情失败，请稍后重试');

      setFormData({
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
        headers: JSON.stringify(monitor.headers || {}, null, 2),
        body: monitor.body || '',
        interval: monitor.interval,
        timeout: monitor.timeout,
        expect_status: monitor.expect_status,
        expect_response: monitor.expect_response || '',
        enabled: monitor.enabled,
        alert_enabled: monitor.alert_enabled || false,
        alert_template_id: monitor.alert_template_id || '',
        alert_recipients: parseRecipients(monitor.alert_recipients),
        alert_interval: monitor.alert_interval || 1800,
      });
      await loadEmailTemplates();
    }

    setFormOpen(true);
  };

  /**
   * 添加告警接收人
   */
  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('请输入有效的邮箱地址');
      return;
    }

    setFormData((prev) => {
      if (prev.alert_recipients.includes(email)) {
        toast.error('该邮箱已添加');
        return prev;
      }

      return {
        ...prev,
        alert_recipients: [...prev.alert_recipients, email],
      };
    });
    setRecipientInput('');
  };

  /**
   * 删除告警接收人
   */
  const handleRemoveRecipient = (email) => {
    setFormData((prev) => ({
      ...prev,
      alert_recipients: prev.alert_recipients.filter(item => item !== email),
    }));
  };

  /**
   * 提交表单
   */
  const handleSubmit = async () => {
    try {
      // 验证 URL
      if (!formData.url) {
        toast.error('请输入接口 URL');
        return;
      }

      // 解析 headers
      let headers = {};
      try {
        headers = JSON.parse(formData.headers);
      } catch (e) {
        toast.error('Headers 格式错误，请输入有效的 JSON');
        return;
      }

      // 验证告警配置
      if (formData.alert_enabled) {
        if (!formData.alert_template_id) {
          toast.error('请选择告警邮件模版');
          return;
        }
      }

      const cleanedRecipients = (formData.alert_recipients || [])
        .map((email) => email.trim())
        .filter((email, index, array) => email && array.indexOf(email) === index);

      const data = {
        ...formData,
        headers,
        alert_recipients: cleanedRecipients,
      };

      if (editingMonitor) {
        await apiMonitorApi.updateMonitor(editingMonitor.id, data);
        toast.success('更新监控配置成功');
      } else {
        await apiMonitorApi.createMonitor(data);
        toast.success('创建监控配置成功');
      }

      setFormOpen(false);
      loadMonitors();
    } catch (error) {
      console.error('Failed to save monitor:', error);
      toast.error(editingMonitor ? '更新监控配置失败' : '创建监控配置失败');
    }
  };

  /**
   * 删除监控
   */
  const handleDelete = (id) => {
    setDeleteDialog({
      open: true,
      monitorId: id,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await apiMonitorApi.deleteMonitor(deleteDialog.monitorId);
      toast.success('删除成功');
      setDeleteDialog({ open: false, monitorId: null });
      loadMonitors();
    } catch (error) {
      console.error('Failed to delete monitor:', error);
      toast.error('删除失败');
    }
  };

  /**
   * 立即测试
   */
  const handleTest = async (id) => {
    try {
      toast.info('正在测试接口...');
      const response = await apiMonitorApi.testApi(id);
      const log = response.data;

      if (log.status === 'success') {
        toast.success(`测试成功！响应时间: ${log.response_time}ms`);
      } else if (log.status === 'timeout') {
        toast.error('测试失败：请求超时');
      } else {
        toast.error(`测试失败：${log.error_message}`);
      }

      loadMonitors();
    } catch (error) {
      console.error('Failed to test API:', error);
      toast.error('测试失败');
    }
  };

  /**
   * 加载日志
   */
  const loadLogs = async (monitorId, page = 1) => {
    try {
      const logsResponse = await apiMonitorApi.getMonitorLogs(monitorId, {
        page,
        limit: logsLimit,
      });

      setLogs(logsResponse.data.items || []);
      setLogsTotal(logsResponse.data.total || 0);
      setLogsPage(page);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('加载日志失败');
    }
  };

  /**
   * 查看日志
   */
  const handleViewLogs = async (monitor) => {
    try {
      setSelectedMonitor(monitor);
      setLogsOpen(true);
      setLogsPage(1);

      // 加载日志和统计信息
      const statsResponse = await apiMonitorApi.getMonitorStats(monitor.id, { hours: 24 });
      setStats(statsResponse.data);

      // 加载第一页日志
      await loadLogs(monitor.id, 1);
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('加载日志失败');
    }
  };

  /**
   * 格式化日期时间
   */
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);

      // 检查日期是否有效
      if (isNaN(date.getTime())) return '-';

      // 格式化为：2025-10-20 14:30:45
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '-';
    }
  };

  /**
   * 获取状态徽章
   */
  const getStatusBadge = (status) => {
    const statusConfig = {
      success: { label: '成功', variant: 'success' },
      failed: { label: '失败', variant: 'destructive' },
      timeout: { label: '超时', variant: 'warning' },
    };

    const config = statusConfig[status] || { label: '未知', variant: 'neutral' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * 获取状态图标
   */
  const getStatusIcon = (status) => {
    if (status === 'success') {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    } else if (status === 'timeout') {
      return <ClockIcon className="h-4 w-4 text-yellow-500" />;
    } else {
      return <XCircleIcon className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="API 监控"
        description="管理接口可用性检查并查看响应性能。"
        actions={<>
          <Button onClick={loadMonitors} variant="outline" disabled={loading}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={handleAdd}>
            <PlusIcon className="h-4 w-4 mr-2" />
            添加监控
          </Button>
        </>}
      />

      {/* 监控列表 */}
      <PageSurface className="p-0">
        <div>
          {loading && monitors.length === 0 ? (
            <Loading size="md" text="正在加载监控配置..." className="py-12" />
          ) : monitors.length === 0 ? (
            <EmptyState title="暂无监控配置" description="点击“添加监控”创建第一个监控" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>方法</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最近检测</TableHead>
                  <TableHead>响应时间</TableHead>
                  <TableHead>间隔</TableHead>
                  <TableHead>启用</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => (
                  <TableRow key={monitor.id}>
                    <TableCell className="font-medium">{monitor.name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={monitor.url}>
                      {monitor.url}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{monitor.method}</Badge>
                    </TableCell>
                    <TableCell>
                      {monitor.lastLog ? (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(monitor.lastLog.status)}
                          {getStatusBadge(monitor.lastLog.status)}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">未检测</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {monitor.lastLog ? (
                        <span className="tabular-data text-sm">
                          {formatDateTime(monitor.lastLog.createdAt)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {monitor.lastLog?.response_time ? (
                        <span className="tabular-data text-sm">{monitor.lastLog.response_time} ms</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-data">{monitor.interval}s</TableCell>
                    <TableCell>
                      {monitor.enabled ? (
                        <Badge variant="success">启用</Badge>
                      ) : (
                        <Badge variant="secondary">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          onClick={() => handleTest(monitor.id)}
                          variant="ghost"
                          size="sm"
                          title="立即测试"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleViewLogs(monitor)}
                          variant="ghost"
                          size="sm"
                          title="查看日志"
                        >
                          <FileTextIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleEdit(monitor)}
                          variant="ghost"
                          size="sm"
                          title="编辑"
                        >
                          <Edit2Icon className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(monitor.id)}
                          variant="ghost"
                          size="sm"
                          title="删除"
                        >
                          <TrashIcon className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {total > 0 && (
            <Pagination page={page} total={total} pageSize={limit} onPageChange={setPage} />
          )}
        </div>
      </PageSurface>

      {/* 添加/编辑对话框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMonitor ? '编辑监控配置' : '添加监控配置'}
            </DialogTitle>
            <DialogDescription>
              配置 API 接口监控，系统将定期检测接口的可用性和性能
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 基础配置 */}
            <div className="space-y-2">
              <Label htmlFor="name">监控名称<span className="ml-1 text-destructive">*</span></Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：用户服务健康检查"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">接口 URL<span className="ml-1 text-destructive">*</span></Label>
              <Input
                id="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://api.example.com/health"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="method">请求方法</Label>
                <Select
                  value={formData.method}
                  onValueChange={(value) => setFormData({ ...formData, method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interval">检测间隔（秒）</Label>
                <Input
                  id="interval"
                  type="number"
                  value={formData.interval}
                  onChange={(e) =>
                    setFormData({ ...formData, interval: parseInt(e.target.value) })
                  }
                  min="10"
                />
              </div>
            </div>

            {/* 请求配置 */}
            <div className="space-y-2">
              <Label htmlFor="headers">请求头（JSON 格式）</Label>
              <Textarea
                id="headers"
                value={formData.headers}
                onChange={(e) => setFormData({ ...formData, headers: e.target.value })}
                placeholder='{"Authorization": "Bearer token"}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
              <div className="space-y-2">
                <Label htmlFor="body">请求体</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* 验证配置 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="expect_status">期望状态码</Label>
                <Input
                  id="expect_status"
                  type="number"
                  value={formData.expect_status}
                  onChange={(e) =>
                    setFormData({ ...formData, expect_status: parseInt(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">超时时间（秒）</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={formData.timeout}
                  onChange={(e) =>
                    setFormData({ ...formData, timeout: parseInt(e.target.value) })
                  }
                  min="5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expect_response">期望响应内容（可选）</Label>
              <Input
                id="expect_response"
                value={formData.expect_response}
                onChange={(e) =>
                  setFormData({ ...formData, expect_response: e.target.value })
                }
                placeholder="响应中应包含的字符串"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
              <Label htmlFor="enabled">启用监控</Label>
            </div>

            {/* 告警配置 */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">告警配置</h3>
                  <p className="text-sm text-muted-foreground">
                    监控失败时发送邮件告警
                  </p>
                </div>
                <Switch
                  id="alert_enabled"
                  checked={formData.alert_enabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, alert_enabled: checked })
                  }
                />
              </div>

              {formData.alert_enabled && (
                <div className="space-y-4 pl-4 border-l-2">
                  {/* 邮件模版选择 */}
                  <div className="space-y-2">
                    <Label htmlFor="alert_template">
                      告警邮件模版 <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.alert_template_id}
                      onValueChange={handleTemplateSelect}
                    >
                      <SelectTrigger id="alert_template">
                        <SelectValue placeholder="选择邮件模版" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.length === 0 ? (
                          <EmptyState title="暂无可用模版" description="请先创建接口监控告警类型的模版" compact />
                        ) : (
                          emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} - {template.subject}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  <p className="text-xs text-muted-foreground">
                    模版将展示全部可用项，模板内请使用 {'{{'}title{'}}'} 和 {'{{'}content{'}}'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    系统会自动生成标题（示例：{'【接口告警】' + (formData.name || '监控名称')}）并填充异常详情作为内容
                  </p>
                </div>

                  {/* 告警接收人 */}
                  <div className="space-y-2">
                    <Label>
                      告警接收人 <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={recipientInput}
                        onChange={(e) => setRecipientInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRecipient();
                          }
                        }}
                        placeholder="输入邮箱地址，按回车添加"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddRecipient}
                      >
                        添加
                      </Button>
                    </div>

                    {/* 接收人列表 */}
                    {formData.alert_recipients.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.alert_recipients.map((email) => (
                          <Badge key={email} variant="secondary">
                            {email}
                            <button
                              type="button"
                              onClick={() => handleRemoveRecipient(email)}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 告警间隔 */}
                  <div className="space-y-2">
                    <Label htmlFor="alert_interval">
                      告警间隔（秒）
                    </Label>
                    <Input
                      id="alert_interval"
                      type="number"
                      value={formData.alert_interval}
                      onChange={(e) =>
                        setFormData({ ...formData, alert_interval: parseInt(e.target.value) || 1800 })
                      }
                      min="60"
                      max="86400"
                    />
                    <p className="text-xs text-muted-foreground">
                      持续异常时的告警发送间隔，最小60秒（1分钟），最大86400秒（24小时），默认1800秒（30分钟）
                    </p>
                  </div>

                </div>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit}>
              {editingMonitor ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 日志查看对话框 */}
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>监控日志 - {selectedMonitor?.name}</DialogTitle>
            <DialogDescription>{selectedMonitor?.url}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1">
            {/* 统计信息 */}
            {stats && (
              <div className="flex flex-wrap gap-4">
                <Card className="min-w-[140px]">
                  <CardContent className="pt-3 pb-3 px-4 text-center">
                    <div className="text-xs text-muted-foreground">总请求</div>
                    <div className="text-xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[140px]">
                  <CardContent className="pt-3 pb-3 px-4 text-center">
                    <div className="text-xs text-muted-foreground">成功</div>
                    <div className="text-xl font-bold text-green-600">{stats.success}</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[140px]">
                  <CardContent className="pt-3 pb-3 px-4 text-center">
                    <div className="text-xs text-muted-foreground">失败</div>
                    <div className="text-xl font-bold text-red-600">{stats.failed}</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[140px]">
                  <CardContent className="pt-3 pb-3 px-4 text-center">
                    <div className="text-xs text-muted-foreground">可用率</div>
                    <div className="text-xl font-bold">{stats.availability}%</div>
                  </CardContent>
                </Card>
                <Card className="min-w-[140px]">
                  <CardContent className="pt-3 pb-3 px-4 text-center">
                    <div className="text-xs text-muted-foreground">平均响应</div>
                    <div className="text-xl font-bold">{stats.avgResponseTime}ms</div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* 日志列表 */}
            <div className="border rounded-lg overflow-hidden flex-shrink-0">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>状态码</TableHead>
                    <TableHead>响应时间</TableHead>
                    <TableHead>错误信息</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        <EmptyState title="暂无日志记录" compact />
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {formatDateTime(log.createdAt)}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>{log.status_code || '-'}</TableCell>
                        <TableCell>{log.response_time}ms</TableCell>
                        <TableCell className="max-w-xs truncate" title={log.error_message}>
                          {log.error_message || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>

            {/* 分页控制 */}
            {logsTotal > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  共 {logsTotal} 条
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(selectedMonitor.id, logsPage - 1)}
                    disabled={logsPage === 1}
                  >
                    上一页
                  </Button>
                  <span className="text-sm">
                    第 {logsPage} / {Math.ceil(logsTotal / logsLimit)} 页
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadLogs(selectedMonitor.id, logsPage + 1)}
                    disabled={logsPage >= Math.ceil(logsTotal / logsLimit)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setLogsOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, monitorId: null })}
        onConfirm={handleConfirmDelete}
        title="删除监控配置"
        description="确定要删除这个监控配置吗？删除后无法恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
