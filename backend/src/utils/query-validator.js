const DEFAULT_SORT_FIELDS = ['created_at', 'updated_at', 'id'];

/**
 * 校验排序字段，防止 SQL 注入
 * @param {string} sortField - 用户传入的排序字段
 * @param {string[]} allowedFields - 允许的字段白名单
 * @param {string} defaultField - 默认值
 * @returns {string} 校验后的安全排序字段
 */
function validateSortField(sortField, allowedFields = [], defaultField = 'created_at') {
  const whitelist = [...new Set([...allowedFields, ...DEFAULT_SORT_FIELDS])];
  if (sortField && whitelist.includes(sortField)) {
    return sortField;
  }
  return defaultField;
}

/**
 * 校验排序方向
 * @param {string} order - 用户传入的排序方向
 * @returns {string} 'ASC' 或 'DESC'
 */
function validateOrder(order) {
  const upper = typeof order === 'string' ? order.toUpperCase() : '';
  return upper === 'ASC' ? 'ASC' : 'DESC';
}

module.exports = { validateSortField, validateOrder };
