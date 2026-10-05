import * as z from 'zod';

/**
 * 部门表单验证 Schema
 */
export const departmentSchema = z.object({
  name: z.string()
    .min(2, '部门名称至少2个字符')
    .max(100, '部门名称最多100个字符'),

  code: z.string()
    .regex(/^[A-Za-z0-9_-]*$/, '部门代码只能包含字母、数字、下划线和连字符')
    .optional()
    .or(z.literal('')),

  leader_id: z.string().optional(),

  description: z.string()
    .max(500, '描述最多500个字符')
    .optional(),

  sort: z.number()
    .int()
    .min(0)
    .max(9999),

  status: z.enum(['active', 'inactive']),
});
