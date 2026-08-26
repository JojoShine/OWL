'use client';

import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogFilters from '@/components/logs/LogFilters';
import LogTable from '@/components/logs/LogTable';
import { logApi } from '@/lib/api/system/log.api';
import { toast } from 'sonner';
import { PageHeader, PageShell, PageSurface, PageToolbar, PageWorkspace } from '@/components/layout/page-shell';

const LOG_TYPES = [
  { value: 'operation', label: '操作日志' },
  { value: 'login', label: '登录日志' },
  { value: 'system', label: '系统日志' },
  { value: 'access', label: '访问日志' },
  { value: 'error', label: '错误日志' },
  { value: 'database', label: '数据库日志' },
];

export default function LogsPage() {
  const [activeTab, setActiveTab] = useState('operation');
  const [tableType, setTableType] = useState('operation');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    userId: '',
    username: '',
    method: '',
    url: '',
    status: '',
    action: '',
    type: '',
  });
  const latestRequestId = useRef(0);
  const currentLimitRef = useRef(pagination.limit);
  const skipNextPageResetRef = useRef(false);

  // 加载日志
  const loadLogs = async (page = 1, nextFilters = filters, nextLimit = pagination.limit) => {
    const requestId = ++latestRequestId.current;
    setLoading(true);
    try {
      let response;
      const params = {
        page,
        limit: nextLimit,
        ...nextFilters,
      };

      switch (activeTab) {
        case 'operation':
          response = await logApi.getOperationLogs(params);
          break;
        case 'login':
          response = await logApi.getLoginLogs(params);
          break;
        case 'system':
          response = await logApi.getSystemLogs(params);
          break;
        case 'access':
          response = await logApi.getAccessLogs(params);
          break;
        case 'error':
          response = await logApi.getErrorLogs(params);
          break;
        case 'database':
          response = await logApi.getDatabaseAccessLogs(params);
          break;
        default:
          response = await logApi.getOperationLogs(params);
      }

      if (requestId !== latestRequestId.current) return;
      if (response.data?.success) {
        setTableType(activeTab);
        setLogs(response.data.data.logs || []);
        currentLimitRef.current = response.data.data.limit;
        setPagination({
          page: response.data.data.page,
          limit: response.data.data.limit,
          total: response.data.data.total,
          totalPages: response.data.data.totalPages,
        });
      } else {
        toast.error(response.data?.message || '获取日志失败');
      }
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('Failed to load logs:', error);
      setTableType(activeTab);
      setLogs([]);
      toast.error(error.response?.data?.message || '获取日志失败');
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  };

  // 当tab或filters变化时重新加载
  useEffect(() => {
    loadLogs(1);
  }, [activeTab]);

  // 处理筛选
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    loadLogs(1, newFilters);
  };

  // 处理分页
  const handlePageChange = (page) => {
    if (skipNextPageResetRef.current && page === 1) {
      skipNextPageResetRef.current = false;
      return;
    }
    skipNextPageResetRef.current = false;
    setPagination(prev => ({ ...prev, page }));
    loadLogs(page, filters, currentLimitRef.current);
  };

  const handlePageSizeChange = (pageSize) => {
    skipNextPageResetRef.current = true;
    currentLimitRef.current = pageSize;
    setPagination(prev => ({ ...prev, page: 1, limit: pageSize }));
    loadLogs(1, filters, pageSize);
  };

  return (
    <PageShell>
      <PageHeader
        title="系统日志"
        description="查询系统操作和运行记录。"
        meta={<span className="text-sm text-muted-foreground">共 {pagination.total} 条记录</span>}
      />
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 sm:w-fit">
          {LOG_TYPES.map((type) => (
            <TabsTrigger key={type.value} value={type.value} className="flex-none px-3">
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <PageWorkspace>
          <PageToolbar>
            <LogFilters
              type={activeTab}
              filters={filters}
              onChange={handleFilterChange}
            />
          </PageToolbar>
          <PageSurface className="p-0">
            <LogTable
              type={tableType}
              logs={logs}
              loading={loading}
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </PageSurface>
        </PageWorkspace>
      </Tabs>
    </PageShell>
  );
}
