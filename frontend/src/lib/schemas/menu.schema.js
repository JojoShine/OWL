import * as z from 'zod';

/**
 * 菜单表单验证 Schema
 */
export const menuSchema = z.object({
  name: z.string()
    .min(2, '菜单名称至少2个字符')
    .max(50, '菜单名称最多50个字符'),

  path: z.string().optional(),

  component: z.string().optional(),

  icon: z.string().optional(),

  type: z.enum(['menu', 'button', 'link']),

  visible: z.boolean(),

  sort: z.number()
    .int()
    .min(0)
    .max(9999),

  status: z.enum(['active', 'inactive']),

  permission_code: z.string().optional(),
});