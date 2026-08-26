'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Layers, GripVertical } from 'lucide-react';

/**
 * 字段分组编辑器组件
 *
 * 功能：
 * 1. 根据SQL中的表comment自动分组
 * 2. 支持用户调整字段分组
 * 3. 配置字段在详情页的显示属性
 */
export default function FieldGroupEditor({
  fields = [],
  availableGroups = [],
  onChange
}) {
  const [fieldGroups, setFieldGroups] = useState(() => {
    // 初始化字段分组
    return fields.map((field) => ({
      ...field,
      field_group: field.field_group || field.fieldGroup || 'default',
      show_in_detail: field.show_in_detail !== false,
      detail_sort: field.detail_sort || 0,
      detail_label: field.detail_label || field.field_comment || field.fieldComment || field.field_name || field.fieldName,
    }));
  });

  /**
   * 更新字段的分组
   */
  const handleFieldGroupChange = (fieldIndex, newGroup) => {
    const newFields = [...fieldGroups];
    newFields[fieldIndex].field_group = newGroup;

    setFieldGroups(newFields);
    if (onChange) {
      onChange(newFields);
    }
  };

  /**
   * 更新字段是否在详情页显示
   */
  const handleShowInDetailChange = (fieldIndex, showInDetail) => {
    const newFields = [...fieldGroups];
    newFields[fieldIndex].show_in_detail = showInDetail;

    setFieldGroups(newFields);
    if (onChange) {
      onChange(newFields);
    }
  };

  /**
   * 更新字段详情页标签
   */
  const handleDetailLabelChange = (fieldIndex, label) => {
    const newFields = [...fieldGroups];
    newFields[fieldIndex].detail_label = label;

    setFieldGroups(newFields);
    if (onChange) {
      onChange(newFields);
    }
  };

  /**
   * 更新字段详情页排序
   */
  const handleDetailSortChange = (fieldIndex, sort) => {
    const newFields = [...fieldGroups];
    newFields[fieldIndex].detail_sort = parseInt(sort) || 0;

    setFieldGroups(newFields);
    if (onChange) {
      onChange(newFields);
    }
  };

  /**
   * 获取分组的字段列表
   */
  const getFieldsByGroup = (groupValue) => {
    return fieldGroups
      .map((field, index) => ({ ...field, originalIndex: index }))
      .filter((field) => field.field_group === groupValue)
      .sort((a, b) => a.detail_sort - b.detail_sort);
  };

  /**
   * 获取已使用的分组
   */
  const getUsedGroups = () => {
    const usedGroupKeys = [...new Set(fieldGroups.map((f) => f.field_group))];

    return usedGroupKeys
      .map((key) => {
        const found = availableGroups.find((g) => g.value === key);
        return found || { value: key, label: key };
      })
      .sort((a, b) => {
        if (a.value === 'default') return -1;
        if (b.value === 'default') return 1;
        return a.label.localeCompare(b.label);
      });
  };

  if (!fieldGroups || fieldGroups.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20">
        <CardContent>
          <EmptyState icon={Layers} title="暂无字段数据" description="请先生成字段配置" />
        </CardContent>
      </Card>
    );
  }

  const usedGroups = getUsedGroups();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layers className="h-5 w-5" />
          字段分组配置
        </CardTitle>
        {availableGroups.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">
            已从SQL中提取 {availableGroups.length} 个表的注释作为分组选项
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 分组预览 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">分组预览</h3>
          <div className="grid gap-4">
            {usedGroups.map((group) => {
              const groupFields = getFieldsByGroup(group.value);
              if (groupFields.length === 0) return null;

              return (
                <Card key={group.value} className="border-l-4 border-l-primary/40">
                  <CardHeader className="py-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{group.label}</h4>
                      <Badge variant="outline">{groupFields.length} 个字段</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="space-y-2">
                      {groupFields.map((field) => (
                        <div
                          key={field.originalIndex}
                          className="flex items-center gap-3 rounded border bg-muted/30 p-2 hover:bg-muted/60"
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {field.detail_label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {field.fieldName || field.field_name} ({field.fieldType || field.field_type})
                            </p>
                          </div>
                          <Badge variant={field.show_in_detail ? 'default' : 'secondary'}>
                            {field.show_in_detail ? '显示' : '隐藏'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">排序: {field.detail_sort}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* 字段配置列表 */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">字段详细配置</h3>
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">字段名</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">所属分组</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">详情页标签</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">显示</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">排序</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {fieldGroups.map((field, index) => (
                  <tr key={index} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{field.fieldName || field.field_name}</p>
                        <p className="text-xs text-muted-foreground">{field.fieldComment || field.field_comment}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={field.field_group}
                        onValueChange={(value) => handleFieldGroupChange(index, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableGroups.map((group) => (
                            <SelectItem key={group.value} value={group.value}>
                              {group.label}
                              {group.tableName && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  ({group.tableName})
                                </span>
                              )}
                            </SelectItem>
                          ))}
                          {availableGroups.length === 0 && (
                            <SelectItem value="default">默认分组</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        value={field.detail_label || ''}
                        onChange={(e) => handleDetailLabelChange(index, e.target.value)}
                        className="w-[150px]"
                        placeholder="自定义标签"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={field.show_in_detail}
                        onChange={(e) => handleShowInDetailChange(index, e.target.checked)}
                        className="h-4 w-4 rounded border-input accent-primary"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        value={field.detail_sort || 0}
                        onChange={(e) => handleDetailSortChange(index, e.target.value)}
                        className="w-[80px]"
                        min="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
