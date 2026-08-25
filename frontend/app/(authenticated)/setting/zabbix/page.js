/**
 * Zabbix实例配置页面
 * 模块归属：Zabbix集成模块
 * 使用场景：管理Zabbix实例连接配置，支持测试连接、手动同步、安装引导
 */
'use client';

import { useState, useEffect } from 'react';
import { zabbixApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Edit, Trash2, RefreshCw, TestTube, BookOpen,
} from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import ZabbixInstallGuide from '@/components/zabbix/ZabbixInstallGuide';
import { PageHeader, PageShell, PageSurface, PageToolbar } from '@/components/layout/page-shell';

export default function ZabbixPage() {
  const [instances, setInstances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });

  // 弹窗状态
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInstance, setEditingInstance] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState(null);
  const [installGuideOpen, setInstallGuideOpen] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    api_token: '',
    sync_interval: 60,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 获取实例列表
  const fetchInstances = async () => {
    try {
      setIsLoading(true);
      const response = await zabbixApi.getInstances({
        name: searchValues.keyword || '',
        status: searchValues.status === 'all' ? '' : (searchValues.status || ''),
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      const data = response.data?.items || response.data || [];
      setInstances(Array.isArray(data) ? data : []);

      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
      }
    } catch (error) {
      console.error('获取Zabbix实例列表失败:', error);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchInstances(), 0);
  };

  // 重置
  const handleReset = () => {
    setSearchValues({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchInstances(), 0);
  };

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 新增
  const handleAdd = () => {
    setEditingInstance(null);
    setFormData({ name: '', url: '', api_token: '', sync_interval: 60, description: '' });
    setIsFormOpen(true);
  };

  // 编辑
  const handleEdit = (instance) => {
    setEditingInstance(instance);
    setFormData({
      name: instance.name || '',
      url: instance.url || '',
      api_token: '', // 编辑时不显示token
      sync_interval: instance.sync_interval || 60,
      description: instance.description || '',
    });
    setIsFormOpen(true);
  };

  // 删除
  const handleDelete = (instance) => {
    setInstanceToDelete(instance);
    setConfirmDeleteOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!instanceToDelete) return;
    try {
      await zabbixApi.deleteInstance(instanceToDelete.id);
      toast.success('删除实例成功');
      fetchInstances();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setInstanceToDelete(null);
    }
  };

  // 测试连接
  const handleTestConnection = async (instance) => {
    try {
      toast.info('正在测试连接...');
      const response = await zabbixApi.testConnection(instance.id);
      const result = response.data;
      if (result?.success) {
        toast.success(result.message || '连接成功');
      } else {
        toast.error(result?.message || '连接失败');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '测试失败';
      toast.error(errorMessage);
    }
  };

  // 手动同步
  const handleSync = async (instance) => {
    try {
      toast.info('正在同步...');
      await zabbixApi.syncInstance(instance.id);
      toast.success('同步成功');
      fetchInstances();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '同步失败';
      toast.error(errorMessage);
    }
  };

  // 切换状态
  const handleToggleStatus = async (instance) => {
    const newStatus = instance.status === 'active' ? 'inactive' : 'active';
    try {
      await zabbixApi.updateInstance(instance.id, { status: newStatus });
      toast.success(newStatus === 'active' ? '已启用' : '已禁用');
      fetchInstances();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      toast.error(errorMessage);
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (!formData.name || !formData.url || (!editingInstance && !formData.api_token)) {
      toast.error('请填写必填字段');
      return;
    }

    try {
      setIsSubmitting(true);
      const submitData = { ...formData };
      if (editingInstance && !submitData.api_token) {
        delete submitData.api_token; // 编辑时不修改token
      }

      if (editingInstance) {
        await zabbixApi.updateInstance(editingInstance.id, submitData);
        toast.success('更新实例成功');
      } else {
        await zabbixApi.createInstance(submitData);
        toast.success('创建实例成功');
      }

      setIsFormOpen(false);
      fetchInstances();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 状态徽章
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '启用', variant: 'success' },
      inactive: { label: '禁用', variant: 'neutral' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 搜索字段配置
  const searchFields = [
    { type: 'text', name: 'keyword', placeholder: '搜索实例名称...' },
    {
      type: 'select',
      name: 'status',
      placeholder: '选择状态',
      options: [
        { label: '全部状态', value: 'all' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
    },
  ];

  // 表格列配置
  const columns = [
    { key: 'name', label: '实例名称', cellClassName: 'font-medium' },
    {
      key: 'url',
      label: 'URL',
      render: (value) => <code className="text-sm bg-muted px-2 py-0.5 rounded text-xs">{value}</code>,
    },
    { key: 'sync_interval', label: '同步间隔', render: (value) => `${value}秒` },
    { key: 'status', label: '状态', render: (value) => getStatusBadge(value) },
    {
      key: 'last_sync_at',
      label: '最后同步',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '从未同步',
    },
    {
      key: 'description',
      label: '描述',
      cellClassName: 'max-w-xs truncate',
      render: (value) => value || '-',
    },
  ];

  return (
    <PageShell>
      <PageHeader
        title="Zabbix 实例管理"
        description="管理 Zabbix Server 连接配置，支持系统指标和中间件监控。"
        actions={(
          <>
            <Button variant="outline" onClick={() => setInstallGuideOpen(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              安装引导
            </Button>
            <Button onClick={handleAdd} className="sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              添加实例
            </Button>
          </>
        )}
      />
      <PageToolbar>
        <SearchFilter
          variant="toolbar"
          fields={searchFields}
          values={searchValues}
          onChange={setSearchValues}
          onSearch={handleSearch}
          onReset={handleReset}
        />
      </PageToolbar>

      <PageSurface className="p-5">
        <DataTable
          variant="workspace"
          density="compact"
          columns={columns}
          data={instances}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions={(row) => (
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleTestConnection(row)}
                aria-label={`测试 ${row.name} 连接`}
                title="测试连接"
              >
                <TestTube className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleSync(row)}
                aria-label={`同步 ${row.name}`}
                title="手动同步"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Switch
                checked={row.status === 'active'}
                onCheckedChange={() => handleToggleStatus(row)}
                aria-label={`切换 ${row.name} 状态`}
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(row)}
                aria-label={`编辑 ${row.name}`}
                title="编辑"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(row)}
                aria-label={`删除 ${row.name}`}
                title="删除"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      </PageSurface>

      {/* 新增/编辑弹窗 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingInstance ? '编辑实例' : '添加实例'}</DialogTitle>
            <DialogDescription>
              {editingInstance ? '修改 Zabbix 实例连接配置' : '添加新的 Zabbix Server 连接配置'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                实例名称 <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：生产环境 Zabbix"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Zabbix URL <span className="text-red-500">*</span>
              </Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                placeholder="http://192.168.1.100:8080"
              />
            </div>

            <div className="space-y-2">
              <Label>
                API Token {!editingInstance && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="password"
                value={formData.api_token}
                onChange={(e) => setFormData(prev => ({ ...prev, api_token: e.target.value }))}
                placeholder={editingInstance ? '留空则不修改' : 'Zabbix API Token'}
              />
              {editingInstance && (
                <p className="text-xs text-muted-foreground">留空表示不修改 Token</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>同步间隔（秒）</Label>
              <Input
                type="number"
                value={formData.sync_interval}
                onChange={(e) => setFormData(prev => ({ ...prev, sync_interval: parseInt(e.target.value) || 60 }))}
                min={10}
                max={3600}
              />
            </div>

            <div className="space-y-2">
              <Label>描述</Label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="实例描述信息"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除实例"
        description={
          instanceToDelete
            ? `确定要删除实例 "${instanceToDelete.name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />

      {/* 安装引导弹窗 */}
      <ZabbixInstallGuide open={installGuideOpen} onOpenChange={setInstallGuideOpen} />
    </PageShell>
  );
}
