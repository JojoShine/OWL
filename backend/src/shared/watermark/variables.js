const MaskingUtil = require('./masking');

/**
 * 变量替换工具库
 * 处理水印中的动态变量替换，支持用户信息和脱敏
 */
class VariableReplacementUtil {
  /**
   * 正则表达式：匹配 {{user:fieldName}} 或 {{user:fieldName|mask:maskType:param}}
   * 格式说明：
   * - {{user:username}} - 基础格式，直接替换用户字段
   * - {{user:username|mask:hide:3}} - 带脱敏格式
   */
  static VARIABLE_REGEX = /\{\{user:(\w+)(?:\|mask:(\w+):(\d+))?\}\}/g;

  /**
   * 支持的用户变量字段
   */
  static SUPPORTED_FIELDS = [
    'username',
    'realName',
    'real_name',
    'email',
    'phone',
    'department',
  ];

  /**
   * 从用户对象中提取字段值
   * @param {object} user - 用户对象
   * @param {string} fieldName - 字段名
   * @returns {string} 字段值
   */
  static extractUserField(user, fieldName) {
    if (!user) return '';

    // 处理各种可能的字段名
    let value = '';
    switch (fieldName) {
      case 'username':
        value = user.username || '';
        break;
      case 'realName':
      case 'real_name':
        value = user.realName || user.real_name || user.real_name || '';
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
      default:
        value = user[fieldName] || '';
    }

    return String(value);
  }

  /**
   * 替换单条文本中的所有变量
   * @param {string} template - 模板文本，包含变量占位符
   * @param {object} user - 用户对象，用于提供变量值
   * @param {object} maskingRules - 脱敏规则配置
   * @returns {string} 替换后的文本
   */
  static renderText(template, user, maskingRules = null) {
    if (!template || typeof template !== 'string') return '';

    return template.replace(this.VARIABLE_REGEX, (match, fieldName, maskType, param) => {
      // 提取用户字段值
      let value = this.extractUserField(user, fieldName);

      // 只有当模板中显式指定了脱敏时，才应用脱敏
      if (maskType) {
        value = MaskingUtil.applyMask(value, maskType, parseInt(param) || undefined);
      }
      // 不再从全局masking_rules中自动应用脱敏规则

      return value;
    });
  }

  /**
   * 替换多行文本中的所有变量
   * @param {array} lines - 文本行数组
   * @param {object} user - 用户对象
   * @param {object} maskingRules - 脱敏规则配置
   * @returns {array} 替换后的文本行数组
   */
  static renderLines(lines, user, maskingRules = {}) {
    if (!Array.isArray(lines)) return [];

    return lines.map(line => this.renderText(line, user, maskingRules));
  }

  /**
   * 验证变量格式
   * @param {string} text - 需要验证的文本
   * @returns {array} 找到的变量数组
   */
  static extractVariables(text) {
    if (!text || typeof text !== 'string') return [];

    const matches = [];
    let match;
    const regex = new RegExp(this.VARIABLE_REGEX);

    while ((match = regex.exec(text)) !== null) {
      matches.push({
        full: match[0],
        field: match[1],
        maskType: match[2],
        param: match[3]
      });
    }

    return matches;
  }

  /**
   * 验证所有行中的变量
   * @param {array} lines - 文本行数组
   * @returns {object} {valid, variables, errors}
   */
  static validateLines(lines) {
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

      const vars = this.extractVariables(line);
      vars.forEach(v => {
        if (!this.SUPPORTED_FIELDS.includes(v.field)) {
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
  }
}

module.exports = VariableReplacementUtil;