'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Plus, Power, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiBuilderApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/common/DataTable';
import { PageHeader, PageShell, PageSurface, PageWorkspace } from '@/components/layout/page-shell';
import ApiKeyDisplayDialog from '@/components/api-builder/api-key-display-dialog';

const EMPTY_FORM = { client_name: '', description: '', expires_at: '', interface_ids: [] };
const formatDate = (value) => value ? new Date(value).toLocaleString('zh-CN') : '-';

export default function ApiKeyManagementPage() {
  const router = useRouter();
  const [keys, setKeys] = useState([]);
  const [interfaces, setInterfaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [displayData, setDisplayData] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [keysResponse, interfacesResponse] = await Promise.all([
        apiBuilderApi.getAllApiKeys(),
        apiBuilderApi.getInterfaces({ page: 1, limit: 100 }),
      ]);
      setKeys(keysResponse.data || []);
      setInterfaces(interfacesResponse.data?.items || []);
    } catch (error) {
      console.error(error);
      toast.error('获取接口密钥数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditingKey(null);
    setFormData(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (key) => {
    setEditingKey(key);
    setFormData({
      client_name: key.client_name,
      description: key.description || '',
      expires_at: key.expires_at ? new Date(key.expires_at).toISOString().slice(0, 10) : '',
      interface_ids: (key.interfaces || []).map((item) => item.id),
    });
    setFormOpen(true);
  };

  const toggleInterface = (id) => {
    setFormData((current) => ({
      ...current,
      interface_ids: current.interface_ids.includes(id)
        ? current.interface_ids.filter((item) => item !== id)
        : [...current.interface_ids, id],
    }));
  };

  const save = async () => {
    if (!formData.client_name.trim()) return toast.error('请输入厂商或应用名称');
    if (!formData.interface_ids.length) return toast.error('请至少授权一个 SQL 接口');
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        expires_at: formData.expires_at ? new Date(formData.expires_at).toISOString() : undefined,
      };
      if (editingKey) {
        await apiBuilderApi.updateApiKey(editingKey.id, payload);
        toast.success('接口密钥已更新');
      } else {
        const response = await apiBuilderApi.createApiKey(payload);
        setDisplayData(response.data);
        toast.success('接口密钥已创建');
      }
      setFormOpen(false);
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const runPendingAction = async () => {
    if (!pendingAction) return;
    const { type, key } = pendingAction;
    try {
      if (type === 'delete') await apiBuilderApi.deleteApiKey(key.id);
      if (type === 'status') await apiBuilderApi.changeApiKeyStatus(key.id, key.status === 'active' ? 'inactive' : 'active');
      if (type === 'regenerate') {
        const response = await apiBuilderApi.regenerateApiKey(key.id);
        setDisplayData(response.data);
      }
      toast.success(type === 'delete' ? '接口密钥已删除' : type === 'status' ? '状态已更新' : '接口密钥已重新生成');
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || '操作失败');
    } finally {
      setPendingAction(null);
    }
  };

  const columns = [
    {
      key: 'client_name',
      label: '厂商 / 应用',
      render: (value, row) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-muted-foreground">{row.description || '未填写说明'}</span>
        </div>
      ),
    },
    { key: 'key_prefix', label: '密钥标识', render: (value) => <code className="rounded bg-muted/60 px-2 py-1 text-xs">{value}</code> },
    {
      key: 'interfaces',
      label: '授权接口',
      render: (value = []) => (
        <div className="flex max-w-72 flex-wrap gap-1">
          {value.slice(0, 2).map((item) => <Badge key={item.id} variant="neutral">{item.name}</Badge>)}
          {value.length > 2 ? <Badge variant="outline">+{value.length - 2}</Badge> : null}
        </div>
      ),
    },
    { key: 'expires_at', label: '有效期至', cellClassName: 'text-sm text-muted-foreground tabular-data', render: formatDate },
    { key: 'last_used_at', label: '最后使用', cellClassName: 'text-sm text-muted-foreground tabular-data', render: formatDate },
    {
      key: 'status',
      label: '状态',
      render: (value, row) => {
        const expired = new Date(row.expires_at) <= new Date();
        return <Badge variant={expired ? 'destructive' : value === 'active' ? 'default' : 'neutral'}>{expired ? '已过期' : value === 'active' ? '启用' : '禁用'}</Badge>;
      },
    },
  ];

  const actions = (key) => (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => openEdit(key)} title="编辑授权" aria-label={`编辑 ${key.client_name}`}><Edit2 className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setPendingAction({ type: 'status', key })} title={key.status === 'active' ? '禁用' : '启用'} aria-label={`${key.status === 'active' ? '禁用' : '启用'} ${key.client_name}`}><Power className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setPendingAction({ type: 'regenerate', key })} title="重新生成" aria-label={`重新生成 ${key.client_name}`}><RefreshCw className="h-4 w-4" /></Button>
      <Button variant="ghost" size="icon-sm" onClick={() => setPendingAction({ type: 'delete', key })} title="删除" aria-label={`删除 ${key.client_name}`}><Trash2 className="h-4 w-4 text-destructive" /></Button>
    </>
  );

  const actionCopy = pendingAction?.type === 'delete'
    ? { title: '确认删除接口密钥', text: '删除后相关厂商将立即无法调用已授权接口。', confirm: '删除' }
    : pendingAction?.type === 'regenerate'
      ? { title: '确认重新生成密钥', text: '重新生成后旧密钥立即失效。', confirm: '重新生成' }
      : { title: '确认修改密钥状态', text: '状态变化会立即影响接口调用。', confirm: '确认' };

  return (
    <PageShell>
      <PageHeader
        title="接口密钥"
        description="为厂商或业务应用授权一个或多个 SQL 接口。"
        meta={<span className="text-sm text-muted-foreground">共 {keys.length} 个</span>}
        leading={<Button variant="ghost" size="icon" className="-ml-2" onClick={() => router.back()} aria-label="返回接口开发"><ArrowLeft className="h-4 w-4" /></Button>}
        actions={<Button onClick={openCreate}><Plus className="h-4 w-4" />创建密钥</Button>}
      />
      <PageWorkspace>
        <PageSurface className="p-0">
          <DataTable variant="workspace" density="compact" columns={columns} data={keys} loading={loading} emptyText="暂无接口密钥" actions={actions} />
        </PageSurface>
      </PageWorkspace>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingKey ? '编辑接口密钥' : '创建接口密钥'}</DialogTitle>
            <DialogDescription>配置调用方信息，并选择允许调用的 SQL 接口。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>厂商或应用名称 *</Label><Input value={formData.client_name} onChange={(event) => setFormData((data) => ({ ...data, client_name: event.target.value }))} placeholder="例如：华东仓储系统" /></div>
            <div className="space-y-2"><Label>用途说明</Label><Input value={formData.description} onChange={(event) => setFormData((data) => ({ ...data, description: event.target.value }))} placeholder="说明该密钥的业务用途" /></div>
            <div className="space-y-2"><Label>有效期至</Label><Input type="date" value={formData.expires_at} onChange={(event) => setFormData((data) => ({ ...data, expires_at: event.target.value }))} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><Label>授权 SQL 接口 *</Label><span className="text-xs text-muted-foreground">已选 {formData.interface_ids.length} 个</span></div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border p-2">
                {interfaces.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/60">
                    <Checkbox checked={formData.interface_ids.includes(item.id)} onCheckedChange={() => toggleInterface(item.id)} />
                    <span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.name}</span><span className="block truncate text-xs text-muted-foreground">{item.method} {item.endpoint}</span></span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setFormOpen(false)}>取消</Button><Button onClick={save} disabled={submitting}>{submitting ? '保存中...' : '保存'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)} onConfirm={runPendingAction} title={actionCopy.title} description={actionCopy.text} confirmText={actionCopy.confirm} variant={pendingAction?.type === 'delete' ? 'destructive' : 'default'} />
      <ApiKeyDisplayDialog open={!!displayData} onOpenChange={(open) => !open && setDisplayData(null)} keyData={displayData} />
    </PageShell>
  );
}
