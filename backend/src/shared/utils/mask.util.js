/**
 * 数据脱敏工具函数
 * 提供常见的敏感数据脱敏方法
 */

/**
 * 手机号脱敏：13812345678 → 138****5678
 */
const maskPhone = (phone) => {
  if (!phone) return phone;
  const str = String(phone);
  if (str.length < 7) return str;
  return str.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
};

/**
 * 邮箱脱敏：test@example.com → t***@example.com
 */
const maskEmail = (email) => {
  if (!email) return email;
  const str = String(email);
  const [username, domain] = str.split('@');
  if (!domain) return str;
  
  if (username.length <= 1) {
    return `${username}***@${domain}`;
  }
  return `${username[0]}***@${domain}`;
};

/**
 * 身份证脱敏：110101199001011234 → 110***********1234
 */
const maskIdCard = (idCard) => {
  if (!idCard) return idCard;
  const str = String(idCard);
  if (str.length < 7) return str;
  return str.replace(/(\d{3})\d+(\d{4})/, '$1***********$2');
};

/**
 * 银行卡脱敏：6222021234567890123 → **** **** **** 1234
 */
const maskBankCard = (card) => {
  if (!card) return card;
  const str = String(card).replace(/\s/g, '');
  if (str.length < 4) return str;
  const last4 = str.slice(-4);
  return `**** **** **** ${last4}`;
};

/**
 * 姓名脱敏：张三 → 张*
 */
const maskName = (name) => {
  if (!name) return name;
  const str = String(name);
  if (str.length === 0) return str;
  if (str.length === 1) return '*';
  return str[0] + '*'.repeat(str.length - 1);
};

/**
 * 地址脱敏：北京市朝阳区xxx路xxx号 → 北京市******
 */
const maskAddress = (address) => {
  if (!address) return address;
  const str = String(address);
  if (str.length <= 3) return str;
  return str.substring(0, 3) + '******';
};

/**
 * 自定义脱敏规则
 * @param {string} value - 原始值
 * @param {object} rule - 脱敏规则
 * @param {number} rule.prefix_length - 保留前缀长度
 * @param {number} rule.suffix_length - 保留后缀长度
 * @param {string} rule.mask_char - 脱敏字符，默认 '*'
 */
const maskCustom = (value, rule) => {
  if (!value) return value;
  const str = String(value);
  const prefixLength = rule.prefix_length || 0;
  const suffixLength = rule.suffix_length || 0;
  const maskChar = rule.mask_char || '*';
  
  if (str.length <= prefixLength + suffixLength) {
    return maskChar.repeat(str.length);
  }
  
  const prefix = str.substring(0, prefixLength);
  const suffix = str.substring(str.length - suffixLength);
  const middleLength = str.length - prefixLength - suffixLength;
  
  return prefix + maskChar.repeat(middleLength) + suffix;
};

/**
 * 根据脱敏类型执行脱敏
 * @param {string} value - 原始值
 * @param {string} maskType - 脱敏类型
 * @param {object} maskRule - 自定义脱敏规则（可选）
 */
const maskValue = (value, maskType, maskRule = null) => {
  if (!value) return value;
  
  switch (maskType) {
    case 'phone':
      return maskPhone(value);
    case 'email':
      return maskEmail(value);
    case 'id_card':
      return maskIdCard(value);
    case 'bank_card':
      return maskBankCard(value);
    case 'name':
      return maskName(value);
    case 'address':
      return maskAddress(value);
    case 'custom':
      return maskRule ? maskCustom(value, maskRule) : maskCustom(value, { prefix_length: 1, suffix_length: 1 });
    default:
      return value;
  }
};

module.exports = {
  maskPhone,
  maskEmail,
  maskIdCard,
  maskBankCard,
  maskName,
  maskAddress,
  maskCustom,
  maskValue
};
