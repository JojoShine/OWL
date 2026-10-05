
import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Edit2 } from 'lucide-react';
import { useSensitiveField } from '@/contexts/SensitiveFieldContext';

/**
 * 敏感字段输入组件
 * 自动处理脱敏字段的编辑逻辑
 */
export function SensitiveInput({
  name,
  label,
  value,
  isEdit = false,
  required = false,
  type = 'text',
  placeholder,
  control,
  setValue,
  errors,
  disabled = false,
  className = '',
}) {
  const [isFieldEditable, setIsFieldEditable] = useState(false);
  const { shouldShowEditButton } = useSensitiveField();

  // 判断是否需要显示编辑按钮
  const needsEditButton = isEdit && shouldShowEditButton(name, value) && !isFieldEditable;

  // 重置可编辑状态（当表单重置或切换用户时）
  useEffect(() => {
    setIsFieldEditable(false);
  }, [value, isEdit]);

  // 处理点击编辑按钮
  const handleEdit = () => {
    setValue(name, '');
    setIsFieldEditable(true);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <div className="flex gap-2">
        <Controller name={name} control={control} render={({ field: controlledField }) => (
          <Input
            id={name}
            type={type}
            {...controlledField} value={controlledField.value ?? ""}
            placeholder={needsEditButton ? '保持不变' : placeholder}
            disabled={disabled || needsEditButton}
            className={`${needsEditButton ? 'bg-muted' : ''} ${className}`}
          />
        )} />
        {needsEditButton && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleEdit}
            title={`修改${label}`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {errors[name] && (
        <p className="text-sm text-destructive">{errors[name].message}</p>
      )}
    </div>
  );
}
