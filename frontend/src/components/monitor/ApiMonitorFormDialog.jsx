
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { apiMonitorApi } from '@/lib/api';

// JSON 验证辅助函数
const isValidJSON = (str) => {
  if (!str || str.trim() === '') return true;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};

// 表单验证规则
const apiMonitorSchema = z.object({
  name: z.string().min(1, '监控名称不能为空').max(100, '监控名称最多100个字符'),
  url: z.string().url('请输入有效的URL地址'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.string().refine(isValidJSON, '请输入有效的JSON格式').optional(),
  body: z.string().optional(),
  interval: z.number().min(5, '检测间隔至少5秒').max(86400, '检测间隔最多86400秒'),
  timeout: z.number().min(1, '超时时间至少1秒').max(300, '超时时间最多300秒'),
  expect_status: z.number().min(100, '状态码范围100-599').max(599, '状态码范围100-599'),
  expect_response: z.string().optional(),
  enabled: z.boolean(),
});

export default function ApiMonitorFormDialog({ open, onOpenChange, monitor, onSuccess }) {
  const isEdit = !!monitor;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(apiMonitorSchema),
    defaultValues: {
      name: '',
      url: '',
      method: 'GET',
      headers: '',
      body: '',
      interval: 60,
      timeout: 30,
      expect_status: 200,
      expect_response: '',
      enabled: true,
    },
  });

  // 当 monitor 变化时，更新表单
  useEffect(() => {
    if (monitor) {
      reset({
        name: monitor.name || '',
        url: monitor.url || '',
        method: monitor.method || 'GET',
        headers: monitor.headers ? JSON.stringify(monitor.headers, null, 2) : '',
        body: monitor.body || '',
        interval: monitor.interval || 60,
        timeout: monitor.timeout || 30,
        expect_status: monitor.expect_status || 200,
        expect_response: monitor.expect_response || '',
        enabled: monitor.enabled !== false,
      });
    } else {
      reset({
        name: '',
        url: '',
        method: 'GET',
        headers: '',
        body: '',
        interval: 60,
        timeout: 30,
        expect_status: 200,
        expect_response: '',
        enabled: true,
      });
    }
  }, [monitor, reset]);

  const onSubmit = async (data) => {
    try {
      // 处理 headers（转换为 JSON）
      const submitData = {
        ...data,
        headers: data.headers && data.headers.trim()
          ? JSON.parse(data.headers)
          : null,
      };

      if (isEdit) {
        await apiMonitorApi.updateMonitor(monitor.id, submitData);
        toast.success('更新监控配置成功');
      } else {
        await apiMonitorApi.createMonitor(submitData);
        toast.success('创建监控配置成功');
      }

      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存监控配置失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  const methodValue = watch('method');
  const enabledValue = watch('enabled');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑监控配置' : '新增监控配置'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改接口监控配置信息' : '填写接口监控配置信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="max-h-[72vh] space-y-4 overflow-y-auto pr-1">
          {/* 监控名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              监控名称 <span className="text-destructive">*</span>
            </Label>
            <Controller name={'name'} control={control} render={({ field: controlledField }) => (
              <Input
                id="name"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="例如：用户服务健康检查"
              />
            )} />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">
              接口URL <span className="text-destructive">*</span>
            </Label>
            <Controller name={'url'} control={control} render={({ field: controlledField }) => (
              <Input
                id="url"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="https://api.example.com/health"
              />
            )} />
            {errors.url && (
              <p className="text-sm text-red-500">{errors.url.message}</p>
            )}
          </div>

          {/* HTTP 方法 */}
          <div className="space-y-2">
            <Label>HTTP 方法</Label>
            <Select
              value={methodValue}
              onValueChange={(value) => setValue('method', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择HTTP方法" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 请求头 */}
          <div className="space-y-2">
            <Label htmlFor="headers">
              请求头（JSON格式）
              <span className="text-muted-foreground text-xs ml-2">可选</span>
            </Label>
            <Controller name={'headers'} control={control} render={({ field: controlledField }) => (
              <Textarea
                id="headers"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder={'{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'}
                rows={4}
                className="font-mono text-sm"
              />
            )} />
            {errors.headers && (
              <p className="text-sm text-red-500">{errors.headers.message}</p>
            )}
          </div>

          {/* 请求体 */}
          <div className="space-y-2">
            <Label htmlFor="body">
              请求体
              <span className="text-muted-foreground text-xs ml-2">可选</span>
            </Label>
            <Controller name={'body'} control={control} render={({ field: controlledField }) => (
              <Textarea
                id="body"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="POST/PUT 请求的请求体内容"
                rows={3}
                className="font-mono text-sm"
              />
            )} />
          </div>

          {/* 检测间隔和超时时间（两列布局） */}
          <div className="grid gap-4 rounded-md border bg-muted/30 p-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interval">检测间隔（秒）</Label>
              <Controller name={'interval'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="interval"
                  type="number"
                  {...controlledField} value={Number.isNaN(controlledField.value) ? "" : controlledField.value ?? ""} onChange={(event) => controlledField.onChange(event.target.value === "" ? NaN : Number(event.target.value))}
                  placeholder="60"
                />
              )} />
              {errors.interval && (
                <p className="text-sm text-red-500">{errors.interval.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout">超时时间（秒）</Label>
              <Controller name={'timeout'} control={control} render={({ field: controlledField }) => (
                <Input
                  id="timeout"
                  type="number"
                  {...controlledField} value={Number.isNaN(controlledField.value) ? "" : controlledField.value ?? ""} onChange={(event) => controlledField.onChange(event.target.value === "" ? NaN : Number(event.target.value))}
                  placeholder="30"
                />
              )} />
              {errors.timeout && (
                <p className="text-sm text-red-500">{errors.timeout.message}</p>
              )}
            </div>
          </div>

          {/* 期望状态码 */}
          <div className="space-y-2">
            <Label htmlFor="expect_status">期望状态码</Label>
            <Controller name={'expect_status'} control={control} render={({ field: controlledField }) => (
              <Input
                id="expect_status"
                type="number"
                {...controlledField} value={Number.isNaN(controlledField.value) ? "" : controlledField.value ?? ""} onChange={(event) => controlledField.onChange(event.target.value === "" ? NaN : Number(event.target.value))}
                placeholder="200"
              />
            )} />
            {errors.expect_status && (
              <p className="text-sm text-red-500">{errors.expect_status.message}</p>
            )}
          </div>

          {/* 期望响应内容 */}
          <div className="space-y-2">
            <Label htmlFor="expect_response">
              期望响应内容
              <span className="text-muted-foreground text-xs ml-2">可选，支持子串匹配</span>
            </Label>
            <Controller name={'expect_response'} control={control} render={({ field: controlledField }) => (
              <Input
                id="expect_response"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="例如：success 或 ok"
              />
            )} />
          </div>

          {/* 启用状态 */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">启用监控</Label>
            <Switch
              id="enabled"
              checked={enabledValue}
              onCheckedChange={(checked) => setValue('enabled', checked)}
            />
          </div>

          <DialogFooter className="sticky bottom-0 border-t bg-background pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
