'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiBuilderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Key, Play } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import ApiKeysDialog from '@/components/api-builder/api-keys-dialog';
import TestInterfaceDialog from '@/components/api-builder/test-interface-dialog';
import { getFullApiUrl } from '@/lib/utils/api-url';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';
import { useListQuery } from '@/lib/hooks/use-list-query';

// 格式化日期的辅助函数
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('zh-CN');
  } catch (error) {
    return dateString; // 如果格式化失败，直接返回原值
  }
};

export default function ApiBuilderPage() {
  const router = useRouter();
  const [interfaces, setInterfaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { draftFilters: searchValues, setDraftFilters: setSearchValues, appliedFilters, pagination, setPagination, submit: handleSearch, reset: handleReset, setTotal } = useListQuery();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [interfaceToDelete, setInterfaceToDelete] = useState(null);
  const [keysDialogOpen, setKeysDialogOpen] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState(null);

  // 获取接口列表
  const fetchInterfaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiBuilderApi.getInterfaces({
        page: pagination.page,
        limit: pagination.pageSize,
        search: appliedFilters.keyword || '',
        status: appliedFilters.status || undefined,
      });

      setInterfaces(response.data?.items || []);
      setTotal(response.data?.pagination?.total || 0);
    } catch (error) {
      console.error('获取接口列表失败:', error);
      toast.error('获取接口列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters.keyword, appliedFilters.status, pagination.page, pagination.pageSize, setTotal]);

  useEffect(() => {
    fetchInterfaces();
  }, [fetchInterfaces]);

  const handleCreate = () => {
    router.push('/setting/api-builder/edit/new');
  };

  const handleEdit = (id) => {
    router.push(`/setting/api-builder/edit/${id}`);
  };

  const handleDelete = (interface_) => {
    setInterfaceToDelete(interface_);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!interfaceToDelete) return;

    try {
      await apiBuilderApi.deleteInterface(interfaceToDelete.id);
      toast.success('接口已删除');
      setConfirmDialogOpen(false);
      fetchInterfaces();
    } catch (error) {
      console.error('删除接口失败:', error);
      toast.error('删除接口失败');
    }
  };

  const handleManageKeys = (interface_) => {
    setSelectedInterface(interface_);
    setKeysDialogOpen(true);
  };

  const handleTest = (interface_) => {
    setSelectedInterface(interface_);
    setTestDialogOpen(true);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await apiBuilderApi.updateInterface(id, { status: newStatus });
      toast.success('状态已更新');
      fetchInterfaces();
    } catch (error) {
      console.error('更新状态失败:', error);
      toast.error('更新状态失败');
    }
  };

  const getStatusBadge = (status) => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? '启用' : '禁用'}
      </Badge>
    );
  };

  const getMethodBadge = (method) => {
    const colors = {
      GET: 'bg-muted text-foreground',
      POST: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
      PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
      DELETE: 'bg-destructive/10 text-destructive',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[method] || colors.GET}`}>
        {method}
      </span>
    );
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索接口名称、端点...'
    },
    {
      type: 'select',
      name: 'status',
      placeholder: '选择状态',
      options: [
        { value: '', label: '全部状态' },
        { value: 'active', label: '启用' },
        { value: 'inactive', label: '禁用' }
      ]
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'name',
      label: '接口名称',
      cellClassName: 'font-medium'
    },
    {
      key: 'endpoint',
      label: '端点',
      cellClassName: 'font-mono text-sm',
      render: (value) => getFullApiUrl(value)
    },
    {
      key: 'version',
      label: '版本',
      render: (value) => `V${value}`
    },
    {
      key: 'method',
      label: '请求方式',
      render: (value) => getMethodBadge(value)
    },
    {
      key: 'status',
      label: '状态',
      render: (value, record) => (
        <button
          onClick={() => handleStatusChange(record.id, value === 'active' ? 'inactive' : 'active')}
          className="cursor-pointer"
        >
          {getStatusBadge(value)}
        </button>
      )
    },
    {
      key: 'createdAt',
      label: '创建时间',
      cellClassName: 'text-sm text-muted-foreground',
      render: (value, record) => formatDate(value || record.created_at)
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="接口开发"
        description="管理通过 SQL 生成的动态 API 接口"
        actions={(
          <>
            <Button onClick={() => router.push('/setting/api-builder/keys')} size="lg" className="sm:w-auto" variant="outline">
              <Key className="h-4 w-4 mr-1" />
              接口密钥
            </Button>
            <Button onClick={handleCreate} size="lg" className="sm:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              新增
            </Button>
          </>
        )}
      />
      <PageWorkspace>
        <PageToolbar>
          {/* 搜索栏 */}
          <SearchFilter
            fields={searchFields}
            values={searchValues}
            onChange={setSearchValues}
            onSearch={handleSearch}
            onReset={handleReset}
          />
        </PageToolbar>

        <PageSurface className="p-0">
        {/* 接口列表 */}
          <DataTable
            columns={columns}
            data={interfaces}
            loading={isLoading}
            pagination={pagination}
            onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            onPageSizeChange={(pageSize) => setPagination((prev) => ({ ...prev, pageSize, page: 1 }))}
            actions={(interface_) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTest(interface_)}
                  title="测试接口"
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManageKeys(interface_)}
                  title="调用说明"
                >
                  <Key className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(interface_.id)}
                  title="编辑接口"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(interface_)}
                  title="删除接口"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
          />
        </PageSurface>
      </PageWorkspace>

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除接口"
        description={
          interfaceToDelete
            ? `确定要删除接口 "${interfaceToDelete.name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />

      {/* API密钥管理对话框 */}
      {selectedInterface && (
        <ApiKeysDialog
          open={keysDialogOpen}
          onOpenChange={setKeysDialogOpen}
          interface_={selectedInterface}
        />
      )}

      {/* 测试接口对话框 */}
      {selectedInterface && (
        <TestInterfaceDialog
          open={testDialogOpen}
          onOpenChange={setTestDialogOpen}
          interface_={selectedInterface}
        />
      )}
    </PageShell>
  );
}
