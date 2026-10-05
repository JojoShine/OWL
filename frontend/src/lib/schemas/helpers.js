import * as z from 'zod';

/**
 * Zod 验证辅助函数 - 支持脱敏字段
 *
 * 脱敏字段（包含 * 的值）会跳过格式验证，
 * 在提交时由 onSubmit 过滤掉，不会发送到后端
 */

/**
 * 邮箱验证 - 支持脱敏值
 */
export const sensitiveEmail = (options = {}) => {
  const { required = true, message = '请提供有效的邮箱地址' } = options;

  let schema = z.string();

  if (required) {
    schema = schema.min(1, '邮箱是必填项');
  }

  return schema.refine(
    (val) => !val || val.includes('*') || z.string().email().safeParse(val).success,
    { message }
  );
};

/**
 * 手机号验证 - 支持脱敏值（中国11位手机号）
 */
export const sensitivePhone = (options = {}) => {
  const { required = false, message = '请提供有效的手机号码（11位中国手机号）' } = options;

  let schema = z.string();

  if (required) {
    schema = schema.min(1, '手机号是必填项');
  }

  return schema
    .refine(
      (val) => !val || val.includes('*') || /^1[3-9]\d{9}$/.test(val),
      { message }
    )
    .optional()
    .or(z.literal(''));
};

/**
 * 身份证验证 - 支持脱敏值（中国18位身份证）
 */
export const sensitiveIdCard = (options = {}) => {
  const { required = false, message = '请提供有效的身份证号码' } = options;

  let schema = z.string();

  if (required) {
    schema = schema.min(1, '身份证号是必填项');
  }

  return schema
    .refine(
      (val) => !val || val.includes('*') || /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/.test(val),
      { message }
    )
    .optional()
    .or(z.literal(''));
};

/**
 * 银行卡验证 - 支持脱敏值
 */
export const sensitiveBankCard = (options = {}) => {
  const { required = false, message = '请提供有效的银行卡号' } = options;

  let schema = z.string();

  if (required) {
    schema = schema.min(1, '银行卡号是必填项');
  }

  return schema
    .refine(
      (val) => !val || val.includes('*') || /^\d{16,19}$/.test(val),
      { message }
    )
    .optional()
    .or(z.literal(''));
};

/**
 * 姓名验证 - 支持脱敏值
 */
export const sensitiveName = (options = {}) => {
  const { required = false, maxLength = 50, message } = options;

  let schema = z.string();

  if (required) {
    schema = schema.min(1, '姓名是必填项');
  }

  if (maxLength) {
    schema = schema.max(maxLength, message || `姓名最多${maxLength}个字符`);
  }

  return schema.optional();
};

/**
 * 过滤提交数据中的脱敏字段
 * 用于 onSubmit 中，移除包含 * 的字段值
 */
export const filterMaskedFields = (data) => {
  const filtered = { ...data };

  Object.keys(filtered).forEach(key => {
    const value = filtered[key];
    if (typeof value === 'string' && value.includes('*')) {
      delete filtered[key];
    }
  });

  return filtered;
};
