'use client';

import { useState, useEffect } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const readStatusOptions = [
  { value: 'all', label: '全部' },
  { value: 'unread', label: '未读' },
  { value: 'read', label: '已读' },
];

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'info', label: '信息' },
  { value: 'system', label: '系统' },
  { value: 'warning', label: '警告' },
  { value: 'error', label: '错误' },
  { value: 'success', label: '成功' },
];

export default function NotificationFilter({ filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // 同步外部 filters 到本地状态
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // 处理筛选变化
  const handleChange = (key, value) => {
    setLocalFilters({ ...localFilters, [key]: value });
  };

  // 应用筛选
  const handleApply = () => {
    onChange(localFilters);
  };

  // 重置筛选
  const handleReset = () => {
    const resetFilters = {
      readStatus: 'all',
      type: 'all',
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  return (
    <div>
      <div className="flex flex-wrap items-end gap-4">
        {/* 阅读状态 */}
        <div className="flex-shrink-0">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            阅读状态
          </label>
          <Select
            value={localFilters.readStatus || 'all'}
            onValueChange={(value) => handleChange('readStatus', value)}
          >
            <SelectTrigger className="w-auto min-w-[140px]">
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              {readStatusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 通知类型 */}
        <div className="flex-shrink-0">
          <label className="text-sm font-medium text-foreground mb-1.5 block">
            通知类型
          </label>
          <Select
            value={localFilters.type || 'all'}
            onValueChange={(value) => handleChange('type', value)}
          >
            <SelectTrigger className="w-auto min-w-[140px]">
              <SelectValue placeholder="选择类型" />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex-shrink-0 flex gap-2">
          <Button onClick={handleApply}>
            <SearchIcon className="w-4 h-4 mr-2" />
            查询
          </Button>
          <Button onClick={handleReset} variant="outline">
            <XIcon className="w-4 h-4 mr-2" />
            重置
          </Button>
        </div>
      </div>
    </div>
  );
}
