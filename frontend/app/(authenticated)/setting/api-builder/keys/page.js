'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiBuilderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Copy, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface, PageWorkspace } from '@/components/layout/page-shell';

// 脱敏显示密钥
const maskKey = (key) => {
  if (!key) return '';
  if (key.length <= 8) return '*'.repeat(key.length);
  return key.substring(0, 4) + '*'.repeat(key.length - 8) + key.substring(key.length - 4);
};

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    let date = new Date(dateString);
    if (isNaN(date.getTime()) && typeof dateString === 'string') {
      const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})\s?(\d{2})?:?(\d{2})?:?(\d{2})?/);
      if (match) {
        const [, year, month, day, hour = 0, minute = 0, second = 0] = match;
        date = new Date(year, month - 1, day, hour, minute, second);
      }
    }
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('zh-CN');
  } catch (error) {
    return '-';
  }
};

// 获取密钥状态（使用后端返回的expireStatus）
const getKeyStatus = (expireStatus) => {
  if (expireStatus === 'inactive') {
    return { text: '已禁用', variant: 'neutral' };
  }
  if (expireStatus === 'expired') {
    return { text: '已过期', variant: 'destructive' };
  }
  return { text: '有效', variant: 'default' };
};

export default function ApiKeyManagementPage() {
  const router = useRouter();
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState({
    app_name: '',
  });
  const [visibleKeys, setVisibleKeys] = useState({});
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState(null);

  // 获取密钥列表
  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      const response = await apiBuilderApi.getAllApiKeys();
      setKeys(response.data || []);
    } catch (error) {
      console.error('获取密钥列表失败:', error);
      toast.error('获取密钥列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreate = () => {
    setEditingKey(null);
    setFormData({ app_name: '' });
    setDialogOpen(true);
  };

  const handleEdit = (key) => {
    setEditingKey(key);
    setFormData({ app_name: key.app_name });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.app_name.trim()) {
      toast.error('请输入应用名称');
      return;
    }

    try {
      if (editingKey) {
        await apiBuilderApi.updateApiKey(editingKey.id, formData);
        toast.success('密钥已更新');
      } else {
        await apiBuilderApi.createApiKey(formData);
        toast.success('密钥已创建');
      }
      setDialogOpen(false);
      fetchKeys();
    } catch (error) {
      console.error('操作失败:', error);
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = (key) => {
    setKeyToDelete(key);
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!keyToDelete) return;
    try {
      await apiBuilderApi.deleteApiKey(keyToDelete.id);
      toast.success('密钥已删除');
      fetchKeys();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    } finally {
      setKeyToDelete(null);
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`已复制${label}`);
  };

  const toggleKeyVisibility = (keyId) => {
    setVisibleKeys((prev) => ({
      ...prev,
      [keyId]: !prev[keyId],
    }));
  };

  const columns = [
    {
      key: 'app_name',
      label: '应用',
      render: (value, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{value || '-'}</span>
          <span className="text-xs text-muted-foreground">创建于 {formatDate(record.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'id',
      label: 'App ID',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <code className="max-w-44 truncate rounded bg-muted/60 px-2 py-1 text-xs text-foreground/80">{value}</code>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleCopy(value, 'App ID')}
            aria-label="复制 App ID"
            title="复制 App ID"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
    {
      key: 'api_key',
      label: 'App Key',
      render: (value, record) => (
        <div className="flex items-center gap-1.5">
          <code className="max-w-52 truncate rounded bg-muted/60 px-2 py-1 text-xs text-foreground/80">
            {visibleKeys[record.id] ? value : maskKey(value)}
          </code>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => toggleKeyVisibility(record.id)}
            aria-label={visibleKeys[record.id] ? '隐藏 App Key' : '显示 App Key'}
            title={visibleKeys[record.id] ? '隐藏 App Key' : '显示 App Key'}
          >
            {visibleKeys[record.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </Button>
          {visibleKeys[record.id] ? (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => handleCopy(value, 'App Key')}
              aria-label="复制 App Key"
              title="复制 App Key"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      ),
    },
    {
      key: 'expires_at',
      label: '有效期至',
      cellClassName: 'text-sm text-muted-foreground tabular-data',
      render: (value) => formatDate(value),
    },
    {
      key: 'last_used_at',
      label: '最后使用',
      cellClassName: 'text-sm text-muted-foreground tabular-data',
      render: (value) => formatDate(value),
    },
    {
      key: 'expireStatus',
      label: '状态',
      render: (value) => {
        const status = getKeyStatus(value);
        return <Badge variant={status.variant}>{status.text}</Badge>;
      },
    },
  ];

  const renderActions = (key) => (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => handleEdit(key)}
        aria-label={`编辑密钥 ${key.app_name}`}
        title="编辑密钥"
      >
        <Edit2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => handleDelete(key)}
        aria-label={`删除密钥 ${key.app_name}`}
        title="删除密钥"
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </>
  );

  return (
    <PageShell>
      <PageHeader
        title="API 密钥"
        description="管理接口调用凭据和使用状态。"
        meta={<span className="text-sm text-muted-foreground">共 {keys.length} 个密钥</span>}
        leading={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            aria-label="返回接口开发"
            title="返回接口开发"
            className="-ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        }
        actions={
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            创建密钥
          </Button>
        }
      />
      <PageWorkspace>
        <PageSurface className="p-0">
          <DataTable
            variant="workspace"
            density="compact"
            columns={columns}
            data={keys}
            loading={isLoading}
            emptyText="暂无 API 密钥"
            actions={renderActions}
          />
        </PageSurface>
      </PageWorkspace>

      {/* 编辑/新增对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKey ? '编辑密钥' : '新增密钥'}</DialogTitle>
            <DialogDescription>
              {editingKey ? '修改应用名称' : '创建新的 API 密钥，自动生成 App ID 和 App Key，有效期 180 天'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="app_name">应用名称 *</Label>
              <Input
                id="app_name"
                value={formData.app_name}
                onChange={(e) => setFormData({ app_name: e.target.value })}
                placeholder="例：我的应用"
                className="mt-1"
              />
            </div>

            {!editingKey && (
              <div className="rounded-lg border border-muted-foreground/20 bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  创建后将自动生成唯一的 App ID 和 App Key，可用于接口身份验证。密钥有效期为 180 天，请妥善保存。
                </p>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingKey ? '更新' : '创建'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除密钥"
        description={keyToDelete ? `确定要删除“${keyToDelete.app_name}”的 API 密钥吗？删除后相关调用将立即失效。` : ''}
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
