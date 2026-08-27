'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { DatePicker } from '@/components/ui/date-picker';
import { Checkbox } from '@/components/ui/checkbox';
import { thirdPartyKeysApi } from '@/lib/api';
import { toast } from 'sonner';
import { thirdPartyKeySchema as keySchema } from '@/lib/schemas';

export default function KeyFormDialog({ open, onOpenChange, editingKey, onSuccess }) {
  const isEdit = !!editingKey;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scopeOptions, setScopeOptions] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(keySchema),
    defaultValues: {
      client_name: '',
      description: '',
      expires_at: '',
      remark: '',
      scopes: [],
    },
  });

  // 当key变化时，更新表单
  useEffect(() => {
    if (editingKey && open) {
      reset({
        client_name: editingKey.client_name || '',
        description: editingKey.description || '',
        expires_at: editingKey.expires_at ? new Date(editingKey.expires_at).toISOString().split('T')[0] : '',
        remark: editingKey.remark || '',
        scopes: editingKey.scopes || [],
      });
    } else if (!editingKey) {
      reset({
        client_name: '',
        description: '',
        expires_at: '',
        remark: '',
        scopes: [],
      });
    }
  }, [editingKey, open, reset]);

  useEffect(() => {
    if (!open) return;
    thirdPartyKeysApi.getScopes()
      .then((response) => setScopeOptions(response.data || []))
      .catch(() => setScopeOptions([]));
  }, [open]);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const submitData = {
        client_name: data.client_name,
        description: data.description || '',
        remark: data.remark || '',
        scopes: data.scopes,
      };

      if (data.expires_at) {
        submitData.expires_at = new Date(data.expires_at).toISOString();
      } else {
        submitData.expires_at = null;
      }

      let response;
      if (isEdit) {
        response = await thirdPartyKeysApi.updateKey(editingKey.id, submitData);
      } else {
        response = await thirdPartyKeysApi.createKey(submitData);
      }

      toast.success(isEdit ? '更新密钥成功' : '创建密钥成功');
      onSuccess?.(response.data); // 传递响应数据
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存密钥失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑API密钥' : '创建API密钥'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改API密钥信息' : '填写新API密钥的基本信息'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 客户端名称 */}
          <div className="space-y-2">
            <Label htmlFor="client_name">
              客户端名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="client_name"
              {...register('client_name')}
              placeholder="请输入客户端名称，如：食堂系统、用户同步"
            />
            {errors.client_name && (
              <p className="text-sm text-red-500">{errors.client_name.message}</p>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="请输入密钥描述"
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* 过期时间 */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">过期时间</Label>
            <DatePicker
              value={watch('expires_at')}
              onChange={(e) => setValue('expires_at', e.target.value)}
              placeholder="选择过期时间（可选）"
            />
            {errors.expires_at && (
              <p className="text-sm text-red-500">{errors.expires_at.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>权限范围<span className="ml-1 text-destructive">*</span></Label>
            <div className="space-y-1 rounded-lg border p-2">
              {scopeOptions.map((scope) => {
                const selected = watch('scopes').includes(scope.value);
                return (
                  <label key={scope.value} className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/60">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => setValue(
                        'scopes',
                        selected
                          ? watch('scopes').filter((value) => value !== scope.value)
                          : [...watch('scopes'), scope.value],
                        { shouldValidate: true }
                      )}
                    />
                    <span className="text-sm">{scope.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.scopes && <p className="text-sm text-destructive">{errors.scopes.message}</p>}
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="remark">备注</Label>
            <Input
              id="remark"
              {...register('remark')}
              placeholder="请输入备注信息"
            />
            {errors.remark && (
              <p className="text-sm text-red-500">{errors.remark.message}</p>
            )}
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
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
