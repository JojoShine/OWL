'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Combobox } from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X } from 'lucide-react';

/**
 * 搜索字段组件 - 根据类型渲染不同的输入控件
 */
export function normalizeSelectValue(value, field = {}) {
  if (field.preserveAllValue) return value;
  return value === (field.allValue ?? 'all') ? (field.emptyValue ?? '') : value;
}

function SearchField({ field, value, onChange, variant = 'default' }) {
  const { type = 'text', name, label, placeholder, options = [] } = field;

  const handleChange = (newValue) => {
    onChange(name, newValue);
  };

  // 渲染标签
  const renderLabel = () => {
    if (!label) return null;
    return (
      <label className="text-sm font-medium mb-1.5 block">
        {label}
      </label>
    );
  };

  const controlClassName = variant === 'toolbar' ? 'h-9' : undefined;

  // 渲染不同类型的输入控件
  switch (type) {
    case 'text':
      return (
        <div className="flex-1 min-w-[200px]">
          {renderLabel()}
          <Input
            className={controlClassName}
            placeholder={placeholder || '请输入'}
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
          />
        </div>
      );

    case 'select':
      return (
        <div className="flex-shrink-0">
          {renderLabel()}
          <Select
            value={value || 'all'}
            onValueChange={(val) => handleChange(normalizeSelectValue(val, field))}
          >
            <SelectTrigger className={`w-[180px]${variant === 'toolbar' ? ' h-9' : ''}`}>
              <SelectValue placeholder={placeholder || '请选择'} />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem
                  key={option.value || 'all'}
                  value={option.value || 'all'}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case 'combobox':
      return (
        <div className="flex-shrink-0">
          {renderLabel()}
          <Combobox
            options={options}
            value={value || ''}
            onChange={handleChange}
            placeholder={placeholder || '请选择'}
            searchPlaceholder="搜索..."
            emptyText="未找到结果"
            className={controlClassName}
          />
        </div>
      );

    case 'date':
      return (
        <div className="flex-shrink-0">
          {renderLabel()}
          <DatePicker
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder || '选择日期'}
            className={controlClassName}
          />
        </div>
      );

    case 'dateRange':
      return (
        <div className="flex-1 min-w-[360px]">
          {renderLabel()}
          <div className="flex gap-2 items-center">
            <DatePicker
              value={value?.start}
              onChange={(e) => handleChange({ ...value, start: e.target.value })}
              placeholder="开始日期"
            />
            <span className="text-muted-foreground">-</span>
            <DatePicker
              value={value?.end}
              onChange={(e) => handleChange({ ...value, end: e.target.value })}
              placeholder="结束日期"
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

/**
 * 搜索过滤器容器组件 - 统一的搜索区域布局
 *
 * @param {Object} props
 * @param {Array} props.fields - 搜索字段配置数组
 * @param {Object} props.values - 搜索值对象
 * @param {Function} props.onChange - 值变化回调
 * @param {Function} props.onSearch - 搜索回调
 * @param {Function} props.onReset - 重置回调
 * @param {React.ReactNode} props.extra - 额外的按钮或内容（放在查询、重置按钮后面）
 *
 * @example
 * // 基础用法
 * const fields = [
 *   { type: 'text', name: 'keyword', placeholder: '搜索用户名、邮箱...' }
 * ];
 *
 * @example
 * // 带标签的多字段搜索
 * const fields = [
 *   { type: 'text', name: 'keyword', label: '关键词', placeholder: '搜索用户名、邮箱...' },
 *   { type: 'select', name: 'status', label: '状态', placeholder: '选择状态',
 *     options: [{ value: 'active', label: '启用' }, { value: 'inactive', label: '禁用' }] },
 *   { type: 'combobox', name: 'role', label: '角色', placeholder: '选择角色',
 *     options: [{ value: '1', label: '管理员' }, { value: '2', label: '普通用户' }] },
 *   { type: 'date', name: 'createdAt', label: '创建日期' },
 *   { type: 'dateRange', name: 'dateRange', label: '日期范围' }
 * ];
 */
export function SearchFilter({
  fields = [],
  values = {},
  onChange,
  onSearch,
  onReset,
  extra,
  rightActions,
  variant = 'default'
}) {
  const handleFieldChange = (name, value) => {
    onChange({
      ...values,
      [name]: value
    });
  };

  const handleKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (!['text', 'search', 'email', 'tel'].includes(target.type)) return;
    onSearch();
  };

  return (
    <div className="bg-card rounded-lg" data-variant={variant} onKeyDown={handleKeyDown}>
      <div className="flex flex-wrap items-end gap-2">
        {/* 渲染所有搜索字段 */}
        {fields.map((field) => (
          <SearchField
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={handleFieldChange}
            variant={variant}
          />
        ))}

        {/* 按钮区域 */}
        <div className="flex-shrink-0 flex gap-2">
          <Button onClick={onSearch} size={variant === 'toolbar' ? 'default' : 'lg'}>
            <Search className="h-4 w-4 mr-2" />
            查询
          </Button>
          <Button onClick={onReset} variant="outline" size={variant === 'toolbar' ? 'default' : 'lg'}>
            <X className="h-4 w-4 mr-2" />
            重置
          </Button>
          {extra}
        </div>
        {variant === 'toolbar' && rightActions ? (
          <div className="ml-auto flex items-center gap-2">{rightActions}</div>
        ) : null}
      </div>
    </div>
  );
}
