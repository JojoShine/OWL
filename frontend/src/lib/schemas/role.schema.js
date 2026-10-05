import * as z from 'zod';

/**
 * 角色表单验证 Schema
 */
export const roleSchema = z.object({
  name: z.string()
    .min(2, '角色名称至少2个字符')
    .max(50, '角色名称最多50个字符'),

  code: z.string()
    .min(2, '角色代码至少2个字符')
    .max(50, '角色代码最多50个字符'),

  description: z.string().optional(),

  status: z.enum(['active', 'inactive']),

  sort: z.number()
    .int()
    .min(0)
    .max(9999),
});