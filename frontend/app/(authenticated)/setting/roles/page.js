'use client';

import { useState, useEffect } from 'react';
import { roleApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import RoleFormDialog from '@/components/roles/role-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { usePermission } from '@/lib/hooks/usePermission';
import { PageHeader, PageShell, PageSurface, PageToolbar } from '@/components/layout/page-shell';

export default function RolesPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();
  const [roles, setRoles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  // 获取角色列表
  const fetchRoles = async () => {
    try {
      setIsLoading(true);
      const response = await roleApi.getRoles({
        search: searchValues.keyword || '',
        page: pagination.page,
        limit: pagination.pageSize
      });
      const rolesData = response.data?.items || response.data || [];
      setRoles(Array.isArray(rolesData) ? rolesData : []);

      // 更新分页信息
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0
        }));
      }
    } catch (error) {
      console.error('获取角色列表失败:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
    setTimeout(() => fetchRoles(), 0);
  };

  // 重置
  const handleReset = () => {
    setSearchValues({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchRoles(), 0);
  };

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 新增角色
  const handleAdd = () => {
    setEditingRole(null);
    setIsDialogOpen(true);
  };

  // 编辑角色
  const handleEdit = (role) => {
    setEditingRole(role);
    setIsDialogOpen(true);
  };

  // 删除角色
  const handleDelete = (role) => {
    setRoleToDelete(role);
    setConfirmDialogOpen(true);
  };

  // 确认删除角色
  const handleConfirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      await roleApi.deleteRole(roleToDelete.id);
      toast.success('删除角色成功');
      fetchRoles();
    } catch (error) {
      console.error('删除角色失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setRoleToDelete(null);
    }
  };

  // 切换角色状态（乐观更新，避免页面闪烁）
  const handleToggleStatus = async (role) => {
    const newStatus = role.status === 'active' ? 'inactive' : 'active';
    const prevStatus = role.status;
    // 先更新本地状态
    setRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
    try {
      await roleApi.updateRole(role.id, { status: newStatus });
      toast.success(newStatus === 'active' ? '已启用' : '已禁用');
    } catch (error) {
      // 失败回滚
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: prevStatus } : r));
      console.error('切换状态失败:', error);
      toast.error(error.response?.data?.message || error.message || '操作失败');
    }
  };

  // 状态徽章颜色
  const getStatusBadge = (status) => {
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
      placeholder: '搜索角色名称、代码...'
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'name',
      label: '角色名称',
      cellClassName: 'font-medium'
    },
    {
      key: 'code',
      label: '角色代码',
      render: (value) => (
        <code className="text-sm bg-muted px-2 py-1 rounded">{value}</code>
      )
    },
    {
      key: 'description',
      label: '描述',
      cellClassName: 'max-w-xs truncate',
      render: (value) => value || '-'
    },
    {
      key: 'status',
      label: '状态',
      render: (value, row) => (
        <Switch
          checked={value === 'active'}
          onCheckedChange={() => handleToggleStatus(row)}
          disabled={!canUpdate('role')}
        />
      )
    },
    {
      key: 'sort',
      label: '排序'
    },
    {
      key: 'created_at',
      label: '创建时间',
      render: (value) => value ? new Date(value).toLocaleDateString('zh-CN') : '-'
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="角色管理"
        description="配置角色及其关联权限范围。"
        actions={
          canCreate('role') ? (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              新增角色
            </Button>
          ) : null
        }
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
      <PageSurface className="p-5 pt-4 lg:p-3">
        <DataTable
          variant="workspace"
          columns={columns}
          data={roles}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions={(role) => (
            <>
              {canUpdate('role') &&  (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(role)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete('role') && role.code !== 'super_admin' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(role)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </>
          )}
        />
      </PageSurface>

      {/* 角色表单弹窗 */}
      <RoleFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        role={editingRole}
        onSuccess={fetchRoles}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除角色"
        description={
          roleToDelete
            ? `确定要删除角色 "${roleToDelete.name}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
