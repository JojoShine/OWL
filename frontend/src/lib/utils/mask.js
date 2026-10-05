/**
 * 数据脱敏工具函数
 */

/**
 * 手机号脱敏
 * @param {string} value - 手机号
 * @returns {string} 脱敏后的手机号
 * @example maskMobile('13812345678') // '138****5678'
 */
export function maskMobile(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length !== 11) return value;
  return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 身份证号脱敏
 * @param {string} value - 身份证号
 * @returns {string} 脱敏后的身份证号
 * @example maskIdCard('110101199001011234') // '110***********1234'
 */
export function maskIdCard(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length !== 15 && value.length !== 18) return value;
  return value.replace(/^(.{3}).*(.{4})$/, '$1***********$2');
}

/**
 * 邮箱脱敏
 * @param {string} value - 邮箱
 * @returns {string} 脱敏后的邮箱
 * @example maskEmail('abc@example.com') // 'a***@example.com'
 */
export function maskEmail(value) {
  if (!value || typeof value !== 'string') return value;
  const parts = value.split('@');
  if (parts.length !== 2) return value;
  const [username, domain] = parts;
  if (username.length <= 1) return value;
  const maskedUsername = username[0] + '***';
  return `${maskedUsername}@${domain}`;
}

/**
 * 银行卡号脱敏
 * @param {string} value - 银行卡号
 * @returns {string} 脱敏后的银行卡号
 * @example maskBankCard('6222021234567890123') // '6222 **** **** 0123'
 */
export function maskBankCard(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length < 8) return value;
  const cleaned = value.replace(/\s/g, '');
  const first4 = cleaned.slice(0, 4);
  const last4 = cleaned.slice(-4);
  return `${first4} **** **** ${last4}`;
}

/**
 * 姓名脱敏
 * @param {string} value - 姓名
 * @returns {string} 脱敏后的姓名
 * @example maskName('张三') // '张*'
 * @example maskName('欧阳修') // '欧阳*'
 */
export function maskName(value) {
  if (!value || typeof value !== 'string') return value;
  if (value.length <= 1) return value;
  return value[0] + '*'.repeat(value.length - 1);
}

/**
 * 根据类型进行脱敏
 * @param {string} value - 原始值
 * @param {string} type - 脱敏类型
 * @returns {string} 脱敏后的值
 */
export function maskByType(value, type) {
  if (!value) return value;

  switch (type) {
    case 'mobile':
      return maskMobile(value);
    case 'idCard':
      return maskIdCard(value);
    case 'email':
      return maskEmail(value);
    case 'bankCard':
      return maskBankCard(value);
    case 'name':
      return maskName(value);
    default:
      return value;
  }
}

