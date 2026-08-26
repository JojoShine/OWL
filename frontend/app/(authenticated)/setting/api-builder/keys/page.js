'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiBuilderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { PageHeader, PageShell, PageSurface } from '@/components/layout/page-shell';

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

// 检查密钥是否已过期（180天有效期）
const isKeyExpired = (createdAt) => {
  if (!createdAt) return false;

  let createdDate = new Date(createdAt);

  // 如果日期解析失败，尝试手动解析
  if (isNaN(createdDate.getTime()) && typeof createdAt === 'string') {
    const match = createdAt.match(/(\d{4})-(\d{2})-(\d{2})\s?(\d{2})?:?(\d{2})?:?(\d{2})?/);
    if (match) {
      const [, year, month, day, hour = 0, minute = 0, second = 0] = match;
      createdDate = new Date(year, month - 1, day, hour, minute, second);
    }
  }

  if (isNaN(createdDate.getTime())) return false;

  const expiryDate = new Date(createdDate.getTime() + 180 * 24 * 60 * 60 * 1000);
  return new Date() > expiryDate;
};

// 获取密钥状态（使用后端返回的expireStatus）
const getKeyStatus = (expireStatus) => {
  if (expireStatus === 'inactive') {
    return { text: '已禁用', variant: 'secondary' };
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

  const handleDelete = async (id) => {
    if (!confirm('确定要删除此密钥吗？')) return;

    try {
      await apiBuilderApi.deleteApiKey(id);
      toast.success('密钥已删除');
      fetchKeys();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
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

  return (
    <PageShell>
      <PageHeader
        title="API 密钥"
        description="管理接口调用凭据和使用状态。"
        actions={
          <>
            <Button variant="outline" size="icon" onClick={() => router.back()} aria-label="返回">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-1" />
              创建密钥
            </Button>
          </>
        }
      />
      <PageSurface className="p-5 lg:p-3">
        <div className="mb-4">
          <h2 className="font-medium">密钥列表</h2>
          <p className="mt-1 text-sm text-muted-foreground">使用这些密钥通过 app_id 和 app_key 方式登录获取 token</p>
        </div>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>应用名称</TableHead>
                  <TableHead>App ID</TableHead>
                  <TableHead>App Key</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>有效期至</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : keys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      暂无密钥
                    </TableCell>
                  </TableRow>
                ) : (
                  keys.map((key) => (
                    <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.app_name}</TableCell>
                        <TableCell className="font-mono text-sm">
                          <div className="flex items-center gap-2">
                            <span>{key.id}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopy(key.id, 'App ID')}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm max-w-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate">
                              {visibleKeys[key.id] ? key.api_key : maskKey(key.api_key)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="h-6 w-6 p-0"
                            >
                              {visibleKeys[key.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                            {visibleKeys[key.id] && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopy(key.api_key, 'App Key')}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(key.created_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(key.updated_at)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(key.expires_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getKeyStatus(key.expireStatus).variant}>
                            {getKeyStatus(key.expireStatus).text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(key)}
                              title="编辑"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(key.id)}
                              title="删除"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
      </PageSurface>

      {/* 编辑/新增对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingKey ? '编辑密钥' : '新增密钥'}</DialogTitle>
            <DialogDescription>
              {editingKey ? '修改应用名称' : '创建新的API密钥，自动生成app_id和app_key，有效期180天'}
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
              <div className="bg-muted border border-muted-foreground/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">
                  创建后将自动生成唯一的 App ID 和 App Key，用于通过 API 密钥方式登录获取 token。有效期为 180 天，过期后可点击续期按钮延长有效期。
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
    </PageShell>
  );
}
