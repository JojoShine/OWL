'use client';

import { useState, useEffect } from 'react';
import { sensitiveFieldApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2 } from 'lucide-react';
import SensitiveFieldFormDialog from '@/components/sensitive-fields/sensitive-field-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import { usePermission } from '@/lib/hooks/usePermission';
import { PageHeader, PageShell, PageSurface, PageToolbar } from '@/components/layout/page-shell';

export default function SensitiveFieldsPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchValues, setSearchValues] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState(null);

  // 获取敏感字段列表
  const fetchFields = async () => {
    try {
      setIsLoading(true);
      const response = await sensitiveFieldApi.getSensitiveFields({
        search: searchValues.keyword || '',
        page: pagination.page,
        limit: pagination.pageSize
      });
      const fieldsData = response.data?.items || response.data || [];
      setFields(Array.isArray(fieldsData) ? fieldsData : []);

      // 更新分页信息
      if (response.data?.pagination) {
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0
        }));
      }
    } catch (error) {
      console.error('获取敏感字段列表失败:', error);
      setFields([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.pageSize]);

  // 搜索
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 })); // 重置到第一页
    setTimeout(() => fetchFields(), 0);
  };

  // 重置
  const handleReset = () => {
    setSearchValues({});
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => fetchFields(), 0);
  };

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 新增字段
  const handleAdd = () => {
    setEditingField(null);
    setIsDialogOpen(true);
  };

  // 编辑字段
  const handleEdit = (field) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  // 删除字段
  const handleDelete = (field) => {
    setFieldToDelete(field);
    setConfirmDialogOpen(true);
  };

  // 确认删除字段
  const handleConfirmDelete = async () => {
    if (!fieldToDelete) return;

    try {
      await sensitiveFieldApi.deleteSensitiveField(fieldToDelete.id);
      toast.success('删除敏感字段配置成功');
      fetchFields();
    } catch (error) {
      console.error('删除敏感字段配置失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setFieldToDelete(null);
    }
  };

  // 状态徽章颜色
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge variant="default">启用</Badge>
    ) : (
      <Badge variant="secondary">禁用</Badge>
    );
  };

  // 脱敏类型标签
  const getMaskTypeLabel = (maskType) => {
    const typeMap = {
      phone: '手机号',
      email: '邮箱',
      id_card: '身份证',
      bank_card: '银行卡',
      name: '姓名',
      address: '地址',
      custom: '自定义',
    };
    return typeMap[maskType] || maskType;
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索字段名、表名...'
    },
    {
      type: 'select',
      name: 'mask_type',
      placeholder: '选择脱敏类型',
      options: [
        { value: 'phone', label: '手机号' },
        { value: 'email', label: '邮箱' },
        { value: 'id_card', label: '身份证' },
        { value: 'bank_card', label: '银行卡' },
        { value: 'name', label: '姓名' },
        { value: 'address', label: '地址' },
        { value: 'custom', label: '自定义' },
      ]
    },
    {
      type: 'select',
      name: 'is_active',
      placeholder: '选择状态',
      options: [
        { value: 'true', label: '启用' },
        { value: 'false', label: '禁用' },
      ]
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'field_name',
      label: '字段名',
      cellClassName: 'font-medium'
    },
    {
      key: 'table_name',
      label: '表名（可选）',
      render: (value) => {
        if (!value) return '-';
        // 如果是逗号分隔的多个表名，用标签展示
        const tables = value.split(',').map(t => t.trim()).filter(t => t);
        if (tables.length > 1) {
          return (
            <div className="flex flex-wrap gap-1">
              {tables.map((table, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {table}
                </Badge>
              ))}
            </div>
          );
        }
        return value;
      }
    },
    {
      key: 'mask_type',
      label: '脱敏类型',
      render: (value) => getMaskTypeLabel(value)
    },
    {
      key: 'description',
      label: '描述',
      render: (value) => value || '-'
    },
    {
      key: 'is_active',
      label: '状态',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'created_at',
      label: '创建时间',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="敏感字段"
        description="管理敏感数据识别和脱敏规则。"
        actions={
          canCreate('sensitive_field') ? (
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              新增字段
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
      <PageSurface className="p-5 pt-4">
        <DataTable
          variant="workspace"
          columns={columns}
          data={fields}
          loading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          actions={(field) => (
            <>
              {canUpdate('sensitive_field') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(field)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {canDelete('sensitive_field') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(field)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </>
          )}
        />
      </PageSurface>

      {/* 敏感字段表单弹窗 */}
      <SensitiveFieldFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        field={editingField}
        onSuccess={fetchFields}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除敏感字段配置"
        description={
          fieldToDelete
            ? `确定要删除敏感字段 "${fieldToDelete.field_name}" 的配置吗？此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
