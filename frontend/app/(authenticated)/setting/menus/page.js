'use client';

import { useState, useEffect, useMemo } from 'react';
import { menuApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loading } from '@/components/ui/loading';
import { Plus } from 'lucide-react';
import { SearchFilter } from '@/components/common/SearchFilter';
import { TreeView } from '@/components/common/TreeView';
import { MenuTreeNode } from '@/components/common/TreeNodeRenderers';
import MenuFormDialog from '@/components/menus/menu-form-dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import { usePermission } from '@/lib/hooks/usePermission';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

export default function MenusPage() {
  const { canCreate, canUpdate, canDelete } = usePermission();
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState(new Set());
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [menuToDelete, setMenuToDelete] = useState(null);
  const [searchValues, setSearchValues] = useState({
    keyword: '',
    type: 'all',
    status: 'all'
  });

  // 获取菜单树
  const fetchMenus = async () => {
    try {
      setIsLoading(true);
      const response = await menuApi.getMenuTree();
      const menusData = response.data?.items || response.data || [];
      setMenus(Array.isArray(menusData) ? menusData : []);
      // 默认展开所有一级菜单
      const topLevelIds = (Array.isArray(menusData) ? menusData : []).map(m => m.id);
      setExpandedMenus(new Set(topLevelIds));
    } catch (error) {
      console.error('获取菜单列表失败:', error);
      setMenus([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  // 搜索过滤逻辑
  const filteredMenus = useMemo(() => {
    const filterNode = (node) => {
      const matchKeyword = !searchValues.keyword ||
        node.name.toLowerCase().includes(searchValues.keyword.toLowerCase()) ||
        (node.path && node.path.toLowerCase().includes(searchValues.keyword.toLowerCase()));

      const matchType = searchValues.type === 'all' || node.type === searchValues.type;
      const matchStatus = searchValues.status === 'all' || node.status === searchValues.status;

      const nodeMatches = matchKeyword && matchType && matchStatus;

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

    return menus
      .map(menu => filterNode(menu))
      .filter(menu => menu !== null);
  }, [menus, searchValues]);

  // 新增菜单
  const handleAdd = (parentMenu = null) => {
    setEditingMenu(parentMenu ? { parent_id: parentMenu.id } : null);
    setIsDialogOpen(true);
  };

  // 编辑菜单
  const handleEdit = (menu) => {
    setEditingMenu(menu);
    setIsDialogOpen(true);
  };

  // 删除菜单
  const handleDelete = (menu) => {
    setMenuToDelete(menu);
    setConfirmDialogOpen(true);
  };

  // 确认删除菜单
  const handleConfirmDelete = async () => {
    if (!menuToDelete) return;

    try {
      await menuApi.deleteMenu(menuToDelete.id);
      toast.success('删除菜单成功');
      fetchMenus();
    } catch (error) {
      console.error('删除菜单失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '删除失败';
      toast.error(errorMessage);
    } finally {
      setMenuToDelete(null);
    }
  };

  // 切换展开/收起
  const toggleExpanded = (menuId) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索菜单名称、路径...'
    },
    {
      type: 'select',
      name: 'type',
      placeholder: '选择类型',
      options: [
        { label: '全部类型', value: 'all' },
        { label: '菜单', value: 'menu' },
        { label: '按钮', value: 'button' },
        { label: '链接', value: 'link' }
      ]
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

  // 统计菜单数量
  const countMenus = (menuList) => {
    let count = 0;
    menuList.forEach(menu => {
      count += 1;
      if (menu.children && menu.children.length > 0) {
        count += countMenus(menu.children);
      }
    });
    return count;
  };

  // 统计启用的菜单数量
  const countActiveMenus = (menuList) => {
    let count = 0;
    menuList.forEach(menu => {
      if (menu.status === 'active') count += 1;
      if (menu.children && menu.children.length > 0) {
        count += countActiveMenus(menu.children);
      }
    });
    return count;
  };

  return (
    <PageShell>
      <PageHeader
        title="菜单管理"
        description="配置导航结构、路由与菜单权限。"
        actions={
          canCreate('menu') ? (
            <Button onClick={() => handleAdd()}>
              <Plus className="h-4 w-4 mr-2" />
              新增菜单
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
          onSearch={() => {}}
          onReset={() => setSearchValues({ keyword: '', type: 'all', status: 'all' })}
        />
        </PageToolbar>
        <PageSurface className="p-5 lg:p-3">
        <div className="grid grid-cols-2 gap-4 border-b pb-5 text-sm md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">菜单总数</p>
            <p className="text-xl font-semibold tabular-nums">{countMenus(menus)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">一级菜单</p>
            <p className="text-xl font-semibold tabular-nums">{menus.length}</p>
          </div>
          <div>
            <p className="text-muted-foreground">启用菜单</p>
            <p className="text-xl font-semibold tabular-nums">{countActiveMenus(menus)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">隐藏菜单</p>
            <p className="text-xl font-semibold tabular-nums">
              {menus.reduce((count, menu) => {
                const childHiddenCount = menu.children
                  ? menu.children.filter(c => !c.visible).length
                  : 0;
                return count + (!menu.visible ? 1 : 0) + childHiddenCount;
              }, 0)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 py-4">
          <Button onClick={() => setExpandedMenus(new Set(menus.map(m => m.id)))} variant="outline">
            全部展开
          </Button>
          <Button onClick={() => setExpandedMenus(new Set())} variant="outline">
            全部收起
          </Button>
        </div>
        {isLoading ? (
          <div className="py-6">
            <Loading size="md" variant="pulse" />
          </div>
        ) : filteredMenus.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <p>{searchValues.keyword || searchValues.type !== 'all' || searchValues.status !== 'all' ? '未找到匹配的菜单' : '暂无菜单'}</p>
            {canCreate('menu') && (
              <Button onClick={() => handleAdd()} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                创建第一个菜单
              </Button>
            )}
          </div>
        ) : (
          <TreeView
            data={filteredMenus}
            renderNode={(node) => (
              <MenuTreeNode
                node={node}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onAddChild={handleAdd}
                canCreate={canCreate('menu')}
                canUpdate={canUpdate('menu')}
                canDelete={canDelete('menu')}
              />
            )}
            onToggleExpand={toggleExpanded}
            expandedIds={expandedMenus}
          />
        )}
        </PageSurface>
      </PageWorkspace>

      {/* 菜单表单弹窗 */}
      <MenuFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        menu={editingMenu}
        onSuccess={fetchMenus}
      />

      {/* 确认删除对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        onConfirm={handleConfirmDelete}
        title="确认删除菜单"
        description={
          menuToDelete
            ? `确定要删除菜单 "${menuToDelete.name}" 吗？如果有子菜单也会一起删除。此操作无法撤销。`
            : ''
        }
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
      />
    </PageShell>
  );
}
