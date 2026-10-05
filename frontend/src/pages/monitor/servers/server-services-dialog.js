
import { useCallback, useState, useEffect } from 'react';
import { serverMonitorApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';

export default function ServerServicesDialog({ open, onOpenChange, server }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newService, setNewService] = useState({
    port: '',
    service_name: '',
    protocol: 'tcp',
    enabled: true,
  });

  // 加载服务列表
  const fetchServices = useCallback(async () => {
    if (!server || !open) return;

    try {
      setLoading(true);
      const response = await serverMonitorApi.getServerById(server.id);
      const ports = response.data?.ports || [];
      setServices(ports);
    } catch (error) {
      console.error('加载服务列表失败:', error);
      toast.error('加载服务列表失败');
    } finally {
      setLoading(false);
    }
  }, [open, server]);

  useEffect(() => {
    if (open && server) {
      fetchServices();
    }
  }, [fetchServices, open, server]);

  // 添加服务
  const handleAddService = async () => {
    if (!newService.port) {
      toast.error('请填写端口号');
      return;
    }

    try {
      await serverMonitorApi.addPort(server.id, newService);
      toast.success('添加成功');
      setShowAddForm(false);
      setNewService({ port: '', service_name: '', protocol: 'tcp', enabled: true });
      fetchServices();
    } catch (error) {
      console.error('添加失败:', error);
      toast.error(error.response?.data?.message || '添加失败');
    }
  };

  // 删除服务
  const handleDeleteService = async (portId) => {
    try {
      await serverMonitorApi.deletePort(portId);
      toast.success('删除成功');
      fetchServices();
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  // 切换服务状态
  const handleToggleService = async (port) => {
    const prevEnabled = port.enabled;
    setServices(prev => prev.map(p => p.id === port.id ? { ...p, enabled: !prevEnabled } : p));

    try {
      await serverMonitorApi.updatePort(port.id, { enabled: !prevEnabled });
    } catch (error) {
      setServices(prev => prev.map(p => p.id === port.id ? { ...p, enabled: prevEnabled } : p));
      console.error('切换状态失败:', error);
      toast.error('操作失败');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {server?.name} - 服务管理
          </DialogTitle>
          <DialogDescription>
            管理服务器上监控的服务（端口）
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* 添加服务按钮 */}
          {!showAddForm && (
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              添加服务
            </Button>
          )}

          {/* 添加服务表单 */}
          {showAddForm && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="port">端口号<span className="ml-1 text-destructive">*</span></Label>
                  <Input
                    id="port"
                    type="number"
                    value={newService.port}
                    onChange={(e) => setNewService({ ...newService, port: e.target.value })}
                    placeholder="8080"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service_name">服务名称</Label>
                  <Input
                    id="service_name"
                    value={newService.service_name}
                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                    placeholder="Web服务"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="protocol">协议</Label>
                  <Select
                    value={newService.protocol}
                    onValueChange={(protocol) => setNewService({ ...newService, protocol })}
                  >
                    <SelectTrigger id="protocol" className="w-full">
                      <SelectValue placeholder="选择协议" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcp">TCP</SelectItem>
                      <SelectItem value="udp">UDP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddService}>
                  确定
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowAddForm(false)}>
                  取消
                </Button>
              </div>
            </div>
          )}

          {/* 服务列表 */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>端口</TableHead>
                <TableHead>服务名称</TableHead>
                <TableHead>协议</TableHead>
                <TableHead>启用</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loading size="sm" text="正在加载服务..." />
                  </TableCell>
                </TableRow>
              ) : services.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <EmptyState title="暂无服务配置" compact />
                  </TableCell>
                </TableRow>
              ) : (
                services.map((port) => (
                  <TableRow key={port.id}>
                    <TableCell className="tabular-data font-medium">{port.port}</TableCell>
                    <TableCell>{port.service_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{port.protocol?.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={port.enabled}
                        onCheckedChange={() => handleToggleService(port)}
                      />
                    </TableCell>
                    <TableCell>
                      {port.last_check_status === 'open' ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">畅通</span>
                        </Badge>
                      ) : port.last_check_status === 'closed' ? (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          <span className="text-xs">不通</span>
                        </Badge>
                      ) : port.last_check_status === 'timeout' ? (
                        <Badge variant="warning" className="gap-1">
                          <span className="text-xs">超时</span>
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <span className="text-xs">待检测</span>
                        </Badge>
                      )}
                      {port.last_checked_at && (
                        <div className="tabular-data text-xs text-muted-foreground mt-1">
                          {new Date(port.last_checked_at).toLocaleString('zh-CN')}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteService(port.id)}
                        aria-label={`删除端口 ${port.port}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
