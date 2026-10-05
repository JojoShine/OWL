import * as z from 'zod';
import { sensitiveEmail, sensitivePhone, sensitiveName } from './helpers';

/**
 * 用户表单验证 Schema
 */
export const userSchema = z.object({
  username: z.string()
    .min(1, '用户名是必填项')
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),

  email: sensitiveEmail({ required: true }),

  password: z.string()
    .min(1, '密码是必填项')
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符')
    .optional()
    .or(z.literal('')),

  real_name: sensitiveName({ maxLength: 50 }),

  phone: sensitivePhone(),

  department_id: z.string().optional(),

  status: z.enum(['active', 'inactive', 'banned']),

  role_ids: z.array(z.string()).optional(),

  access_level: z.enum(['SELF', 'DEPARTMENT', 'ALL']),
});
