'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { userApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import UserFormDialog from '@/components/users/user-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { usePermission } from '@/lib/hooks/usePermission';
import PlainAccessButton from '@/components/sensitive-fields/plain-access-button';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

export default function UsersPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [appliedSearch, setAppliedSearch] = useState('');
  const [queryVersion, setQueryVersion] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const latestRequestId = useRef(0);

  // 获取用户列表
  const fetchUsers = useCallback(async ({
    search = appliedSearch,
    page = pagination.page,
    limit = pagination.pageSize,
  } = {}) => {
    const requestId = ++latestRequestId.current;
    setIsLoading(true);
    try {
      const response = await userApi.getUsers({ search, page, limit });
      if (requestId !== latestRequestId.current) return;

      const usersData = response.data?.items || response.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);

      // 更新分页信息
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0
        }));
      }
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('获取用户列表失败:', error);
      setUsers([]);
    } finally {
      if (requestId === latestRequestId.current) setIsLoading(false);
    }
  }, [appliedSearch, pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchUsers({
      search: appliedSearch,
      page: pagination.page,
      limit: pagination.pageSize,
    });
  }, [appliedSearch, fetchUsers, pagination.page, pagination.pageSize, queryVersion]);

  // 搜索
  const handleSearch = () => {
    setAppliedSearch(searchValues.keyword?.trim() || '');
    setPagination(prev => ({ ...prev, page: 1 }));
    setQueryVersion(current => current + 1);
  };

  // 重置
  const handleReset = () => {
    setSearchValues({});
    setAppliedSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));
    setQueryVersion(current => current + 1);
  };

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 新增用户
  const handleAdd = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  // 编辑用户
  const handleEdit = (user) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  // 删除用户
  const handleDelete = (user) => {
    setUserToDelete(user);
    setConfirmDialogOpen(true);
  };

  // 确认删除用户
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await userApi.deleteUser(userToDelete.id);
      toast.success('删除用户成功');
      fetchUsers();
    } catch (error) {
      console.error('删除用户失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setUserToDelete(null);
    }
  };

  // 切换用户状态（乐观更新，避免页面闪烁）
  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const prevStatus = user.status;
    // 先更新本地状态
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: newStatus } : u));
    try {
      await userApi.updateUser(user.id, { status: newStatus });
      toast.success(newStatus === 'active' ? '已启用' : '已禁用');
    } catch (error) {
      // 失败回滚
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, status: prevStatus } : u));
      console.error('切换状态失败:', error);
      toast.error(error.response?.data?.message || error.message || '操作失败');
    }
  };

  // 状态徽章颜色
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '正常', variant: 'success' },
      inactive: { label: '禁用', variant: 'neutral' },
      banned: { label: '封禁', variant: 'warning' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 判断数据是否已脱敏
  const isMasked = (value, fieldName) => {
    if (!value) return false;
    
    const strValue = String(value);
    
    // 邮箱脱敏特征：包含 *** 或 * 符号
    if (fieldName === 'email') {
      return strValue.includes('***') || (strValue.includes('*') && strValue.includes('@'));
    }
    
    // 手机号脱敏特征：包含 **** 或中间有星号
    if (fieldName === 'phone') {
      return strValue.includes('****') || strValue.includes('***');
    }
    
    // 通用判断：如果包含多个连续星号，认为是脱敏数据
    return strValue.includes('***') || strValue.includes('****');
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索用户名、邮箱...'
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'username',
      label: '用户',
      render: (value, record) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium">{value || '-'}</span>
          {record.real_name && (
            <span className="text-xs text-muted-foreground">{record.real_name}</span>
          )}
        </div>
      )
    },
    {
      key: 'email',
      label: '邮箱',
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>{value || '-'}</span>
          {value && isMasked(value, 'email') && (
            <PlainAccessButton 
              tableName="owl_users" 
              fieldName="email"
              recordId={String(record.id)}
              onSuccess={fetchUsers}
            />
          )}
        </div>
      )
    },
    {
      key: 'phone',
      label: '手机号',
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <span>{value || '-'}</span>
          {value && isMasked(value, 'phone') && (
            <PlainAccessButton 
              tableName="owl_users" 
              fieldName="phone"
              recordId={String(record.id)}
              onSuccess={fetchUsers}
            />
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: '状态',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={value === 'active'}
            onCheckedChange={() => handleToggleStatus(row)}
            disabled={!canUpdate('user')}
            aria-label={`切换用户 ${row.username} 状态`}
          />
          {getStatusBadge(value)}
        </div>
      )
    },
    {
      key: 'last_login_at',
      label: '最后登录',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    }
  ];

  const renderUserActions = (user) => (
    <>
      {canUpdate('user') && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleEdit(user)}
          aria-label={`编辑用户 ${user.username}`}
          title="编辑用户"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {canDelete('user') && (
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => handleDelete(user)}
          aria-label={`删除用户 ${user.username}`}
          title="删除用户"
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </>
  );

  return (
    <PageShell>
      <PageHeader
        title="用户管理"
        description="管理系统用户账号、访问状态与数据权限。"
        meta={<span className="text-sm text-muted-foreground">共 {pagination.total} 位用户</span>}
        actions={
          canCreate('user') ? (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4" />
              新增用户
            </Button>
          ) : null
        }
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
          data={users}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions={renderUserActions}
        />
        </PageSurface>
      </PageWorkspace>

      {/* 用户表单弹窗 */}
      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={editingUser}
        onSuccess={fetchUsers}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除用户"
        description={
          userToDelete
            ? `确定要删除用户 "${userToDelete.username}" 吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
