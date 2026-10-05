
import { useState, useEffect, useMemo } from 'react';
import { departmentApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { EmptyState } from '@/components/ui/empty-state';
import { Plus } from 'lucide-react';
import { SearchFilter } from '@/components/common/SearchFilter';
import { TreeView } from '@/components/common/TreeView';
import { DepartmentTreeNode } from '@/components/common/TreeNodeRenderers';
import DepartmentFormDialog from '@/components/departments/department-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import { usePermission } from '@/lib/hooks/usePermission';
import { useListQuery } from '@/lib/hooks/use-list-query';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

const INITIAL_SEARCH_VALUES = {
  keyword: '',
  status: 'all',
};

export default function DepartmentsPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);
  const {
    draftFilters: searchValues,
    setDraftFilters: setSearchValues,
    appliedFilters,
    submit: handleSearch,
    reset: handleReset,
  } = useListQuery({ initialFilters: INITIAL_SEARCH_VALUES });

  // 获取部门树
  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const response = await departmentApi.getDepartmentTree();
      const departmentsData = response.data?.items || [];
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      // 默认展开所有一级部门
      const topLevelIds = (Array.isArray(departmentsData) ? departmentsData : []).map(d => d.id);
      setExpandedDepartments(new Set(topLevelIds));
    } catch (error) {
      console.error('获取部门列表失败:', error);
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 搜索过滤逻辑
  const filteredDepartments = useMemo(() => {
    const filterNode = (node) => {
      const matchKeyword = !appliedFilters.keyword ||
        node.name.toLowerCase().includes(appliedFilters.keyword.toLowerCase()) ||
        (node.code && node.code.toLowerCase().includes(appliedFilters.keyword.toLowerCase())) ||
        (node.description && node.description.toLowerCase().includes(appliedFilters.keyword.toLowerCase()));

      const matchStatus = appliedFilters.status === 'all' || node.status === appliedFilters.status;

      const nodeMatches = matchKeyword && matchStatus;

      // 如果有子节点，递归过滤
      let filteredChildren = [];
      if (node.children && node.children.length > 0) {
        filteredChildren = node.children
          .map(child => filterNode(child))
          .filter(child => child !== null);
      }

      // 如果节点匹配或有匹配的子节点，则保留该节点
      if (nodeMatches || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }

      return null;
    };

    return departments
      .map(dept => filterNode(dept))
      .filter(dept => dept !== null);
  }, [appliedFilters, departments]);

  // 新增部门
  const handleAdd = (parentDepartment = null) => {
    setEditingDepartment(parentDepartment ? { parent_id: parentDepartment.id } : null);
    setIsDialogOpen(true);
  };

  // 编辑部门
  const handleEdit = (department) => {
    setEditingDepartment(department);
    setIsDialogOpen(true);
  };

  // 删除部门
  const handleDelete = (department) => {
    setDepartmentToDelete(department);
    setConfirmDialogOpen(true);
  };

  // 确认删除部门
  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;

    try {
      await departmentApi.deleteDepartment(departmentToDelete.id);
      toast.success('删除部门成功');
      fetchDepartments();
    } catch (error) {
      console.error('删除部门失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setDepartmentToDelete(null);
    }
  };

  // 切换展开/收起
  const toggleExpanded = (departmentId) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索部门名称、代码、描述...'
    },
    {
      type: 'select',
      name: 'status',
      placeholder: '选择状态',
      options: [
        { label: '全部状态', value: 'all' },
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' }
      ]
    }
  ];

  // 统计部门数量
  const countDepartments = (deptList) => {
    let count = 0;
    deptList.forEach(dept => {
      count += 1;
      if (dept.children && dept.children.length > 0) {
        count += countDepartments(dept.children);
      }
    });
    return count;
  };

  // 统计启用的部门数量
  const countActiveDepartments = (deptList) => {
    let count = 0;
    deptList.forEach(dept => {
      if (dept.status === 'active') count += 1;
      if (dept.children && dept.children.length > 0) {
        count += countActiveDepartments(dept.children);
      }
    });
    return count;
  };

  return (
    <PageShell>
      <PageHeader
        title="组织架构"
        description="维护部门层级与人员归属。"
        actions={
          canCreate('department') ? (
            <Button onClick={() => handleAdd()}>
              <Plus className="h-4 w-4 mr-2" />
              新增部门
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
        <PageSurface className="p-5 lg:p-3">
        <div className="grid grid-cols-2 items-center gap-4 border-b pb-5 text-center text-sm md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">部门总数</p>
            <p className="text-xl font-semibold tabular-nums">{countDepartments(departments)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">一级部门</p>
            <p className="text-xl font-semibold tabular-nums">{departments.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">启用部门</p>
            <p className="text-xl font-semibold tabular-nums">{countActiveDepartments(departments)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">禁用部门</p>
            <p className="text-xl font-semibold tabular-nums">{countDepartments(departments) - countActiveDepartments(departments)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 py-4">
          <Button
            onClick={() => {
              const getAllIds = (deptList) => {
                let ids = [];
                deptList.forEach(dept => {
                  ids.push(dept.id);
                  if (dept.children && dept.children.length > 0) {
                    ids = ids.concat(getAllIds(dept.children));
                  }
                });
                return ids;
              };
              setExpandedDepartments(new Set(getAllIds(departments)));
            }}
            variant="outline"
          >
            全部展开
          </Button>
          <Button onClick={() => setExpandedDepartments(new Set())} variant="outline">
            全部收起
          </Button>
        </div>
        {isLoading ? (
          <div className="py-6">
            <Loading size="md" variant="pulse" />
          </div>
        ) : filteredDepartments.length === 0 ? (
          <EmptyState
            title={appliedFilters.keyword || appliedFilters.status !== 'all' ? '未找到匹配的部门' : '暂无部门'}
            description={appliedFilters.keyword || appliedFilters.status !== 'all' ? '请调整检索条件后重试' : '创建部门后会显示在这里'}
            action={canCreate('department') ? (
              <Button onClick={() => handleAdd()} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个部门
              </Button>
            ) : null}
          />
        ) : (
          <TreeView
            data={filteredDepartments}
            renderNode={(node) => (
              <DepartmentTreeNode
                node={node}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAdd}
                canCreate={canCreate('department')}
                canUpdate={canUpdate('department')}
                canDelete={canDelete('department')}
              />
            )}
            onToggleExpand={toggleExpanded}
            expandedIds={expandedDepartments}
          />
        )}
        </PageSurface>
      </PageWorkspace>

      {/* 部门表单弹窗 */}
      <DepartmentFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        department={editingDepartment}
        onSuccess={fetchDepartments}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除部门"
        description={
          departmentToDelete
            ? `确定要删除部门 "${departmentToDelete.name}" 吗？如果有子部门也会一起删除。此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
