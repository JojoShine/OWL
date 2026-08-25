'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LogTable from '@/components/logs/LogTable';
import LogFilters from '@/components/logs/LogFilters';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, PageShell, PageToolbar } from '@/components/layout/page-shell';

const TAB_CONFIGS = [
  {
    value: 'operation',
    label: '操作日志',
    description: '记录系统内关键操作行为',
    icon: ActivityIcon,
  },
  {
    value: 'login',
    label: '登录日志',
    description: '追踪用户登录与登出情况',
    icon: UserCheckIcon,
  },
  {
    value: 'system',
    label: '系统日志',
    description: '查看应用运行时系统日志',
    icon: FileTextIcon,
  },
  {
    value: 'access',
    label: '访问日志',
    description: '分析接口访问请求记录',
    icon: FileTextIcon,
  },
  {
    value: 'error',
    label: '错误日志',
    description: '排查错误与异常堆栈',
    icon: AlertTriangleIcon,
  },
  {
    value: 'database',
    label: '数据库日志',
    description: '监控 Redis 和 PostgreSQL 访问',
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

  /**
   * 加载日志
   */
  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      // 清除之前的展示
      setLogs([]);

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

      const data = response.data || {};
      setLogs(data.logs || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.totalPages || 0,
      }));
    } catch (error) {
      console.error('Failed to load logs:', error);
      toast.error('加载日志失败');
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit, filters]);

  /**
   * 加载统计数据
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await logApi.getLogStats({ type: activeTab });
      setStats(response.data || null);
    } catch (error) {
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
    setPagination(prev => ({ ...prev, page: 1 }));
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
      <PageHeader title="日志中心" description="检索、审阅并导出系统各类审计日志。" />
      {/* 日志列表 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setPagination(prev => ({ ...prev, page: 1 }));
        }}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mb-6 flex flex-wrap gap-2">
          {TAB_CONFIGS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.value} value={tab.value} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {TAB_CONFIGS.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsContent key={tab.value} value={tab.value} className="flex-1">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle>{tab.label}</CardTitle>
                        <CardDescription>{tab.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {tab.value === activeTab && stats && (
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground">
                          <FileTextIcon className="h-4 w-4" />
                          <span>{stats.total || 0} 条记录</span>
                        </div>
                      )}
                      <Button
                        onClick={handleRefresh}
                        variant="outline"
                        className="flex items-center"
                      >
                        <RefreshCwIcon className={`mr-2 h-4 w-4 ${loading && tab.value === activeTab ? 'animate-spin' : ''}`} />
                        刷新
                      </Button>
                      <Button onClick={() => handleExport('csv')} variant="outline" className="flex items-center">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        导出 CSV
                      </Button>
                      <Button onClick={() => handleExport('json')} variant="outline" className="flex items-center">
                        <DownloadIcon className="mr-2 h-4 w-4" />
                        导出 JSON
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <PageToolbar className="border-0 bg-muted/30 p-4">
                    <LogFilters
                      type={tab.value}
                      filters={filters}
                      onChange={handleFiltersChange}
                    />
                  </PageToolbar>
                  <LogTable
                    type={tab.value}
                    logs={tab.value === activeTab ? logs : []}
                    loading={tab.value === activeTab ? loading : false}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </PageShell>
  );
}
