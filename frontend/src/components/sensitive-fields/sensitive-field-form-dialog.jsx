
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { sensitiveFieldApi } from '@/lib/api';
import { toast } from '@/components/ui/toast';
import { sensitiveFieldSchema } from '@/lib/schemas';

export default function SensitiveFieldFormDialog({ open, onOpenChange, field, onSuccess }) {
  const isEdit = !!field;

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(sensitiveFieldSchema),
    defaultValues: {
      table_name: '',
      field_name: '',
      mask_type: 'phone',
      mask_rule: '',
      description: '',
      is_active: true,
    },
  });

  // 当field变化时，更新表单
  useEffect(() => {
    if (field) {
      reset({
        table_name: field.table_name || '',
        field_name: field.field_name || '',
        mask_type: field.mask_type || 'phone',
        mask_rule: field.mask_rule ? JSON.stringify(field.mask_rule, null, 2) : '',
        description: field.description || '',
        is_active: field.is_active ?? true,
      });
    } else {
      reset({
        table_name: '',
        field_name: '',
        mask_type: 'phone',
        mask_rule: '',
        description: '',
        is_active: true,
      });
    }
  }, [field, reset]);

  const onSubmit = async (data) => {
    try {
      // 处理 mask_rule：如果是自定义类型且填写了规则，则解析为 JSON
      const submitData = { ...data };
      
      // 如果 table_name 为空字符串，转换为 null
      if (submitData.table_name === '') {
        submitData.table_name = null;
      }
      
      // 如果 description 为空字符串，转换为 null
      if (submitData.description === '') {
        submitData.description = null;
      }
      
      // 处理 mask_rule
      if (submitData.mask_type === 'custom' && submitData.mask_rule) {
        try {
          submitData.mask_rule = JSON.parse(submitData.mask_rule);
        } catch (e) {
          toast.error('自定义脱敏规则必须是有效的 JSON 格式');
          return;
        }
      } else {
        submitData.mask_rule = null;
      }

      if (isEdit) {
        await sensitiveFieldApi.updateSensitiveField(field.id, submitData);
      } else {
        await sensitiveFieldApi.createSensitiveField(submitData);
      }

      toast.success(isEdit ? '更新敏感字段配置成功' : '创建敏感字段配置成功');
      onSuccess?.();
      onOpenChange(false);
      reset();
    } catch (error) {
      console.error('保存敏感字段配置失败:', error);
      const errorMessage = error.response?.data?.message || error.message || '保存失败';
      toast.error(errorMessage);
    }
  };

  const maskTypeValue = watch('mask_type');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? '编辑敏感字段配置' : '新增敏感字段配置'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改敏感字段的脱敏配置' : '配置需要脱敏的敏感字段'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* 字段名 */}
          <div className="space-y-2">
            <Label htmlFor="field_name">
              字段名 <span className="text-destructive">*</span>
            </Label>
            <Controller name={'field_name'} control={control} render={({ field: controlledField }) => (
              <Input
                id="field_name"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="例如：phone, email, id_card"
              />
            )} />
            {errors.field_name && (
              <p className="text-sm text-red-500">{errors.field_name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              脱敏基于字段名匹配，全局唯一。不同表中的同名字段只需配置一次。
            </p>
          </div>

          {/* 表名（可选） */}
          <div className="space-y-2">
            <Label htmlFor="table_name">表名（可选）</Label>
            <Controller name={'table_name'} control={control} render={({ field: controlledField }) => (
              <Input
                id="table_name"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="例如：owl_users, owl_customers（多个表名用英文逗号分隔）"
              />
            )} />
            <p className="text-xs text-muted-foreground">
              脱敏基于字段名匹配，表名仅用于文档说明和审计目的。如需记录多个表，请用英文逗号分隔
            </p>
          </div>

          {/* 脱敏类型 */}
          <div className="space-y-2">
            <Label>
              脱敏类型 <span className="text-destructive">*</span>
            </Label>
            <Select
              value={maskTypeValue}
              onValueChange={(value) => setValue('mask_type', value)}
            >
              <SelectTrigger className="!h-10">
                <SelectValue placeholder="选择脱敏类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">手机号（138****5678）</SelectItem>
                <SelectItem value="email">邮箱（a***@example.com）</SelectItem>
                <SelectItem value="id_card">身份证（110***********1234）</SelectItem>
                <SelectItem value="bank_card">银行卡（**** **** **** 1234）</SelectItem>
                <SelectItem value="name">姓名（张*）</SelectItem>
                <SelectItem value="address">地址（北京市******）</SelectItem>
                <SelectItem value="custom">自定义规则</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 自定义脱敏规则 */}
          {maskTypeValue === 'custom' && (
            <div className="space-y-2">
              <Label htmlFor="mask_rule">自定义脱敏规则（JSON格式）</Label>
              <Controller name={'mask_rule'} control={control} render={({ field: controlledField }) => (
                <Textarea
                  id="mask_rule"
                  {...controlledField} value={controlledField.value ?? ""}
                  placeholder='例如：{"prefix": 3, "suffix": 4, "maskChar": "*"}'
                  rows={4}
                />
              )} />
              <p className="text-xs text-muted-foreground">
                定义脱敏规则的 JSON 对象，包括 prefix（保留前缀长度）、suffix（保留后缀长度）、maskChar（掩码字符）等
              </p>
            </div>
          )}

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Controller name={'description'} control={control} render={({ field: controlledField }) => (
              <Textarea
                id="description"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder="字段用途说明"
                rows={2}
              />
            )} />
          </div>

          {/* 是否启用 */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={watch('is_active')}
              onCheckedChange={(checked) => setValue('is_active', checked)}
            />
            <Label htmlFor="is_active">启用此配置</Label>
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
