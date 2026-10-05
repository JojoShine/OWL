import { useState, useEffect } from 'react';
import { SearchFilter } from '@/components/common/SearchFilter';

export default function LogFilters({ type, filters, onChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  // 同步外部 filters 到本地状态
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * 应用筛选
   */
  const handleApply = () => {
    onChange(localFilters);
  };

  /**
   * 重置筛选
   */
  const handleReset = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      userId: '',
      username: '',
      method: '',
      url: '',
      status: '',
      action: '',
      dbType: '',
      type: '',
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  const filterValues = {
    ...localFilters,
    dateRange: {
      start: localFilters.startDate || '',
      end: localFilters.endDate || '',
    },
  };

  const handleFilterValuesChange = (nextValues) => {
    const { dateRange, ...nextFilters } = nextValues;
    setLocalFilters({
      ...nextFilters,
      startDate: dateRange?.start || '',
      endDate: dateRange?.end || '',
    });
  };

  /**
   * 获取筛选字段（根据日志类型）
   */
  const getFilterFields = () => {
    const common = [
      {
        key: 'dateRange',
        name: 'dateRange',
        type: 'dateRange',
      },
    ];

    const typeFields = {
      operation: [
        {
          key: 'userId',
          name: 'userId',
          type: 'text',
          placeholder: '输入用户ID',
        },
        {
          key: 'method',
          name: 'method',
          type: 'select',
          placeholder: 'HTTP 方法',
          options: [
            { value: '', label: '全部方法' },
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        },
        {
          key: 'url',
          name: 'url',
          type: 'text',
          placeholder: '输入URL关键词',
        },
      ],
      login: [
        {
          key: 'username',
          name: 'username',
          type: 'text',
          placeholder: '输入用户名',
        },
        {
          key: 'action',
          name: 'action',
          type: 'select',
          placeholder: '操作',
          options: [
            { value: '', label: '全部操作' },
            { value: 'login', label: '登录' },
            { value: 'logout', label: '登出' },
          ],
        },
        {
          key: 'status',
          name: 'status',
          type: 'select',
          placeholder: '状态',
          options: [
            { value: '', label: '全部状态' },
            { value: 'success', label: '成功' },
            { value: 'failure', label: '失败' },
          ],
        },
      ],
      system: [],
      access: [
        {
          key: 'method',
          name: 'method',
          type: 'select',
          placeholder: 'HTTP 方法',
          options: [
            { value: '', label: '全部方法' },
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        },
        {
          key: 'url',
          name: 'url',
          type: 'text',
          placeholder: '输入URL关键词',
        },
      ],
      error: [],
      database: [
        {
          key: 'dbType',
          name: 'dbType',
          type: 'select',
          placeholder: '数据库类型',
          options: [
            { value: '', label: '全部数据库' },
            { value: 'redis', label: 'Redis' },
            { value: 'postgresql', label: 'PostgreSQL' },
          ],
        },
        {
          key: 'action',
          name: 'action',
          type: 'select',
          placeholder: '操作类型',
          options: [
            { value: '', label: '全部操作' },
            { value: 'set', label: 'SET' },
            { value: 'get', label: 'GET' },
            { value: 'del', label: 'DEL' },
            { value: 'query', label: 'QUERY' },
          ],
        },
      ],
    };

    return [...common, ...(typeFields[type] || [])];
  };

  const fields = getFilterFields();

  return (
    <SearchFilter
      fields={fields}
      values={filterValues}
      onChange={handleFilterValuesChange}
      onSearch={handleApply}
      onReset={handleReset}
      variant="toolbar"
    />
  );
}
