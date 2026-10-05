
import { useState, useEffect } from 'react';
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
import { dataAccessApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';

const plainAccessSchema = z.object({
  reason: z.string()
    .min(1, '申请理由是必填项')
    .max(500, '申请理由最多500个字符'),
  password: z.string()
    .min(1, '密码是必填项')
    .min(6, '密码至少6个字符'),
});

export default function PlainAccessDialog({ 
  open, 
  onOpenChange, 
  tableName, 
  fieldName, 
  recordId,
  onSuccess 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expiryText, setExpiryText] = useState('10分钟'); // 默认值，会从后端响应中更新

  // 当对话框打开时，重置有效期文本
  useEffect(() => {
    if (open) {
      setExpiryText('10分钟'); // 重置为默认值
    }
  }, [open]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(plainAccessSchema),
    defaultValues: {
      reason: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const response = await dataAccessApi.requestPlainAccess({
        table_name: tableName,
        field_name: fieldName,
        record_id: recordId,
        reason: data.reason,
        password: data.password,
      });

      // 从后端响应中获取有效期信息并格式化显示
      const expiresAt = response.data?.expiresAt;
      if (expiresAt) {
        const expiryMs = new Date(expiresAt).getTime() - Date.now();
        const expiryMinutes = Math.round(expiryMs / 60000);
        
        if (expiryMinutes < 60) {
          setExpiryText(`${expiryMinutes}分钟`);
        } else {
          const expiryHours = Math.round(expiryMinutes / 60);
          setExpiryText(`${expiryHours}小时`);
        }
      }

      toast.success(`已授权查看该记录的明文，有效期${expiryText}`);
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('申请明文访问失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '申请失败';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>申请查看明文</DialogTitle>
          <DialogDescription>
            验证您的身份以查看该记录的敏感字段明文
            <br />
            <span className="text-xs text-muted-foreground">
              权限有效期为{expiryText}，仅对该记录生效，所有访问将被记录
            </span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 字段信息展示 */}
          <div className="p-3 bg-muted rounded-lg space-y-1">
            <p className="text-sm font-medium">申请查看的信息</p>
            <p className="text-xs text-muted-foreground">
              表名: <span className="font-mono">{tableName}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              字段: <span className="font-mono">{fieldName}</span>
            </p>
            {recordId && (
              <p className="text-xs text-muted-foreground">
                记录ID: <span className="font-mono text-xs">{recordId.substring(0, 8)}...</span>
              </p>
            )}
          </div>

          {/* 申请理由 */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              申请理由 <span className="text-destructive">*</span>
            </Label>
            <Controller name={'reason'} control={control} render={({ field: controlledField }) => (
              <Textarea
                id="reason"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="请说明查看明文的理由"
                rows={3}
              />
            )} />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason.message}</p>
            )}
          </div>

          {/* 密码 */}
          <div className="space-y-2">
            <Label htmlFor="password">
              登录密码 <span className="text-destructive">*</span>
            </Label>
            <Controller name={'password'} control={control} render={({ field: controlledField }) => (
              <Input
                id="password"
                type="password"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="请输入您的登录密码"
              />
            )} />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
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
              {isSubmitting ? '验证中...' : '确认'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
