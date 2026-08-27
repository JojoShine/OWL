'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { dataAccessApi, sensitiveFieldApi } from '@/lib/api';
import { toast } from 'sonner';

// 表单验证规则
const dataAccessSchema = z.object({
  table_name: z.string()
    .min(1, '表名是必填项')
    .max(100, '表名最多100个字符'),
  field_name: z.string()
    .min(1, '字段名是必填项')
    .max(100, '字段名最多100个字符'),
  reason: z.string()
    .min(1, '申请理由是必填项')
    .max(500, '申请理由最多500个字符'),
  password: z.string()
    .min(1, '密码是必填项')
    .min(6, '密码至少6个字符'),
});

export default function DataAccessFormDialog({ open, onOpenChange, request, onSuccess }) {
  const isEdit = !!request;
  const [sensitiveFields, setSensitiveFields] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(dataAccessSchema),
    defaultValues: {
      table_name: '',
      field_name: '',
      reason: '',
      password: '',
    },
  });

  // 获取敏感字段列表
  useEffect(() => {
    const fetchSensitiveFields = async () => {
      try {
        const response = await sensitiveFieldApi.getSensitiveFields({ limit: 100 });
        const fieldsData = response.data?.items || [];
        setSensitiveFields(Array.isArray(fieldsData) ? fieldsData : []);
      } catch (error) {
        console.error('获取敏感字段列表失败:', error);
        setSensitiveFields([]);
      }
    };

    if (open) {
      fetchSensitiveFields();
    }
  }, [open]);

  // 当request变化时，更新表单
  useEffect(() => {
    if (request) {
      reset({
        table_name: request.table_name || '',
        field_name: request.field_name || '',
        reason: request.reason || '',
        password: '',
      });
    } else {
      reset({
        table_name: '',
        field_name: '',
        reason: '',
        password: '',
      });
    }
  }, [request, reset]);

  const tableNameValue = watch('table_name');

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await dataAccessApi.updateDataAccessRequestStatus(request.id, {
          status: data.status,
        });
      } else {
        await dataAccessApi.createDataAccessRequest(data);
      }

      toast.success(isEdit ? '更新数据访问申请成功' : '创建数据访问申请成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存数据访问申请失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑数据访问申请' : '新增数据访问申请'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改数据访问申请信息' : '填写新的数据访问申请'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 表名 */}
          <div className="space-y-2">
            <Label htmlFor="table_name">
              表名 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={tableNameValue || ''}
              onValueChange={(value) => setValue('table_name', value)}
            >
              <SelectTrigger className="!h-10">
                <SelectValue placeholder="选择表名" />
              </SelectTrigger>
              <SelectContent>
                {[...new Set(sensitiveFields.map(f => f.table_name))].map((tableName) => (
                  <SelectItem key={tableName} value={tableName}>
                    {tableName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.table_name && (
              <p className="text-sm text-red-500">{errors.table_name.message}</p>
            )}
          </div>

          {/* 字段名 */}
          <div className="space-y-2">
            <Label htmlFor="field_name">
              字段名 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch('field_name') || ''}
              onValueChange={(value) => setValue('field_name', value)}
            >
              <SelectTrigger className="!h-10">
                <SelectValue placeholder="选择字段名" />
              </SelectTrigger>
              <SelectContent>
                {sensitiveFields
                  .filter(f => !tableNameValue || f.table_name === tableNameValue)
                  .map((field) => (
                    <SelectItem key={field.id} value={field.field_name}>
                      {field.field_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.field_name && (
              <p className="text-sm text-red-500">{errors.field_name.message}</p>
            )}
          </div>

          {/* 申请理由 */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              申请理由 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              {...register('reason')}
              placeholder="请说明申请明文访问的理由"
              rows={3}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              密码 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              {...register('password')}
              placeholder="请输入您的登录密码"
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              用于验证身份，验证通过后可查看明文数据（有效期1小时）
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '提交中...' : '提交'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
