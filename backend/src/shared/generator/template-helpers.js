/**
 * 模板辅助工具类
 * 提供字段类型映射、验证规则生成等功能
 */

/**
 * PostgreSQL 数据类型映射
 */
const TYPE_MAPPINGS = {
  // 字符串类型
  'character varying': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },
  'varchar': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },
  'character': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },
  'char': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },
  'text': { joi: 'string', zod: 'string', formComponent: 'textarea', searchComponent: 'input' },

  // 数值类型
  'integer': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'bigint': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'smallint': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'numeric': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'decimal': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'real': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },
  'double precision': { joi: 'number', zod: 'number', formComponent: 'input', searchComponent: 'number' },

  // 布尔类型
  'boolean': { joi: 'boolean', zod: 'boolean', formComponent: 'select', searchComponent: 'select' },

  // 日期时间类型
  'date': { joi: 'date', zod: 'string', formComponent: 'date', searchComponent: 'date' },
  'timestamp without time zone': { joi: 'date', zod: 'string', formComponent: 'datetime', searchComponent: 'datetime' },
  'timestamp with time zone': { joi: 'date', zod: 'string', formComponent: 'datetime', searchComponent: 'datetime' },
  'time without time zone': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },
  'time with time zone': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },

  // UUID类型
  'uuid': { joi: 'string', zod: 'string', formComponent: 'input', searchComponent: 'input' },

  // JSON类型
  'json': { joi: 'object', zod: 'any', formComponent: 'textarea', searchComponent: 'input' },
  'jsonb': { joi: 'object', zod: 'any', formComponent: 'textarea', searchComponent: 'input' },
};

/**
 * 获取字段的 Joi 验证类型
 * @param {String} dbType - 数据库字段类型
 * @returns {String} Joi 类型
 */
function getJoiType(dbType) {
  const mapping = TYPE_MAPPINGS[dbType.toLowerCase()];
  return mapping ? mapping.joi : 'string';
}

/**
 * 获取字段的 Zod 验证类型
 * @param {String} dbType - 数据库字段类型
 * @returns {String} Zod 类型
 */
function getZodType(dbType) {
  const mapping = TYPE_MAPPINGS[dbType.toLowerCase()];
  return mapping ? mapping.zod : 'string';
}

/**
 * 获取字段的表单组件类型
 * @param {String} dbType - 数据库字段类型
 * @param {Object} options - 额外选项
 * @returns {String} 表单组件类型
 */
function getFormComponent(dbType, options = {}) {
  const mapping = TYPE_MAPPINGS[dbType.toLowerCase()];

  // 如果有枚举值选项，使用 select
  if (options.hasEnum) {
    return 'select';
  }

  return mapping ? mapping.formComponent : 'input';
}

/**
 * 获取字段的搜索组件类型
 * @param {String} dbType - 数据库字段类型
 * @returns {String} 搜索组件类型
 */
function getSearchComponent(dbType) {
  const mapping = TYPE_MAPPINGS[dbType.toLowerCase()];
  return mapping ? mapping.searchComponent : 'input';
}

/**
 * 判断字段类型是否适合范围搜索
 * @param {String} dbType - 数据库字段类型
 * @returns {Boolean} 是否适合范围搜索
 */
function isRangeSearchType(dbType) {
  const rangeTypes = ['integer', 'bigint', 'smallint', 'numeric', 'decimal', 'real', 'double precision', 'date', 'timestamp without time zone', 'timestamp with time zone'];
  return rangeTypes.includes(dbType.toLowerCase());
}

/**
 * 判断字段类型是否适合模糊搜索
 * @param {String} dbType - 数据库字段类型
 * @returns {Boolean} 是否适合模糊搜索
 */
function isLikeSearchType(dbType) {
  const likeTypes = ['character varying', 'varchar', 'character', 'char', 'text'];
  return likeTypes.includes(dbType.toLowerCase());
}

/**
 * 获取字段的默认搜索类型
 * @param {String} dbType - 数据库字段类型
 * @returns {String} 搜索类型 (like/exact/range)
 */
function getDefaultSearchType(dbType) {
  if (isLikeSearchType(dbType)) {
    return 'like';
  } else if (isRangeSearchType(dbType)) {
    return 'range';
  } else {
    return 'exact';
  }
}

/**
 * 获取字段的格式化类型
 * @param {String} dbType - 数据库字段类型
 * @param {String} fieldName - 字段名称
 * @returns {String|null} 格式化类型
 */
function getFormatType(dbType, fieldName = '') {
  const lowerFieldName = fieldName.toLowerCase();

  // 日期类型
  if (dbType === 'date') {
    return 'date';
  }
  if (dbType.includes('timestamp')) {
    return 'datetime';
  }

  // 货币类型（根据字段名判断）
  if (lowerFieldName.includes('price') || lowerFieldName.includes('amount') || lowerFieldName.includes('cost')) {
    return 'currency';
  }

  // 百分比类型（根据字段名判断）
  if (lowerFieldName.includes('rate') || lowerFieldName.includes('percent')) {
    return 'percentage';
  }

  return null;
}

/**
 * 判断字段是否应该被排除（系统字段）
 * @param {String} fieldName - 字段名称
 * @returns {Boolean} 是否应该被排除
 */
function isSystemField(fieldName) {
  const systemFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];
  return systemFields.includes(fieldName.toLowerCase());
}

/**
 * 判断字段是否为只读字段
 * @param {String} fieldName - 字段名称
 * @returns {Boolean} 是否为只读字段
 */
function isReadonlyField(fieldName) {
  const readonlyFields = ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];
  return readonlyFields.includes(fieldName.toLowerCase());
}

/**
 * Handlebars 自定义辅助函数
 */
const handlebarsHelpers = {
  /**
   * 相等比较
   */
  eq: (a, b) => a === b,

  /**
   * 不相等比较
   */
  ne: (a, b) => a !== b,

  /**
   * 逻辑或
   */
  or: (...args) => {
    // 最后一个参数是 Handlebars 的 options 对象
    const options = args.pop();
    return args.some(Boolean);
  },

  /**
   * 逻辑与
   */
  and: (...args) => {
    const options = args.pop();
    return args.every(Boolean);
  },

  /**
   * 大于
   */
  gt: (a, b) => a > b,

  /**
   * 小于
   */
  lt: (a, b) => a < b,

  /**
   * 大于等于
   */
  gte: (a, b) => a >= b,

  /**
   * 小于等于
   */
  lte: (a, b) => a <= b,

  /**
   * 包含
   */
  includes: (array, value) => {
    if (!Array.isArray(array)) return false;
    return array.includes(value);
  },

  /**
   * 首字母大写
   */
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * 驼峰转下划线
   */
  camelToSnake: (str) => {
    if (!str) return '';
    return str.replace(/([A-Z])/g, '_$1').toLowerCase();
  },

  /**
   * 下划线转驼峰
   */
  snakeToCamel: (str) => {
    if (!str) return '';
    return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  },

  /**
   * 连字符转驼峰 (用于变量名)
   * 例如: test-products -> testProducts
   */
  dashToCamel: (str) => {
    if (!str) return '';
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  },

  /**
   * JSON 字符串化
   */
  json: (obj) => {
    return JSON.stringify(obj, null, 2);
  },

  /**
   * 加法运算
   */
  add: (a, b) => {
    return (a || 0) + (b || 0);
  },

  /**
   * 减法运算
   */
  subtract: (a, b) => {
    return (a || 0) - (b || 0);
  },

  /**
   * 映射数据库类型到 Sequelize 类型
   */
  toSequelizeType: (dbType, columnInfo) => {
    return getSequelizeType(dbType, columnInfo);
  },

  /**
   * 判断是否为字符串类型
   */
  isString: (value) => {
    return typeof value === 'string';
  },
};

module.exports = {
  getJoiType,
  getZodType,
  getFormComponent,
  getSearchComponent,
  isRangeSearchType,
  isLikeSearchType,
  getDefaultSearchType,
  getFormatType,
  isSystemField,
  isReadonlyField,
  handlebarsHelpers,
};
