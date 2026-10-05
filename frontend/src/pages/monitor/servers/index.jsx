
import { useState, useEffect, useCallback } from 'react';
import { serverMonitorApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Play, Activity, Server, RefreshCw } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import { SearchFilter } from '@/components/common/SearchFilter';
import { DataTable } from '@/components/common/DataTable';
import ServerFormDialog from './server-form-dialog';
import ServerLogsDialog from './server-logs-dialog';
import ServerServicesDialog from './server-services-dialog';
import {
  PageHeader,
  PageShell,
  PageSurface,
  PageToolbar,
  PageWorkspace,
} from '@/components/layout/page-shell';
import { useListQuery } from '@/lib/hooks/use-list-query';

export default function ServerMonitorPage() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { draftFilters: searchValues, setDraftFilters: setSearchValues, appliedFilters, pagination, setPagination, submit: handleSearch, reset: handleReset, setTotal } = useListQuery();
  
  // 对话框状态
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const [selectedServer, setSelectedServer] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [selectedServerForServices, setSelectedServerForServices] = useState(null);

  // 获取服务器列表
  const fetchServers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await serverMonitorApi.getAllServers({
        search: appliedFilters.keyword || '',
        page: pagination.page,
        limit: pagination.pageSize,
      });
      const serversData = response.data?.items || response.data?.servers || [];
      setServers(Array.isArray(serversData) ? serversData : []);

      // 更新分页信息
      if (response.data?.pagination) {
        setTotal(response.data.pagination.total || 0);
      }
    } catch (error) {
      console.error('获取服务器列表失败:', error);
      setServers([]);
      toast.error('加载服务器列表失败');
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters.keyword, pagination.page, pagination.pageSize, setTotal]);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  // 分页变化
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // 每页数量变化
  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  // 添加服务器
  const handleAdd = () => {
    setEditingServer(null);
    setFormDialogOpen(true);
  };

  // 编辑服务器
  const handleEdit = (server) => {
    setEditingServer(server);
    setFormDialogOpen(true);
  };

  // 删除服务器
  const handleDelete = (server) => {
    setServerToDelete(server);
    setConfirmDialogOpen(true);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!serverToDelete) return;

    try {
      await serverMonitorApi.deleteServer(serverToDelete.id);
      toast.success('删除成功');
      fetchServers();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error(error.response?.data?.message || '删除失败');
    } finally {
      setServerToDelete(null);
    }
  };

  // 立即检查（采集指标）
  const handleTriggerCheck = async (server) => {
    try {
      toast.loading('正在采集服务器指标...');
      await serverMonitorApi.triggerCheck(server.id);
      toast.dismiss();
      toast.success('指标采集成功，请刷新页面查看');
      await fetchServers();
    } catch (error) {
      toast.dismiss();
      console.error('采集指标失败:', error);
      toast.error(error.response?.data?.message || '采集失败');
    }
  };

  // 查看日志
  const handleViewLogs = (server) => {
    setSelectedServer(server);
    setLogsDialogOpen(true);
  };

  // 管理服务
  const handleManageServices = (server) => {
    setSelectedServerForServices(server);
    setServicesDialogOpen(true);
  };

  // 切换监控状态（乐观更新）
  const handleToggleMonitoring = async (server) => {
    const prevEnabled = server.enabled;
    // 先更新本地状态
    setServers(prev => prev.map(s => s.id === server.id ? { ...s, enabled: !prevEnabled } : s));
    
    try {
      await serverMonitorApi.toggleMonitoring(server.id);
      toast.success(!prevEnabled ? '已启动监控' : '已停止监控');
    } catch (error) {
      // 失败回滚
      setServers(prev => prev.map(s => s.id === server.id ? { ...s, enabled: prevEnabled } : s));
      console.error('切换状态失败:', error);
      toast.error(error.response?.data?.message || '操作失败');
    }
  };

  // 状态徽章
  const getStatusBadge = (status) => {
    const statusMap = {
      online: { label: '在线', variant: 'default' },
      offline: { label: '离线', variant: 'secondary' },
      warning: { label: '警告', variant: 'destructive' },
      unknown: { label: '未知', variant: 'outline' },
    };
    const config = statusMap[status] || statusMap.unknown;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // 搜索字段配置
  const searchFields = [
    {
      type: 'text',
      name: 'keyword',
      placeholder: '搜索服务器名称、IP地址...'
    }
  ];

  // 表格列配置
  const columns = [
    {
      key: 'name',
      label: '服务器名称',
      cellClassName: 'font-medium'
    },
    {
      key: 'ip_address',
      label: 'IP地址',
    },
    {
      key: 'services',
      label: '服务端口',
      render: (value, record) => {
        const ports = record.ports || [];
        if (ports.length === 0) {
          return (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleManageServices(record)}
              className="text-muted-foreground"
            >
              <Server className="h-4 w-4 mr-1" />
              <span className="text-xs">添加服务</span>
            </Button>
          );
        }

        return (
          <div
            className="flex flex-wrap gap-1 cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
            onClick={() => handleManageServices(record)}
          >
            {ports.slice(0, 3).map((port) => (
              <Badge
                key={port.id}
                variant={
                  port.last_check_status === 'open' ? 'default' :
                  port.last_check_status === 'closed' ? 'destructive' :
                  'secondary'
                }
                className="text-xs"
                title={`${port.port} - ${port.service_name || '未命名'} (${port.last_check_status === 'open' ? '畅通' : port.last_check_status === 'closed' ? '不通' : '待检测'})`}
              >
                {port.port}
              </Badge>
            ))}
            {ports.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{ports.length - 3}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'cpu_usage',
      label: 'CPU使用率',
      render: (value, record) => {
        const usage = record.last_metrics?.cpu_usage;
        const threshold = record.cpu_threshold;
        if (usage === null || usage === undefined) return '-';
        const isWarning = usage > threshold;
        return (
          <Badge variant={isWarning ? 'destructive' : 'secondary'}>
            {usage}%
          </Badge>
        );
      }
    },
    {
      key: 'memory_usage',
      label: '内存使用率',
      render: (value, record) => {
        const usage = record.last_metrics?.memory_usage;
        const threshold = record.memory_threshold;
        if (usage === null || usage === undefined) return '-';
        const isWarning = usage > threshold;
        return (
          <Badge variant={isWarning ? 'destructive' : 'secondary'}>
            {usage}%
          </Badge>
        );
      }
    },
    {
      key: 'disk_usage',
      label: '磁盘使用率',
      render: (value, record) => {
        const usage = record.last_metrics?.disk_usage;
        const threshold = record.disk_threshold;
        if (usage === null || usage === undefined) return '-';
        const isWarning = usage > threshold;
        return (
          <Badge variant={isWarning ? 'destructive' : 'secondary'}>
            {usage}%
          </Badge>
        );
      }
    },
    {
      key: 'status',
      label: '状态',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'last_check_at',
      label: '最后检查',
      render: (value) => value ? new Date(value).toLocaleString('zh-CN') : '-'
    },
    {
      key: 'enabled',
      label: '监控',
      render: (value, record) => (
        <Switch
          checked={value}
          onCheckedChange={() => handleToggleMonitoring(record)}
        />
      )
    }
  ];

  return (
    <PageShell>
      <PageHeader
        title="服务器监控"
        description="管理服务器监控配置与服务健康状态。"
        actions={<>
          <Button variant="outline" onClick={fetchServers} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button onClick={handleAdd} className="sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            添加服务器
          </Button>
        </>}
      />
      <PageWorkspace>
        <PageToolbar>
          <SearchFilter
            fields={searchFields}
            values={searchValues}
            onChange={setSearchValues}
            onSearch={handleSearch}
            onReset={handleReset}
            variant="toolbar"
          />
        </PageToolbar>
        <PageSurface className="p-0">
          <DataTable
            columns={columns}
            data={servers}
            loading={isLoading}
            actions={(row) => (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleManageServices(row)}
                  title="管理服务"
                  aria-label={`管理 ${row.name} 的服务`}
                >
                  <Server className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTriggerCheck(row)}
                  aria-label={`立即检查 ${row.name}`}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleViewLogs(row)}
                  aria-label={`查看 ${row.name} 的监控历史`}
                >
                  <Activity className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit(row)}
                  aria-label={`编辑 ${row.name}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(row)}
                  aria-label={`删除 ${row.name}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </>
            )}
            pagination={pagination}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </PageSurface>
      </PageWorkspace>

      {/* 添加/编辑对话框 */}
      <ServerFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        server={editingServer}
        onSuccess={fetchServers}
      />

      {/* 日志查看对话框 */}
      <ServerLogsDialog
        open={logsDialogOpen}
        onOpenChange={setLogsDialogOpen}
        server={selectedServer}
      />

      {/* 服务管理对话框 */}
      <ServerServicesDialog
        open={servicesDialogOpen}
        onOpenChange={setServicesDialogOpen}
        server={selectedServerForServices}
      />

      {/* 删除确认对话框 */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        title="确认删除"
        description={`确定要删除服务器 "${serverToDelete?.name}" 吗？此操作不可恢复。`}
        onConfirm={handleConfirmDelete}
        confirmText="删除"
        variant="destructive"
      />
    </PageShell>
  );
}
