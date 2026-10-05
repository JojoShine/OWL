/**
 * 前端脱敏工具库
 * 与后端保持一致的脱敏函数实现
 */

/**
 * 隐藏：显示前N个字符，其余用*替代
 */
export const hide = (value, count = 3) => {
  if (!value) return '';
  const strValue = String(value);
  if (strValue.length <= count) return strValue;
  return strValue.substring(0, count) + '*'.repeat(strValue.length - count);
};

/**
 * 掩盖中间：显示前后各N个字符，中间用*替代
 */
export const maskMiddle = (value, showCount = 2) => {
  if (!value) return '';
  const strValue = String(value);
  if (strValue.length <= showCount * 2) return strValue;
  const start = strValue.substring(0, showCount);
  const end = strValue.substring(strValue.length - showCount);
  const masked = '*'.repeat(strValue.length - showCount * 2);
  return start + masked + end;
};

/**
 * 隐藏末尾：隐藏最后N个字符
 */
export const hideLast = (value, hideCount = 4) => {
  if (!value) return '';
  const strValue = String(value);
  const keepCount = Math.max(0, strValue.length - hideCount);
  return strValue.substring(0, keepCount) + '*'.repeat(hideCount);
};

/**
 * 完全隐藏：所有字符替代为*
 */
export const hideAll = (value) => {
  if (!value) return '';
  const strValue = String(value);
  return '*'.repeat(strValue.length);
};

/**
 * 保留首字：保留首字符，其余用*替代
 */
export const keepFirst = (value) => {
  if (!value) return '';
  const strValue = String(value);
  if (strValue.length === 1) return strValue;
  return strValue[0] + '*'.repeat(strValue.length - 1);
};

/**
 * 简单哈希（客户端）
 */
export const hash = (value) => {
  if (!value) return '';
  const strValue = String(value);
  // 客户端简单哈希，只返回长度相同的哈希值
  let hash = 0;
  for (let i = 0; i < strValue.length; i++) {
    hash = ((hash << 5) - hash) + strValue.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 6).padEnd(6, '0');
};

/**
 * 应用脱敏规则
 */
export const applyMask = (value, maskType, param) => {
  if (!value) return '';

  switch (maskType) {
    case 'hide':
      return hide(value, param || 3);
    case 'mask_middle':
      return maskMiddle(value, param || 2);
    case 'hide_last':
      return hideLast(value, param || 4);
    case 'hide_all':
      return hideAll(value);
    case 'keep_first':
      return keepFirst(value);
    case 'hash':
      return hash(value);
    default:
      return value;
  }
};

/**
 * 从配置中应用脱敏规则
 */
export const applyMaskConfig = (value, maskConfig) => {
  if (!maskConfig || !maskConfig.type) return value;
  const param = maskConfig.hideCount || maskConfig.showCount;
  return applyMask(value, maskConfig.type, param);
};