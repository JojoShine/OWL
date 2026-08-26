'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { fileApi, folderApi, roleApi } from '@/lib/api';
import { Trash2, Plus } from 'lucide-react';

export default function PermissionDialog({ open, onClose, item, isFolder }) {
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inherit, setInherit] = useState(true);

  // Form state for adding permission (roles only)
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [selectedPermission, setSelectedPermission] = useState('read');

  useEffect(() => {
    if (open && item) {
      loadPermissions();
      loadRoles();
    }
  }, [open, item]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const api = isFolder ? folderApi : fileApi;
      const response = await api.getPermissions(item.id);
      setPermissions(response.data || []);
      setInherit(item.inherit_permissions ?? true);
    } catch (error) {
      console.error('Failed to load permissions:', error);
      toast.error('加载权限列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesRes = await roleApi.getRoles({ limit: 100 });
      setRoles(rolesRes.data?.items || []);
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedRoleId) {
      toast.error('请选择角色');
      return;
    }

    try {
      setLoading(true);
      const api = isFolder ? folderApi : fileApi;
      const data = {
        roleId: selectedRoleId,
        permission: selectedPermission,
      };

      await api.addPermission(item.id, data);

      toast.success('权限添加成功');

      // Reset form and reload
      setSelectedRoleId('');
      setSelectedPermission('read');
      await loadPermissions();
    } catch (error) {
      console.error('Failed to add permission:', error);
      toast.error(error.response?.data?.message || '添加权限失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePermission = async (permissionId) => {
    if (!window.confirm('确定要删除此权限吗？')) {
      return;
    }

    try {
      setLoading(true);
      // Delete permission through a custom endpoint
      await fetch(`/api/file-permissions/${permissionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('权限删除成功');

      await loadPermissions();
    } catch (error) {
      console.error('Failed to delete permission:', error);
      toast.error('删除权限失败');
    } finally {
      setLoading(false);
    }
  };

  const handleInheritChange = async () => {
    try {
      setLoading(true);
      const api = isFolder ? folderApi : fileApi;
      await api.setInherit(item.id, { inherit: !inherit });

      setInherit(!inherit);
      toast.success('继承设置已更新');
    } catch (error) {
      console.error('Failed to update inherit setting:', error);
      toast.error('更新继承设置失败');
    } finally {
      setLoading(false);
    }
  };

  const getPermissionLabel = (perm) => {
    const labels = {
      read: '读取',
      write: '编辑',
      delete: '删除',
      admin: '管理',
    };
    return labels[perm] || perm;
  };

  const getDisplayName = (permission) => {
    if (permission.user) {
      return `${permission.user.real_name || permission.user.username}`;
    } else if (permission.role) {
      return permission.role.name;
    }
    return '未知';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>权限管理</DialogTitle>
          <DialogDescription>
            管理{isFolder ? '文件夹' : '文件'}的访问权限
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Inheritance Setting */}
          <div className="rounded-lg border bg-muted/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">权限继承</h3>
                <p className="text-sm text-muted-foreground">
                  {isFolder
                    ? '从父文件夹继承权限'
                    : '从所在文件夹继承权限'}
                </p>
              </div>
              <button
                onClick={handleInheritChange}
                disabled={loading}
                aria-pressed={inherit}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
                  inherit
                    ? 'border-foreground bg-foreground text-background'
                    : 'border-border bg-background text-muted-foreground hover:text-foreground'
                }`}
              >
                {inherit ? '已启用' : '已禁用'}
              </button>
            </div>
          </div>

          {/* Add Permission Form */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-4 text-foreground">添加权限</h3>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="选择角色" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedPermission}
                  onValueChange={setSelectedPermission}
                >
                  <SelectTrigger className="sm:w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="read">读取</SelectItem>
                    <SelectItem value="write">编辑</SelectItem>
                    <SelectItem value="delete">删除</SelectItem>
                    <SelectItem value="admin">管理</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={handleAddPermission}
                  disabled={loading || !selectedRoleId}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  添加
                </Button>
              </div>
            </div>
          </div>

          {/* Permissions List */}
          <div className="rounded-lg border p-4">
            <h3 className="font-medium mb-4 text-foreground">当前权限</h3>
            {permissions.length === 0 ? (
              <EmptyState title="暂无权限设置" description="当前项目尚未配置独立权限" compact />
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between rounded-md bg-muted/60 p-3"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm text-foreground">
                        {getDisplayName(perm)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {perm.user ? '用户' : '角色'} ·{' '}
                        {getPermissionLabel(perm.permission)}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePermission(perm.id)}
                      disabled={loading}
                      className="rounded p-2 text-destructive transition-colors hover:bg-destructive/10"
                      title="删除权限"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
