'use client';

import { formatDateTime } from '@/lib/utils/date';
import { maskByType } from '@/lib/utils/mask';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * 动态表格组件
 * 根据字段配置动态渲染表格列
 */
export function DynamicTable({
  data = [],
  fields = [],
  loading = false,
  onEdit,
  onDelete,
  onView, // 新增：查看回调
  selectedRows = [],
  onSelectRows,
  features = {},
}) {
  // 只显示在列表中的字段，并按顺序排序
  const listFields = fields
    .filter((f) => f.showInList)
    .sort((a, b) => (a.listSort || 0) - (b.listSort || 0));

  const handleSelectAll = (checked) => {
    if (checked) {
      onSelectRows?.(data.map((item) => item.id));
    } else {
      onSelectRows?.([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      onSelectRows?.([...selectedRows, id]);
    } else {
      onSelectRows?.(selectedRows.filter((rowId) => rowId !== id));
    }
  };

  const isRowSelected = (id) => selectedRows.includes(id);
  const isAllSelected = data.length > 0 && data.every((row) => selectedRows.includes(row.id));

  // 格式化字段值
  const formatFieldValue = (value, field) => {
    if (value === null || value === undefined) {
      return '-';
    }

    // ✨ 优先使用 codeMapping 配置
    if (field.codeMapping && field.codeMapping.type === 'enum') {
      const mapping = field.codeMapping.mappings?.[String(value)];
      if (mapping) {
        return (
          <Badge
            variant={mapping.variant || 'default'}
            style={mapping.color ? { backgroundColor: mapping.color } : undefined}
          >
            {mapping.label}
          </Badge>
        );
      }
    }

    switch (field.formatType) {
      case 'date':
        // 日期格式化（使用统一的日期工具函数）
        return formatDateTime(value);

      case 'money':
        // 金额格式化
        try {
          return `¥${parseFloat(value).toFixed(2)}`;
        } catch {
          return value;
        }

      case 'enum':
        // 枚举值映射(兼容旧配置)
        if (field.formatOptions?.enumMap) {
          const mapped = field.formatOptions.enumMap[value];
          if (mapped) {
            return (
              <Badge variant={mapped.variant || 'default'}>
                {mapped.label || value}
              </Badge>
            );
          }
        }
        return value;

      case 'boolean':
        // 布尔值显示
        return (
          <Badge variant={value ? 'default' : 'secondary'}>
            {value ? '是' : '否'}
          </Badge>
        );

      case 'mask':
        // 脱敏处理 - 兼容旧配置
        if (field.formatOptions?.maskType === 'phone') {
          return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
        }
        if (field.formatOptions?.maskType === 'email') {
          return value.replace(/(.{2}).*(@.*)/, '$1***$2');
        }
        return value;

      default:
        // 优先检查新的 displayRule 配置
        const displayRule = field.formatOptions?.displayRule;
        if (displayRule?.type === 'mask' && displayRule?.maskType) {
          return maskByType(value, displayRule.maskType);
        }

        // 自动检测 ISO 日期字符串并格式化为本地时间
        // 匹配格式如：2026-01-12T07:34:00.000Z 或 2026-01-12 07:34:00.000000 +00:00
        if (typeof value === 'string' && (
          value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) ||  // ISO 格式
          value.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)     // PostgreSQL 时间戳格式
        )) {
          try {
            return formatDateTime(value);
          } catch {
            // 如果格式化失败，继续执行下面的逻辑
          }
        }

        // 字符串截断
        if (typeof value === 'string' && value.length > 100) {
          return value.substring(0, 100) + '...';
        }

        // 处理对象类型（JSON等）
        if (typeof value === 'object') {
          try {
            return JSON.stringify(value);
          } catch {
            return String(value);
          }
        }

        return value;
    }
  };

  const columns = [
    ...(features.batchDelete ? [{
      key: '__selection',
      label: (
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={handleSelectAll}
          aria-label="全选"
        />
      ),
      width: 50,
      render: (_, row) => (
        <Checkbox
          checked={isRowSelected(row.id)}
          onCheckedChange={(checked) => handleSelectRow(row.id, checked)}
          aria-label={`选择行 ${row.id}`}
        />
      ),
    }] : []),
    ...listFields.map((field) => ({
      key: field.name,
      label: field.label,
      width: field.listWidth,
      headerClassName: field.listAlign === 'center'
        ? 'text-center'
        : field.listAlign === 'right' ? 'text-right' : undefined,
      cellClassName: field.listAlign === 'center'
        ? 'text-center'
        : field.listAlign === 'right' ? 'text-right' : undefined,
      render: (value) => formatFieldValue(value, field),
    })),
  ];

  const renderActions = (row) => (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => onView?.(row)} title="查看" aria-label={`查看 ${row.id}`}>
        <Eye className="h-4 w-4" />
      </Button>
      {features.update ? (
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit?.(row)} title="编辑" aria-label={`编辑 ${row.id}`}>
          <Edit className="h-4 w-4" />
        </Button>
      ) : null}
      {features.delete ? (
        <Button variant="ghost" size="icon-sm" onClick={() => onDelete?.(row)} title="删除" aria-label={`删除 ${row.id}`}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ) : null}
    </>
  );

  return (
    <DataTable
      variant="workspace"
      density="compact"
      columns={columns}
      data={data}
      loading={loading}
      actions={renderActions}
      emptyText="暂无数据"
    />
  );
}
