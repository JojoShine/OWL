const crypto = require('crypto');

/**
 * 脱敏工具库
 * 提供各种脱敏函数用于隐藏敏感信息
 */
class MaskingUtil {
  /**
   * 隐藏：显示前N个字符，其余用*替代
   * @param {string} value - 需要脱敏的值
   * @param {number} count - 显示的字符数（默认3）
   * @returns {string} 脱敏后的值
   */
  static hide(value, count = 3) {
    if (!value) return '';
    const strValue = String(value);
    if (strValue.length <= count) return strValue;
    return strValue.substring(0, count) + '*'.repeat(strValue.length - count);
  }

  /**
   * 掩盖中间：显示前后各N个字符，中间用*替代
   * @param {string} value - 需要脱敏的值
   * @param {number} showCount - 前后各显示的字符数（默认2）
   * @returns {string} 脱敏后的值
   */
  static maskMiddle(value, showCount = 2) {
    if (!value) return '';
    const strValue = String(value);
    if (strValue.length <= showCount * 2) return strValue;
    const start = strValue.substring(0, showCount);
    const end = strValue.substring(strValue.length - showCount);
    const masked = '*'.repeat(strValue.length - showCount * 2);
    return start + masked + end;
  }

  /**
   * 隐藏末尾：隐藏最后N个字符
   * @param {string} value - 需要脱敏的值
   * @param {number} hideCount - 隐藏的字符数（默认4）
   * @returns {string} 脱敏后的值
   */
  static hideLast(value, hideCount = 4) {
    if (!value) return '';
    const strValue = String(value);
    const keepCount = Math.max(0, strValue.length - hideCount);
    return strValue.substring(0, keepCount) + '*'.repeat(hideCount);
  }

  /**
   * 完全隐藏：所有字符替代为*
   * @param {string} value - 需要脱敏的值
   * @returns {string} 脱敏后的值（全是*）
   */
  static hideAll(value) {
    if (!value) return '';
    const strValue = String(value);
    return '*'.repeat(strValue.length);
  }

  /**
   * 保留首字：保留首字符，其余用*替代
   * @param {string} value - 需要脱敏的值
   * @returns {string} 脱敏后的值
   */
  static keepFirst(value) {
    if (!value) return '';
    const strValue = String(value);
    if (strValue.length === 1) return strValue;
    return strValue[0] + '*'.repeat(strValue.length - 1);
  }

  /**
   * 加密哈希：返回哈希值前6位
   * @param {string} value - 需要脱敏的值
   * @returns {string} 哈希值前6位
   */
  static hash(value) {
    if (!value) return '';
    const strValue = String(value);
    return crypto
      .createHash('sha256')
      .update(strValue)
      .digest('hex')
      .substring(0, 6);
  }

  /**
   * 应用脱敏规则
   * @param {string} value - 原始值
   * @param {string} maskType - 脱敏类型 (hide|mask_middle|hide_last|hide_all|keep_first|hash)
   * @param {number} param - 脱敏参数（hideCount或showCount）
   * @returns {string} 脱敏后的值
   */
  static applyMask(value, maskType, param) {
    if (!value) return '';

    switch (maskType) {
      case 'hide':
        return this.hide(value, param || 3);
      case 'mask_middle':
        return this.maskMiddle(value, param || 2);
      case 'hide_last':
        return this.hideLast(value, param || 4);
      case 'hide_all':
        return this.hideAll(value);
      case 'keep_first':
        return this.keepFirst(value);
      case 'hash':
        return this.hash(value);
      default:
        return value;
    }
  }

  /**
   * 从配置中应用脱敏规则
   * @param {string} value - 原始值
   * @param {object} maskConfig - 脱敏配置 {type, hideCount|showCount}
   * @returns {string} 脱敏后的值
   */
  static applyMaskConfig(value, maskConfig) {
    if (!maskConfig || !maskConfig.type) return value;

    const param = maskConfig.hideCount || maskConfig.showCount;
    return this.applyMask(value, maskConfig.type, param);
  }
}

module.exports = MaskingUtil;