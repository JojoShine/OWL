import * as z from 'zod';

/**
 * 第三方密钥表单验证 Schema
 */
export const thirdPartyKeySchema = z.object({
  client_name: z.string()
    .min(2, '客户端名称至少2个字符')
    .max(255, '客户端名称最多255个字符'),

  description: z.string()
    .max(500, '描述最多500个字符')
    .optional(),

  expires_at: z.string().optional(),

  remark: z.string()
    .max(500, '备注最多500个字符')
    .optional(),

  status: z.enum(['active', 'inactive']).optional(),

  scopes: z.array(z.string()).min(1, '请至少选择一个权限范围'),
});
