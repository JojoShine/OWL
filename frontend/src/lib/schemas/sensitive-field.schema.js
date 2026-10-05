import * as z from 'zod';

/**
 * 敏感字段配置表单验证 Schema
 */
export const sensitiveFieldSchema = z.object({
  table_name: z.string()
    .max(100, '表名最多100个字符')
    .optional()
    .or(z.literal('')),

  field_name: z.string()
    .min(1, '字段名是必填项')
    .max(100, '字段名最多100个字符'),

  mask_type: z.enum(['phone', 'email', 'id_card', 'bank_card', 'name', 'address', 'custom']),

  mask_rule: z.string()
    .optional()
    .or(z.literal('')),

  description: z.string()
    .max(255, '描述最多255个字符')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean(),
});