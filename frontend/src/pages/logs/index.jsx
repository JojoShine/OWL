
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileTextIcon,
  UserCheckIcon,
  ActivityIcon,
  AlertTriangleIcon,
  DownloadIcon,
  RefreshCwIcon,
  DatabaseIcon,
} from 'lucide-react';
import { logApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogTable from '@/components/logs/LogTable';
import LogFilters from '@/components/logs/LogFilters';
import {
  PageHeader,
  PageShell,
  PageSurface,
  PageToolbar,
  PageWorkspace,
} from '@/components/layout/page-shell';

const TAB_CONFIGS = [
  {
    value: 'operation',
    label: '操作日志',
    icon: ActivityIcon,
  },
  {
    value: 'login',
    label: '登录日志',
    icon: UserCheckIcon,
  },
  {
    value: 'system',
    label: '系统日志',
    icon: FileTextIcon,
  },
  {
    value: 'access',
    label: '访问日志',
    icon: FileTextIcon,
  },
  {
    value: 'error',
    label: '错误日志',
    icon: AlertTriangleIcon,
  },
  {
    value: 'database',
    label: '数据库日志',
    icon: DatabaseIcon,
  },
];

export default function LogsPage() {
  // 计算默认日期范围（最近7天）
  const getDefaultDateRange = () => {
    const now = new Date();
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const startDate = `${sevenDaysAgo.getFullYear()}-${String(sevenDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(sevenDaysAgo.getDate()).padStart(2, '0')}`;

    return { startDate, endDate };
  };

  // 状态管理
  const [activeTab, setActiveTab] = useState('operation'); // operation | login | system | access | error
  const [tableType, setTableType] = useState('operation');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    ...getDefaultDateRange(),
    userId: '',
    username: '',
    method: '',
    url: '',
    status: '',
    action: '',
  });
  const [stats, setStats] = useState(null);
  const latestRequestId = useRef(0);
  const latestStatsRequestId = useRef(0);

  /**
   * 加载日志
   */
  const loadLogs = useCallback(async () => {
    const requestId = ++latestRequestId.current;
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      let response;
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
          return;
      }

      if (requestId !== latestRequestId.current) return;
      const data = response.data || {};
      setTableType(activeTab);
      setLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      if (requestId !== latestRequestId.current) return;
      console.error('Failed to load logs:', error);
      setTableType(activeTab);
      setLogs([]);
      toast.error('加载日志失败');
    } finally {
      if (requestId === latestRequestId.current) setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, filters]);

  /**
   * 加载统计数据
   */
  const loadStats = useCallback(async () => {
    const requestId = ++latestStatsRequestId.current;
    try {
      const response = await logApi.getLogStats({ type: activeTab });
      if (requestId !== latestStatsRequestId.current) return;
      setStats(response.data || null);
    } catch (error) {
      if (requestId !== latestStatsRequestId.current) return;
      console.error('Failed to load stats:', error);
    }
  }, [activeTab]);

  // 初始化：加载日志
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // 加载统计数据
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  /**
   * 刷新日志
   */
  const handleRefresh = () => {
    if (pagination.page === 1) {
      loadLogs();
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
    loadStats();
  };

  /**
   * 导出日志
   */
  const handleExport = async (format = 'csv') => {
    try {
      const response = await logApi.exportLogs({
        type: activeTab,
        format,
        ...filters,
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `logs-${activeTab}-${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('日志导出成功');
    } catch (error) {
      console.error('Failed to export logs:', error);
      toast.error('日志导出失败');
    }
  };

  /**
   * 处理筛选条件变化
   */
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  /**
   * 处理分页变化
   */
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  /**
   * 处理每页条数变化
   */
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, limit: newPageSize, page: 1 }));
  };

  return (
    <PageShell>
      <PageHeader
        title="日志中心"
        description="检索、审阅并导出系统各类审计日志。"
        meta={stats ? <span className="text-sm text-muted-foreground">共 {stats.total || 0} 条记录</span> : null}
        actions={(
          <>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCwIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button onClick={() => handleExport('csv')} variant="outline">
              <DownloadIcon className="h-4 w-4" />
              导出 CSV
            </Button>
            <Button onClick={() => handleExport('json')} variant="outline">
              <DownloadIcon className="h-4 w-4" />
              导出 JSON
            </Button>
          </>
        )}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
        className="flex-1 gap-4"
      >
        <TabsList wrap>
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value}>
                <Icon className="h-4 w-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>
        <PageWorkspace>
          <PageToolbar>
            <LogFilters
              type={activeTab}
              filters={filters}
              onChange={handleFiltersChange}
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
