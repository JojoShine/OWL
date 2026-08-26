'use client';

import { useState, useEffect } from 'react';
import { thirdPartyKeysApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, RefreshCw, Power, BookOpen } from 'lucide-react';
import KeyFormDialog from '@/components/third-party-keys/key-form-dialog';
import SecretDisplayDialog from '@/components/third-party-keys/secret-display-dialog';
import SignatureGuideDialog from '@/components/third-party-keys/signature-guide-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

export default function ThirdPartyKeysPage() {
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);
  const [secretDialogOpen, setSecretDialogOpen] = useState(false);
  const [newKeyData, setNewKeyData] = useState(null);
  const [regenerateDialogOpen, setRegenerateDialogOpen] = useState(false);
  const [keyToRegenerate, setKeyToRegenerate] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [keyToChangeStatus, setKeyToChangeStatus] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);

  // 获取密钥列表
  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const response = await thirdPartyKeysApi.getKeys({
        client_name: searchValues.keyword || '',
        status: searchValues.status === 'all' ? '' : (searchValues.status || ''),
        page: pagination.page,
        pageSize: pagination.pageSize
      });

      const keysData = response.data?.items || response.data || [];
      setKeys(Array.isArray(keysData) ? keysData : []);

      // 更新分页信息
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0
        }));
      }
    } catch (error) {
      console.error('获取密钥列表失败:', error);
      setKeys([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchKeys(), 0);
  };

  // 重置
  const handleReset = () => {
    setSearchValues({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchKeys(), 0);
  };

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 新增密钥
  const handleAdd = () => {
    setEditingKey(null);
    setIsDialogOpen(true);
  };

  // 编辑密钥
  const handleEdit = (key) => {
    setEditingKey(key);
    setIsDialogOpen(true);
  };

  // 删除密钥
  const handleDelete = (key) => {
    setKeyToDelete(key);
    setConfirmDialogOpen(true);
  };

  // 确认删除密钥
  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;

    try {
      await thirdPartyKeysApi.deleteKey(keyToDelete.id);
      toast.success('删除密钥成功');
      fetchKeys();
    } catch (error) {
      console.error('删除密钥失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setKeyToDelete(null);
    }
  };

  // 重新生成密钥
  const handleRegenerate = (key) => {
    setKeyToRegenerate(key);
    setRegenerateDialogOpen(true);
  };

  // 确认重新生成密钥
  const handleConfirmRegenerate = async () => {
    if (!keyToRegenerate) return;

    try {
      const response = await thirdPartyKeysApi.regenerateSecret(keyToRegenerate.id);
      toast.success('重新生成密钥成功');

      // 显示新密钥
      setNewKeyData(response.data);
      setSecretDialogOpen(true);

      fetchKeys();
    } catch (error) {
      console.error('重新生成密钥失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '重新生成失败';
      toast.error(errorMessage);
    } finally {
      setKeyToRegenerate(null);
    }
  };

  // 改变状态
  const handleChangeStatus = (key) => {
    setKeyToChangeStatus(key);
    setStatusDialogOpen(true);
  };

  // 确认改变状态
  const handleConfirmChangeStatus = async () => {
    if (!keyToChangeStatus) return;

    try {
      const newStatus = keyToChangeStatus.status === 'active' ? 'inactive' : 'active';
      await thirdPartyKeysApi.changeStatus(keyToChangeStatus.id, { status: newStatus });
      toast.success(`密钥${newStatus === 'active' ? '启用' : '禁用'}成功`);
      fetchKeys();
    } catch (error) {
      console.error('改变密钥状态失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '操作失败';
      toast.error(errorMessage);
    } finally {
      setKeyToChangeStatus(null);
    }
  };

  // 创建成功回调
  const handleCreateSuccess = (createdKey) => {
    setNewKeyData(createdKey);
    setSecretDialogOpen(true);
    fetchKeys();
  };

  // 状态徽章颜色
  const getStatusBadge = (status, expiresAt) => {
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      return <Badge variant="destructive">已过期</Badge>;
    }
    const statusMap = {
      active: { label: '启用', variant: 'default' },
      inactive: { label: '禁用', variant: 'secondary' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索客户端名称...'
    },
    {
      type: 'select',
      name: 'status',
      placeholder: '选择状态',
      options: [
        { label: '全部状态', value: 'all' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ]
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'client_name',
      label: '外部系统',
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-muted-foreground">{row.description || '未填写说明'}</span>
        </div>
      )
    },
    {
      key: 'api_key',
      label: 'API Key',
      render: (value) => (
        <code className="rounded bg-muted/60 px-2 py-1 text-xs">{value}</code>
      )
    },
    {
      key: 'scopes',
      label: '权限范围',
      render: (value = []) => (
        <div className="flex max-w-72 flex-wrap gap-1">
          {value.slice(0, 2).map((scope) => <Badge key={scope} variant="neutral">{scope}</Badge>)}
          {value.length > 2 ? <Badge variant="outline">+{value.length - 2}</Badge> : null}
        </div>
      )
    },
    {
      key: 'status',
      label: '状态',
      render: (value, row) => getStatusBadge(value, row.expires_at)
    },
    {
      key: 'expires_at',
      label: '有效期至',
      render: (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '永久'
    },
    {
      key: 'last_used_at',
      label: '最后使用',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="第三方签名密钥"
        description="管理后台系统整合、数据同步和开放接口的 HMAC 签名凭证。"
        meta={<span className="text-sm text-muted-foreground">共 {pagination.total} 个</span>}
        actions={<>
          <Button variant="outline" onClick={() => setGuideOpen(true)}><BookOpen className="h-4 w-4" />接入说明</Button>
          <Button onClick={handleAdd} className="sm:w-auto"><Plus className="h-4 w-4" />创建签名密钥</Button>
        </>}
      />
      <PageWorkspace>
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
        <PageSurface className="p-0">
        <DataTable
          variant="workspace"
          density="compact"
          columns={columns}
          data={keys}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions={(row) => (
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(row)}
                title="编辑"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleChangeStatus(row)}
                title={row.status === 'active' ? '禁用' : '启用'}
              >
                <Power className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRegenerate(row)}
                title="重新生成密钥"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(row)}
                title="删除"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
        </PageSurface>
      </PageWorkspace>

      {/* 密钥表单弹窗 */}
      <KeyFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingKey={editingKey}
        onSuccess={editingKey ? fetchKeys : handleCreateSuccess}
      />

      {/* 密钥显示弹窗 */}
      <SecretDisplayDialog
        open={secretDialogOpen}
        onOpenChange={setSecretDialogOpen}
        keyData={newKeyData}
      />

      <SignatureGuideDialog open={guideOpen} onOpenChange={setGuideOpen} />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除密钥"
        description={
          keyToDelete
            ? `确定要删除密钥 "${keyToDelete.client_name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />

      {/* 确认重新生成对话框 */}
      <ConfirmDialog
        open={regenerateDialogOpen}
        onOpenChange={setRegenerateDialogOpen}
        onConfirm={handleConfirmRegenerate}
        title="确认重新生成密钥"
        description={
          keyToRegenerate
            ? `确定要重新生成密钥 "${keyToRegenerate.client_name}" 的API Secret吗？旧密钥将立即失效。`
            : ''
        }
        confirmText="重新生成"
        cancelText="取消"
        variant="destructive"
      />

      {/* 确认改变状态对话框 */}
      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onConfirm={handleConfirmChangeStatus}
        title={keyToChangeStatus?.status === 'active' ? '确认禁用密钥' : '确认启用密钥'}
        description={
          keyToChangeStatus
            ? `确定要${keyToChangeStatus.status === 'active' ? '禁用' : '启用'}密钥 "${keyToChangeStatus.client_name}" 吗？`
            : ''
        }
        confirmText={keyToChangeStatus?.status === 'active' ? '禁用' : '启用'}
        cancelText="取消"
        variant={keyToChangeStatus?.status === 'active' ? 'destructive' : 'default'}
      />
    </PageShell>
  );
}
