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
    };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  /**
   * 获取筛选字段（根据日志类型）
   */
  const getFilterFields = () => {
    const common = [
      {
        key: 'startDate',
        name: 'startDate',
        label: '开始日期',
        type: 'date',
      },
      {
        key: 'endDate',
        name: 'endDate',
        label: '结束日期',
        type: 'date',
      },
    ];

    const typeFields = {
      operation: [
        {
          key: 'userId',
          name: 'userId',
          label: '用户ID',
          type: 'text',
          placeholder: '输入用户ID',
        },
        {
          key: 'method',
          name: 'method',
          label: 'HTTP方法',
          type: 'select',
          options: [
            { value: '', label: '全部' },
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        },
        {
          key: 'url',
          name: 'url',
          label: 'URL',
          type: 'text',
          placeholder: '输入URL关键词',
        },
      ],
      login: [
        {
          key: 'username',
          name: 'username',
          label: '用户名',
          type: 'text',
          placeholder: '输入用户名',
        },
        {
          key: 'action',
          name: 'action',
          label: '操作',
          type: 'select',
          options: [
            { value: '', label: '全部' },
            { value: 'login', label: '登录' },
            { value: 'logout', label: '登出' },
          ],
        },
        {
          key: 'status',
          name: 'status',
          label: '状态',
          type: 'select',
          options: [
            { value: '', label: '全部' },
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
          label: 'HTTP方法',
          type: 'select',
          options: [
            { value: '', label: '全部' },
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        },
        {
          key: 'url',
          name: 'url',
          label: 'URL',
          type: 'text',
          placeholder: '输入URL关键词',
        },
      ],
      error: [],
      database: [
        {
          key: 'dbType',
          name: 'dbType',
          label: '数据库类型',
          type: 'select',
          options: [
            { value: '', label: '全部' },
            { value: 'redis', label: 'Redis' },
            { value: 'postgresql', label: 'PostgreSQL' },
          ],
        },
        {
          key: 'action',
          name: 'action',
          label: '操作类型',
          type: 'select',
          options: [
            { value: '', label: '全部' },
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
      values={localFilters}
      onChange={setLocalFilters}
      onSearch={handleApply}
      onReset={handleReset}
      variant="toolbar"
    />
  );
}
