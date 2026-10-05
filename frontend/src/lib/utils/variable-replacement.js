import * as MaskingUtils from './masking';

/**
 * 变量替换工具库
 * 处理水印中的动态变量替换
 */

const VARIABLE_REGEX = /\{\{user:(\w+)(?:\|mask:(\w+):(\d+))?\}\}/g;

const SUPPORTED_FIELDS = [
  'username',
  'realName',
  'real_name',
  'email',
  'phone',
  'department',
  'role'
];

/**
 * 从用户对象中提取字段值
 */
export const extractUserField = (user, fieldName) => {
  if (!user) return '';

  let value = '';
  switch (fieldName) {
    case 'username':
      value = user.username || '';
      break;
    case 'realName':
    case 'real_name':
      value = user.realName || user.real_name || '';
      break;
    case 'email':
      value = user.email || '';
      break;
    case 'phone':
      value = user.phone || '';
      break;
    case 'department':
      // 处理嵌套的department对象
      value = user.department?.name || user.department || '';
      break;
    case 'role':
      // 处理嵌套的role对象
      value = user.role?.name || user.role || '';
      break;
    default:
      value = user[fieldName] || '';
  }

  return String(value);
};

/**
 * 替换单条文本中的所有变量
 */
export const renderText = (template, user, maskingRules = {}) => {
  if (!template || typeof template !== 'string') return '';

  return template.replace(VARIABLE_REGEX, (match, fieldName, maskType, param) => {
    // 提取用户字段值
    let value = extractUserField(user, fieldName);

    // 如果指定了脱敏类型，则应用脱敏
    if (maskType) {
      value = MaskingUtils.applyMask(value, maskType, parseInt(param) || undefined);
    } else if (maskingRules[fieldName]) {
      // 尝试从masking_rules中获取脱敏规则
      value = MaskingUtils.applyMaskConfig(value, maskingRules[fieldName]);
    }

    return value;
  });
};

/**
 * 替换多行文本中的所有变量
 */
export const renderLines = (lines, user, maskingRules = {}) => {
  if (!Array.isArray(lines)) return [];
  return lines.map(line => renderText(line, user, maskingRules));
};

/**
 * 验证变量格式
 */
export const extractVariables = (text) => {
  if (!text || typeof text !== 'string') return [];

  const matches = [];
  let match;
  const regex = new RegExp(VARIABLE_REGEX);

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      full: match[0],
      field: match[1],
      maskType: match[2],
      param: match[3]
    });
  }

  return matches;
};

/**
 * 验证所有行中的变量
 */
export const validateLines = (lines) => {
  if (!Array.isArray(lines)) {
    return {
      valid: false,
      variables: [],
      errors: ['lines must be an array']
    };
  }

  const variables = new Set();
  const errors = [];

  lines.forEach((line, index) => {
    if (typeof line !== 'string') {
      errors.push(`Line ${index} is not a string`);
      return;
    }

    const vars = extractVariables(line);
    vars.forEach(v => {
      if (!SUPPORTED_FIELDS.includes(v.field)) {
        errors.push(`Line ${index}: unsupported field "${v.field}"`);
      }
      variables.add(v.field);
    });
  });

  return {
    valid: errors.length === 0,
    variables: Array.from(variables),
    errors
  };
};