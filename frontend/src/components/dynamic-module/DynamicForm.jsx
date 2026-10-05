
import { useCallback, useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toDateTimeLocalString, fromDateTimeLocalString, formatDateTime } from '@/lib/utils/date';
import { maskByType } from '@/lib/utils/mask';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { DateTimePicker } from '@/components/ui/date-time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const isDateTimeString = (value) => {
  if (!value || typeof value !== 'string') return false;
  return (
    value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/) ||
    value.match(/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}/)
  );
};

/**
 * 动态表单组件
 * 根据字段配置动态渲染表单
 */
export function DynamicForm({
  open,
  onOpenChange,
  fields = [],
  data = null,
  mode = 'create',
  onSubmit,
  title,
  description,
}) {
  const isEdit = mode === 'edit' && data !== null;
  const isView = mode === 'view';

  // 只显示在表单中的字段
  const formFields = useMemo(() => fields.filter((f) => f.showInForm), [fields]);

  // 生成验证规则
  const generateValidationSchema = useCallback(() => {
    const schema = {};

    formFields.forEach((field) => {
      const rules = field.rules || field.formRules || {};
      let fieldSchema;
      const fieldLabel = field.formLabel || field.label;

      switch (field.type) {
        case 'number':
          if (rules.required) {
            fieldSchema = z.number({
              invalid_type_error: `${fieldLabel}必须是数字`,
              required_error: `${fieldLabel}不能为空`,
            });
            if (rules.min !== undefined) {
              fieldSchema = fieldSchema.min(rules.min, `${fieldLabel}不能小于${rules.min}`);
            }
            if (rules.max !== undefined) {
              fieldSchema = fieldSchema.max(rules.max, `${fieldLabel}不能大于${rules.max}`);
            }
          } else {
            let numInner = z.number({
              invalid_type_error: `${fieldLabel}必须是数字`,
            }).optional();
            if (rules.min !== undefined) {
              numInner = numInner.min(rules.min, `${fieldLabel}不能小于${rules.min}`);
            }
            if (rules.max !== undefined) {
              numInner = numInner.max(rules.max, `${fieldLabel}不能大于${rules.max}`);
            }
            fieldSchema = z.preprocess(
              (val) => (val === '' || val === null || val === undefined || isNaN(val) ? undefined : Number(val)),
              numInner
            );
          }
          break;

        case 'boolean':
          fieldSchema = z.preprocess(
            (val) => {
              if (val === 'TRUE' || val === 'true' || val === true) return true;
              if (val === 'FALSE' || val === 'false' || val === false) return false;
              return val;
            },
            z.boolean({ invalid_type_error: `${fieldLabel}格式不正确` })
          );
          break;

        case 'date': {
          let dateInner = z.string({ invalid_type_error: `${fieldLabel}格式不正确` });
          if (rules.required) {
            dateInner = dateInner.min(1, `${fieldLabel}不能为空`);
          } else {
            dateInner = dateInner.optional().or(z.literal(''));
          }
          fieldSchema = z.preprocess(
            (val) => (val === undefined || val === null ? '' : String(val)),
            dateInner
          );
          break;
        }

        default: {
          let strInner = z.string({ invalid_type_error: `${fieldLabel}不能为空` });

          if (rules.required) {
            strInner = strInner.min(1, `${fieldLabel}不能为空`);
          }
          if (rules.minLength !== undefined) {
            strInner = strInner.min(rules.minLength, `${fieldLabel}至少${rules.minLength}个字符`);
          }
          if (rules.maxLength !== undefined) {
            strInner = strInner.max(rules.maxLength, `${fieldLabel}最多${rules.maxLength}个字符`);
          }
          if (rules.exactLength !== undefined) {
            strInner = strInner.length(rules.exactLength, `${fieldLabel}必须是${rules.exactLength}个字符`);
          }
          if (rules.pattern) {
            strInner = strInner.regex(
              new RegExp(rules.pattern),
              `${fieldLabel}格式不正确`
            );
          }
          if (rules.email) {
            strInner = strInner.email(`${fieldLabel}格式不正确`);
          }
          if (!rules.required) {
            strInner = strInner.optional().or(z.literal(''));
          }

          fieldSchema = z.preprocess(
            (val) => (val === undefined || val === null ? '' : String(val)),
            strInner
          );
        }
      }

      schema[field.name] = fieldSchema;
    });

    return z.object(schema);
  }, [formFields]);

  const validationSchema = useMemo(() => generateValidationSchema(), [generateValidationSchema]);

  // 生成默认值
  const generateDefaultValues = useCallback(() => {
    const defaults = {};
    formFields.forEach((field) => {
      if ((isEdit || isView) && data && data[field.name] !== undefined) {
        if ((field.type === 'date' || field.type === 'datetime') && data[field.name]) {
          defaults[field.name] = toDateTimeLocalString(data[field.name]);
        } else if (isDateTimeString(data[field.name])) {
          defaults[field.name] = toDateTimeLocalString(data[field.name]);
        } else {
          defaults[field.name] = data[field.name];
        }
      } else {
        switch (field.type) {
          case 'boolean':
            defaults[field.name] = false;
            break;
          case 'number':
            defaults[field.name] = 0;
            break;
          default:
            defaults[field.name] = '';
        }
      }
    });
    return defaults;
  }, [data, formFields, isEdit, isView]);
  const defaultValues = useMemo(() => generateDefaultValues(), [generateDefaultValues]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues,
  });

  // 当对话框打开或数据变化时重置表单
  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [defaultValues, open, reset]);

  // 格式化显示值（用于查看模式）
  const formatDisplayValue = (field, value) => {
    // 空值处理
    if (value === null || value === undefined || value === '') {
      return '-';
    }

    // 布尔值
    if (field.type === 'boolean') {
      return value === true || value === 'TRUE' || value === 'true' ? '是' : '否';
    }

    // 枚举值（使用 codeMapping）
    if (field.codeMapping?.mappings) {
      const mapping = field.codeMapping.mappings[value];
      return mapping?.label || value;
    }

    // Select 选项
    if (field.selectOptions) {
      const option = field.selectOptions.find(opt => String(opt.value) === String(value));
      return option?.label || value;
    }

    // 日期时间字段（date 和 datetime 类型都需要格式化）
    if (field.type === 'date' || field.type === 'datetime' || isDateTimeString(value)) {
      return formatDateTime(value);
    }

    // 脱敏处理
    const displayRule = field.formatOptions?.displayRule;
    if (displayRule?.type === 'mask' && displayRule?.maskType) {
      return maskByType(value, displayRule.maskType);
    }

    // 默认返回值
    return value;
  };

  // 渲染不同类型的表单控件
  const renderFormField = (field) => {
    const error = errors[field.name];
    const fieldValue = watch(field.name);
    // 支持 rules 和 formRules 两种命名
    const rules = field.rules || field.formRules || {};

    // 查看模式：直接显示文本
    if (isView) {
      return (
        <div key={field.name} className={`space-y-2 ${field.formComponent === 'textarea' ? 'md:col-span-2' : ''}`}>
          <Label className="text-sm text-muted-foreground">
            {field.formLabel || field.label}
          </Label>
          <div className="min-h-10 rounded-md border bg-muted/20 px-3 py-2.5 text-sm text-foreground">
            {formatDisplayValue(field, fieldValue)}
          </div>
        </div>
      );
    }

    switch (field.formComponent) {
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2 md:col-span-2">
            <Label htmlFor={field.name}>
              {field.formLabel || field.label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Controller name={field.name} control={control} render={({ field: controlledField }) => (
              <Textarea
                id={field.name}
                {...controlledField} value={controlledField.value ?? ""}
                placeholder={field.placeholder || `请输入${field.formLabel || field.label}`}
                disabled={field.readonly}
                rows={4}
              />
            )} />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
          </div>
        );

      case 'switch':
        return (
          <div key={field.name} className="flex min-h-10 items-center justify-between rounded-md border bg-muted/20 px-3 py-2">
            <Label htmlFor={field.name}>{field.formLabel || field.label}</Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controlledField }) => (
                <Switch
                  id={field.name}
                  checked={Boolean(controlledField.value)}
                  onCheckedChange={controlledField.onChange}
                  disabled={field.readonly}
                />
              )}
            />
          </div>
        );

      case 'select':
        // 获取选项：优先使用 selectOptions，其次使用 codeMapping
        const selectOptions = field.selectOptions || (field.codeMapping?.mappings ? Object.entries(field.codeMapping.mappings).map(([key, value]) => ({
          value: key,
          label: value.label,
        })) : []);

        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.formLabel || field.label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controlledField }) => (
                <Select
                  value={controlledField.value === undefined || controlledField.value === null ? '' : String(controlledField.value)}
                  onValueChange={(value) => controlledField.onChange(field.type === 'boolean' ? value === 'true' : value)}
                  disabled={field.readonly}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`请选择${field.formLabel || field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectOptions.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.formLabel || field.label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Controller name={field.name} control={control} render={({ field: controlledField }) => (
              <Input
                id={field.name}
                type="number"
                {...controlledField} value={Number.isNaN(controlledField.value) ? "" : controlledField.value ?? ""} onChange={(event) => controlledField.onChange(event.target.value === "" ? NaN : Number(event.target.value))}
                placeholder={field.placeholder || `请输入${field.formLabel || field.label}`}
                disabled={field.readonly}
              />
            )} />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
          </div>
        );

      case 'date':
      case 'datetime':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.formLabel || field.label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Controller
              name={field.name}
              control={control}
              render={({ field: controlledField }) => (
                <DateTimePicker
                  value={controlledField.value}
                  onChange={(event) => {
                    controlledField.onChange(event.target.value);
                    trigger(field.name);
                  }}
                  placeholder={field.placeholder || `请选择${field.formLabel || field.label}`}
                  disabled={field.readonly}
                  showTime={field.formComponent === 'datetime'}
                />
              )}
            />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
          </div>
        );

      case 'input':
      default:
        // 默认文本输入
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.formLabel || field.label}
              {rules.required && <span className="ml-1 text-destructive">*</span>}
            </Label>
            <Controller name={field.name} control={control} render={({ field: controlledField }) => (
              <Input
                id={field.name}
                type="text"
                {...controlledField} value={controlledField.value ?? ""}
                placeholder={field.placeholder || `请输入${field.formLabel || field.label}`}
                disabled={field.readonly}
              />
            )} />
            {error && <p className="text-sm text-destructive">{error.message}</p>}
          </div>
        );
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      // 处理字段值的转换
      const processedData = { ...formData };
      formFields.forEach((field) => {
        const value = processedData[field.name];

        // 处理布尔值：转换为 TRUE/FALSE（大写）
        if (field.type === 'boolean' && value !== null && value !== undefined) {
          processedData[field.name] = value === true || value === 'true' ? 'TRUE' : 'FALSE';
        }

        // 处理日期字段：将 datetime-local 格式转换为 Date 对象或 ISO 字符串
        if (value && (field.type === 'date' || field.type === 'datetime' || isDateTimeString(value))) {
          // 从 datetime-local 格式转换为 Date 对象，然后转换为 ISO 字符串
          const dateObj = fromDateTimeLocalString(value);
          if (dateObj) {
            processedData[field.name] = dateObj.toISOString();
          }
        }
      });

      await onSubmit?.(processedData);
      onOpenChange?.(false);
    } catch (error) {
      console.error('提交表单失败:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 ${formFields.length > 10 ? 'max-w-4xl' : 'max-w-3xl'}`}>
        <DialogHeader className="shrink-0 border-b px-6 py-5">
          <DialogTitle>{title || (isView ? '查看' : isEdit ? '编辑' : '新增')}</DialogTitle>
          <DialogDescription>{description || ' '}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
            {formFields.map((field) => renderFormField(field))}
          </div>

          <DialogFooter className="shrink-0 border-t bg-muted/30 px-6 py-4">
            {!isView ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange?.(false)}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '提交中...' : isEdit ? '保存' : '创建'}
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => onOpenChange?.(false)}
              >
                关闭
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
