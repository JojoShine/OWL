
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';

/**
 * 菜单树节点渲染器
 */
export function MenuTreeNode({
  node,
  onEdit,
  onDelete,
  onAddChild,
  canCreate = true,
  canUpdate = true,
  canDelete = true
}) {
  const getTypeBadge = (type) => {
    const typeMap = {
      menu: { label: '菜单', variant: 'default' },
      button: { label: '按钮', variant: 'secondary' },
      link: { label: '链接', variant: 'outline' },
    };
    const config = typeMap[type] || typeMap.menu;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '启用', variant: 'default' },
      inactive: { label: '禁用', variant: 'secondary' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      {/* 节点信息 */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{node.name}</span>
          {getTypeBadge(node.type)}
          {getStatusBadge(node.status)}
          {!node.visible && <Badge variant="outline">隐藏</Badge>}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {node.path && (
            <code className="bg-muted px-2 py-0.5 rounded text-xs">{node.path}</code>
          )}
          {node.icon && <span>图标: {node.icon}</span>}
          {node.permission_code && (
            <span>权限: {node.permission_code}</span>
          )}
          <span>排序: {node.sort}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddChild(node)}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加子菜单
          </Button>
        )}
        {canUpdate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * 部门树节点渲染器
 */
export function DepartmentTreeNode({
  node,
  onEdit,
  onDelete,
  onAddChild,
  canCreate = true,
  canUpdate = true,
  canDelete = true
}) {
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '启用', variant: 'default' },
      inactive: { label: '禁用', variant: 'secondary' },
    };
    const config = statusMap[status] || statusMap.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <>
      {/* 节点信息 */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{node.name}</span>
          {getStatusBadge(node.status)}
          {node.code && (
            <code className="bg-muted px-2 py-0.5 rounded text-xs">{node.code}</code>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          {node.leader && (
            <span>负责人: {node.leader.real_name || node.leader.username}</span>
          )}
          {node.description && (
            <span className="max-w-md truncate">{node.description}</span>
          )}
          <span>排序: {node.sort}</span>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {canCreate && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddChild(node)}
          >
            <Plus className="h-3 w-3 mr-1" />
            添加子部门
          </Button>
        )}
        {canUpdate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </>
  );
}
