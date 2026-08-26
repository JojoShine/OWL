/**
 * Zabbix监控数据展示页面
 * 模块归属：Zabbix集成模块
 * 使用场景：展示Zabbix同步的主机列表、实时监控项、告警信息
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { zabbixApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/common/DataTable';
import { SearchFilter } from '@/components/common/SearchFilter';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Server, RefreshCw, AlertTriangle, Activity, Eye,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, PageShell, PageToolbar } from '@/components/layout/page-shell';

// 严重级别映射
const SEVERITY_MAP = {
  0: { label: '未分类', color: 'bg-muted-foreground', text: 'text-muted-foreground' },
  1: { label: '信息', color: 'bg-blue-500', text: 'text-blue-500' },
  2: { label: '警告', color: 'bg-yellow-500', text: 'text-yellow-500' },
  3: { label: '一般严重', color: 'bg-orange-500', text: 'text-orange-500' },
  4: { label: '高严重', color: 'bg-red-500', text: 'text-red-500' },
  5: { label: '灾难', color: 'bg-purple-600', text: 'text-purple-600' },
};

// 主机状态映射
const HOST_STATUS_MAP = {
  available: { label: '可用', variant: 'success' },
  unavailable: { label: '不可用', variant: 'destructive' },
  unknown: { label: '未知', variant: 'outline' },
};

export default function ZabbixMonitorPage() {
  // 实例选择
  const [instances, setInstances] = useState([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState('');

  // 主机列表
  const [hosts, setHosts] = useState([]);
  const [hostsLoading, setHostsLoading] = useState(false);
  const [hostsPagination, setHostsPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [hostSearch, setHostSearch] = useState({});

  // 告警列表
  const [problems, setProblems] = useState([]);
  const [problemsLoading, setProblemsLoading] = useState(false);

  // 主机详情弹窗
  const [hostDetailOpen, setHostDetailOpen] = useState(false);
  const [hostDetail, setHostDetail] = useState(null);
  const [hostDetailLoading, setHostDetailLoading] = useState(false);

  // 加载实例列表
  useEffect(() => {
    const loadInstances = async () => {
      try {
        const response = await zabbixApi.getInstances({ status: 'active', pageSize: 100 });
        const data = response.data?.items || response.data || [];
        const list = Array.isArray(data) ? data : [];
        setInstances(list);
        if (list.length > 0 && !selectedInstanceId) {
          setSelectedInstanceId(list[0].id);
        }
      } catch (error) {
        console.error('加载Zabbix实例失败:', error);
      }
    };
    loadInstances();
  }, []);

  // 加载主机列表
  const loadHosts = useCallback(async () => {
    if (!selectedInstanceId) return;
    try {
      setHostsLoading(true);
      const response = await zabbixApi.getHosts(selectedInstanceId, {
        name: hostSearch.keyword || '',
        page: hostsPagination.page,
        pageSize: hostsPagination.pageSize,
      });
      const data = response.data?.items || response.data || [];
      setHosts(Array.isArray(data) ? data : []);
      if (response.data?.pagination) {
        setHostsPagination(prev => ({
          ...prev,
          total: response.data.pagination.total || 0,
        }));
      }
    } catch (error) {
      console.error('加载主机列表失败:', error);
    } finally {
      setHostsLoading(false);
    }
  }, [selectedInstanceId, hostsPagination.page, hostsPagination.pageSize, hostSearch]);

  // 加载告警列表
  const loadProblems = useCallback(async () => {
    if (!selectedInstanceId) return;
    try {
      setProblemsLoading(true);
      const response = await zabbixApi.getProblems(selectedInstanceId, { limit: 20 });
      const data = response.data || [];
      setProblems(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('加载告警列表失败:', error);
    } finally {
      setProblemsLoading(false);
    }
  }, [selectedInstanceId]);

  // 实例变化时重新加载
  useEffect(() => {
    if (selectedInstanceId) {
      loadHosts();
      loadProblems();
    }
  }, [selectedInstanceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 搜索主机
  const handleHostSearch = () => {
    setHostsPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => loadHosts(), 0);
  };

  const handleHostReset = () => {
    setHostSearch({});
    setHostsPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => loadHosts(), 0);
  };

  // 查看主机详情
  const handleViewHost = async (host) => {
    setHostDetailOpen(true);
    setHostDetailLoading(true);
    try {
      const response = await zabbixApi.getHostDetail(selectedInstanceId, host.zabbix_hostid);
      setHostDetail(response.data);
    } catch (error) {
      toast.error('获取主机详情失败');
      setHostDetail(null);
    } finally {
      setHostDetailLoading(false);
    }
  };

  // 刷新所有数据
  const handleRefresh = () => {
    loadHosts();
    loadProblems();
  };

  // 搜索字段配置
  const searchFields = [
    { type: 'text', name: 'keyword', placeholder: '搜索主机名称...' },
  ];

  // 主机表格列
  const hostColumns = [
    { key: 'name', label: '主机名称', cellClassName: 'font-medium' },
    { key: 'host', label: '技术名称', cellClassName: 'text-sm text-muted-foreground' },
    {
      key: 'ip_address',
      label: 'IP地址',
      render: (value) => value ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{value}</code> : '-',
    },
    {
      key: 'status',
      label: '状态',
      render: (value) => {
        const config = HOST_STATUS_MAP[value] || HOST_STATUS_MAP.unknown;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'groups',
      label: '主机组',
      render: (value) => {
        if (!value || value.length === 0) return '-';
        return (
          <div className="flex flex-wrap gap-1">
            {value.slice(0, 3).map((g, i) => (
              <Badge key={i} variant="outline" className="text-xs">{g}</Badge>
            ))}
            {value.length > 3 && <span className="text-xs text-muted-foreground">+{value.length - 3}</span>}
          </div>
        );
      },
    },
    {
      key: 'last_sync_at',
      label: '同步时间',
      cellClassName: 'tabular-data',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-',
    },
  ];

  const selectedInstance = instances.find(i => i.id === selectedInstanceId);

  return (
    <PageShell>
      {/* 顶部：实例选择 + 刷新 */}
      <PageHeader
        title="Zabbix 监控概览"
        description={selectedInstance ? `实例：${selectedInstance.name}` : '查看同步主机、监控项与实时告警。'}
        meta={selectedInstance?.last_sync_at ? (
          <span className="tabular-data text-xs text-muted-foreground">
            最后同步：{new Date(selectedInstance.last_sync_at).toLocaleString('zh-CN')}
          </span>
        ) : null}
        actions={<>
            <Select value={selectedInstanceId} onValueChange={setSelectedInstanceId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="选择实例" />
              </SelectTrigger>
              <SelectContent>
                {instances.map(inst => (
                  <SelectItem key={inst.id} value={inst.id}>{inst.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              刷新
            </Button>
        </>}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">监控主机</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="tabular-data text-2xl font-semibold">{hostsPagination.total}</div>
            <p className="text-xs text-muted-foreground mt-1">已同步主机数量</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">当前告警</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="tabular-data text-2xl font-semibold">{problems.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {problems.filter(p => parseInt(p.severity) >= 3).length} 个高严重级别
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">可用主机</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="tabular-data text-2xl font-semibold">
              {hosts.filter(h => h.status === 'available').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              / {hosts.length} 台在线
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 主机列表 + 告警面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 主机列表 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>主机列表</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <PageToolbar className="border-0 bg-muted/30 p-4">
                <SearchFilter
                  fields={searchFields}
                  values={hostSearch}
                  onChange={setHostSearch}
                  onSearch={handleHostSearch}
                  onReset={handleHostReset}
                  variant="toolbar"
                />
              </PageToolbar>
              <DataTable
                columns={hostColumns}
                data={hosts}
                loading={hostsLoading}
                pagination={hostsPagination}
                onPageChange={(page) => setHostsPagination(prev => ({ ...prev, page }))}
                onPageSizeChange={(pageSize) => setHostsPagination(prev => ({ ...prev, pageSize, page: 1 }))}
                actions={(row) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewHost(row)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    详情
                  </Button>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* 告警面板 */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                最近告警
              </CardTitle>
            </CardHeader>
            <CardContent>
              {problemsLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">加载中...</div>
              ) : problems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">暂无告警</div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {problems.map((problem) => {
                    const severity = SEVERITY_MAP[problem.severity] || SEVERITY_MAP[0];
                    return (
                      <div
                        key={problem.eventid}
                        className="rounded-lg border p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium leading-tight line-clamp-2">
                            {problem.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`shrink-0 text-xs ${severity.text} border-current`}
                          >
                            {severity.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{problem.hosts?.[0]?.name || '-'}</span>
                          <span>
                            {problem.clock
                              ? new Date(problem.clock * 1000).toLocaleString('zh-CN')
                              : '-'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 主机详情弹窗 */}
      <Dialog open={hostDetailOpen} onOpenChange={setHostDetailOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              主机详情：{hostDetail?.host?.name || '加载中...'}
            </DialogTitle>
            <DialogDescription>
              {hostDetail?.host?.host || ''}
              {hostDetail?.host?.interfaces?.[0]?.ip && (
                <span className="ml-2">
                  IP: {hostDetail.host.interfaces[0].ip}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {hostDetailLoading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : hostDetail ? (
            <div className="space-y-4">
              {/* 主机组 */}
              {hostDetail.host.groups && hostDetail.host.groups.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">主机组</h4>
                  <div className="flex flex-wrap gap-1">
                    {hostDetail.host.groups.map(g => (
                      <Badge key={g.groupid} variant="outline">{g.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 监控项列表 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  监控项 ({hostDetail.items?.length || 0})
                </h4>
                {hostDetail.items && hostDetail.items.length > 0 ? (
                  <div className="rounded-lg border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-2 font-medium">名称</th>
                          <th className="text-left p-2 font-medium">Key</th>
                          <th className="text-right p-2 font-medium">最新值</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hostDetail.items.map(item => (
                          <tr key={item.itemid} className="border-b last:border-0">
                            <td className="p-2">{item.name}</td>
                            <td className="p-2 text-muted-foreground">
                              <code className="text-xs">{item.key_}</code>
                            </td>
                            <td className="p-2 text-right font-medium">
                              {item.lastvalue}{item.units ? ` ${item.units}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">暂无监控项</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
