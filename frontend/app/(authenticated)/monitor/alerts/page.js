'use client';

import { useState, useEffect } from 'react';
import {
  PlusIcon,
  RefreshCwIcon,
  Edit2Icon,
  TrashIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BellIcon,
  ClockIcon,
} from 'lucide-react';
import { alertApi, emailTemplateApi } from '@/lib/api';
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
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PageHeader, PageShell, PageToolbar } from '@/components/layout/page-shell';

export default function AlertsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rules'); // rules | history

  // 告警规则相关状态
  const [rules, setRules] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  // 删除确认对话框状态
  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    ruleId: null,
  });

  // 告警历史相关状态
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const historyLimit = 10; // 每页10条

  // 统计数据
  const [stats, setStats] = useState(null);

  // 邮件模版相关状态
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [recipientInput, setRecipientInput] = useState('');

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    metric_type: 'system',
    metric_name: 'cpu_usage',
    condition: '>',
    threshold: 80,
    level: 'warning',
    enabled: true,
    alert_enabled: false,
    alert_template_id: '',
    alert_recipients: [],
    alert_interval: 1800,
  });

  // 指标配置（根据类型显示不同的指标选项）
  const metricOptions = {
    system: [
      { value: 'cpu_usage', label: 'CPU使用率 (%)' },
      { value: 'memory_usage', label: '内存使用率 (%)' },
      { value: 'disk_usage', label: '磁盘使用率 (%)' },
    ],
    application: [
      { value: 'response_time', label: '响应时间 (ms)' },
      { value: 'error_rate', label: '错误率 (%)' },
      { value: 'online_users', label: '在线用户数' },
    ],
    database: [
      { value: 'connection_usage', label: '连接池使用率 (%)' },
    ],
    cache: [
      { value: 'hit_rate', label: '缓存命中率 (%)' },
      { value: 'memory_usage', label: '内存使用率 (%)' },
    ],
    api_monitor: [
      { value: 'availability', label: '接口可用率 (%)' },
      { value: 'avg_response_time', label: '平均响应时间 (ms)' },
      { value: 'error_rate', label: '错误率 (%)' },
    ],
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // 监听告警历史页码变化
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyPage]);

  const loadData = async () => {
    if (activeTab === 'rules') {
      await loadRules();
    } else {
      await loadHistory();
    }
    await loadStats();
  };

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await alertApi.getAllRules();
      setRules(response.data.items || []);
    } catch (error) {
      console.error('加载告警规则失败:', error);
      toast.error('加载告警规则失败');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await alertApi.getAlertHistory({
        page: historyPage,
        limit: historyLimit
      });
      setHistory(response.data.items || []);
      setHistoryTotal(response.data.total || 0);
      setHistoryTotalPages(Math.ceil((response.data.total || 0) / historyLimit));
    } catch (error) {
      console.error('加载告警历史失败:', error);
      toast.error('加载告警历史失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await alertApi.getAlertStats();
      setStats(response.data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      const response = await emailTemplateApi.getTemplates();
      if (response?.success) {
        const templates = response?.data?.items || [];
        setEmailTemplates(templates);
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  };

  const handleAdd = async () => {
    setEditingRule(null);
    setFormData({
      name: '',
      metric_type: 'system',
      metric_name: 'cpu_usage',
      condition: '>',
      threshold: 80,
      level: 'warning',
      enabled: true,
      alert_enabled: false,
      alert_template_id: '',
      alert_recipients: [],
      alert_interval: 1800,
    });
    setRecipientInput('');
    await loadEmailTemplates();
    setFormOpen(true);
  };

  const handleEdit = async (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      metric_type: rule.metric_type,
      metric_name: rule.metric_name,
      condition: rule.condition,
      threshold: rule.threshold,
      level: rule.level,
      enabled: rule.enabled,
      alert_enabled: rule.alert_enabled || false,
      alert_template_id: rule.alert_template_id || '',
      alert_recipients: rule.alert_recipients || [],
      alert_interval: rule.alert_interval || 1800,
    });
    setRecipientInput('');
    await loadEmailTemplates();
    setFormOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        toast.error('请输入规则名称');
        return;
      }

      // 验证告警配置
      if (formData.alert_enabled) {
        if (!formData.alert_template_id) {
          toast.error('请选择告警邮件模版');
          return;
        }
        if (!formData.alert_recipients || formData.alert_recipients.length === 0) {
          toast.error('请添加至少一个告警接收人');
          return;
        }
      }

      if (editingRule) {
        await alertApi.updateRule(editingRule.id, formData);
        toast.success('更新告警规则成功');
      } else {
        await alertApi.createRule(formData);
        toast.success('创建告警规则成功');
      }

      setFormOpen(false);
      loadRules();
    } catch (error) {
      console.error('保存告警规则失败:', error);
      toast.error(editingRule ? '更新告警规则失败' : '创建告警规则失败');
    }
  };

  const handleDelete = (id) => {
    setDeleteDialog({
      open: true,
      ruleId: id,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      await alertApi.deleteRule(deleteDialog.ruleId);
      toast.success('删除成功');
      setDeleteDialog({ open: false, ruleId: null });
      loadRules();
    } catch (error) {
      console.error('删除告警规则失败:', error);
      toast.error('删除失败');
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertApi.resolveAlert(id);
      toast.success('已标记为已解决');
      loadHistory();
    } catch (error) {
      console.error('解决告警失败:', error);
      toast.error('解决告警失败');
    }
  };

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

  const handleRemoveRecipient = (email) => {
    setFormData((prev) => ({
      ...prev,
      alert_recipients: prev.alert_recipients.filter(item => item !== email),
    }));
  };

  const getLevelBadge = (level) => {
    const config = {
      info: { className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', label: '信息' },
      warning: { className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300', label: '警告' },
      error: { className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', label: '错误' },
      critical: { className: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', label: '严重' },
    };

    const c = config[level] || config.warning;
    return <Badge className={c.className}>{c.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    return status === 'pending' ? (
      <Badge variant="destructive">待处理</Badge>
    ) : (
      <Badge variant="success">已解决</Badge>
    );
  };

  const getMetricTypeLabel = (type) => {
    const labels = {
      system: '系统',
      application: '应用',
      database: '数据库',
      cache: '缓存',
      api_monitor: '接口监控',
    };
    return labels[type] || type;
  };

  // 分页渲染函数
  const renderHistoryPagination = () => {
    if (historyTotalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, historyPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(historyTotalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => setHistoryPage(i)}
            isActive={i === historyPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
              className={historyPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>

          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink onClick={() => setHistoryPage(1)} className="cursor-pointer">
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
            </>
          )}

          {pages}

          {endPage < historyTotalPages && (
            <>
              {endPage < historyTotalPages - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink onClick={() => setHistoryPage(historyTotalPages)} className="cursor-pointer">
                  {historyTotalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationNext
              onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
              className={historyPage === historyTotalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <PageShell>
      <PageHeader
        title="告警监控"
        description="管理告警规则并跟踪告警处理记录。"
        actions={<>
          {activeTab === 'rules' && (
            <Button onClick={handleAdd}>
              <PlusIcon className="w-4 h-4 mr-2" />
              新建规则
            </Button>
          )}
          <Button onClick={loadData} variant="outline">
            <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </>}
      />
      <PageToolbar className="flex flex-wrap items-center gap-4">
        {stats && (
          <>
            <div className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm">
              <BellIcon className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{stats.pending} 待处理</span>
              <span className="text-muted-foreground">/ {stats.total} 总计</span>
            </div>

            {/* 告警检查频率提示 */}
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <ClockIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                告警检查频率：每 1 分钟
              </span>
            </div>
          </>
        )}
      </PageToolbar>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">
            <AlertTriangleIcon className="w-4 h-4 mr-2" />
            告警规则
          </TabsTrigger>
          <TabsTrigger value="history">
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            告警历史
          </TabsTrigger>
        </TabsList>

        {/* 告警规则 */}
        <TabsContent value="rules" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>规则列表</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && rules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
              ) : rules.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  暂无告警规则，点击&ldquo;新建规则&rdquo;创建第一个规则
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>规则名称</TableHead>
                      <TableHead>监控类型</TableHead>
                      <TableHead>监控指标</TableHead>
                      <TableHead>条件</TableHead>
                      <TableHead>级别</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{getMetricTypeLabel(rule.metric_type)}</TableCell>
                        <TableCell>{rule.metric_name}</TableCell>
                        <TableCell>
                          {rule.condition} {rule.threshold}
                        </TableCell>
                        <TableCell>{getLevelBadge(rule.level)}</TableCell>
                        <TableCell>
                          {rule.enabled ? (
                            <Badge variant="success">启用</Badge>
                          ) : (
                            <Badge variant="secondary">禁用</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              onClick={() => handleEdit(rule)}
                              variant="ghost"
                              size="sm"
                              title="编辑"
                            >
                              <Edit2Icon className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => handleDelete(rule.id)}
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* 告警历史 */}
        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>历史记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loading && history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">加载中...</div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无告警历史</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>规则名称</TableHead>
                      <TableHead>告警信息</TableHead>
                      <TableHead>级别</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell className="tabular-data text-sm max-w-xs">
                          {new Date(alert.created_at).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="font-medium">{alert.rule?.name || '-'}</TableCell>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-2" title={alert.message}>
                            {alert.message}
                          </div>
                        </TableCell>
                        <TableCell>{getLevelBadge(alert.level)}</TableCell>
                        <TableCell>{getStatusBadge(alert.status)}</TableCell>
                        <TableCell>
                          {alert.status === 'pending' && (
                            <Button
                              onClick={() => handleResolve(alert.id)}
                              variant="outline"
                              size="sm"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              解决
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* 分页组件 */}
              {!loading && history.length > 0 && (
                <div className="mt-6 flex items-center justify-between">
                  {/* 左侧：数量统计 */}
                  <div className="text-sm text-muted-foreground">
                    显示第 {(historyPage - 1) * historyLimit + 1}-{Math.min(historyPage * historyLimit, historyTotal)} 条，共 {historyTotal} 条
                  </div>

                  {/* 右侧：分页组件 */}
                  <div>
                    {renderHistoryPagination()}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新建/编辑对话框 */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? '编辑告警规则' : '新建告警规则'}
            </DialogTitle>
            <DialogDescription>
              配置监控指标的告警规则
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 规则名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">规则名称 *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例如：CPU使用率过高告警"
              />
            </div>

            {/* 监控类型 */}
            <div className="space-y-2">
              <Label>监控类型</Label>
              <Select
                value={formData.metric_type}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    metric_type: value,
                    metric_name: metricOptions[value][0].value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">系统</SelectItem>
                  <SelectItem value="application">应用</SelectItem>
                  <SelectItem value="database">数据库</SelectItem>
                  <SelectItem value="cache">缓存</SelectItem>
                  <SelectItem value="api_monitor">接口监控</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 监控指标 */}
            <div className="space-y-2">
              <Label>监控指标</Label>
              <Select
                value={formData.metric_name}
                onValueChange={(value) =>
                  setFormData({ ...formData, metric_name: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions[formData.metric_type].map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 告警条件和阈值 */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>条件</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) =>
                    setFormData({ ...formData, condition: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=">">&gt; 大于</SelectItem>
                    <SelectItem value=">=">&gt;= 大于等于</SelectItem>
                    <SelectItem value="<">&lt; 小于</SelectItem>
                    <SelectItem value="<=">&lt;= 小于等于</SelectItem>
                    <SelectItem value="==">== 等于</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">阈值</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={formData.threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      threshold: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* 告警级别 */}
            <div className="space-y-2">
              <Label>告警级别</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">信息</SelectItem>
                  <SelectItem value="warning">警告</SelectItem>
                  <SelectItem value="error">错误</SelectItem>
                  <SelectItem value="critical">严重</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 启用状态 */}
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">启用规则</Label>
              <Switch
                id="enabled"
                checked={formData.enabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enabled: checked })
                }
              />
            </div>

            {/* 告警配置 */}
            <div className="pt-4 border-t space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">邮件告警配置</h3>
                  <p className="text-sm text-muted-foreground">
                    触发告警时发送邮件通知
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
                      告警邮件模版 <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.alert_template_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, alert_template_id: value })
                      }
                    >
                      <SelectTrigger id="alert_template">
                        <SelectValue placeholder="选择邮件模版" />
                      </SelectTrigger>
                      <SelectContent>
                        {emailTemplates.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            暂无可用模版，请先创建邮件模版
                          </div>
                        ) : (
                          emailTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} - {template.subject}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 告警接收人 */}
                  <div className="space-y-2">
                    <Label>
                      告警接收人 <span className="text-red-500">*</span>
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
              {editingRule ? '更新' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, ruleId: null })}
        onConfirm={handleConfirmDelete}
        title="删除告警规则"
        description="确定要删除这个告警规则吗？删除后无法恢复。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
