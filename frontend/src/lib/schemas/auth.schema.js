import * as z from 'zod';

/**
 * 登录表单验证 Schema
 */
export const loginSchema = z.object({
  username: z.string().min(1, '请输入用户名或邮箱'),
  password: z.string().min(1, '请输入密码'),
  captchaCode: z.string().min(1, '请输入验证码'),
});

/**
 * 注册表单验证 Schema
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, '用户名至少3个字符')
    .max(50, '用户名最多50个字符')
    .regex(/^[a-zA-Z0-9_-]+$/, '用户名只能包含字母、数字、下划线和连字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符')
    .max(50, '密码最多50个字符'),
  confirmPassword: z.string().min(1, '请确认密码'),
  captchaCode: z.string().min(1, '请输入验证码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});
