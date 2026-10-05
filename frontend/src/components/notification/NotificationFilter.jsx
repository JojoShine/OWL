
import { useState, useEffect } from 'react';
import { SearchFilter } from '@/components/common/SearchFilter';

const readStatusOptions = [
  { value: 'all', label: '全部状态' },
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
    <SearchFilter
      fields={[
        {
          type: 'select',
          name: 'readStatus',
          placeholder: '阅读状态',
          preserveAllValue: true,
          options: readStatusOptions,
        },
        {
          type: 'select',
          name: 'type',
          placeholder: '通知类型',
          preserveAllValue: true,
          options: typeOptions,
        },
      ]}
      values={localFilters}
      onChange={setLocalFilters}
      onSearch={handleApply}
      onReset={handleReset}
      variant="toolbar"
    />
  );
}
