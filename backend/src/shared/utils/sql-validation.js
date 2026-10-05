const ApiError = require('./ApiError');
class SqlValidation {
validateSqlSafety(sql_query) {
    const trimmedSql = sql_query.trim().toUpperCase();

    // 检查操作类型
    const operationType = this.getOperationType(trimmedSql);
    if (!operationType) {
      throw ApiError.badRequest('仅支持 SELECT、INSERT、UPDATE、DELETE 操作');
    }

    // 黑名单检查 - 禁止危险操作
    const dangerousPatterns = [
      /DROP\s+TABLE/i,
      /DROP\s+DATABASE/i,
      /TRUNCATE\s+TABLE/i,
      /ALTER\s+TABLE/i,
      /EXEC\s*\(/i,
      /EXECUTE\s*\(/i,
      /CREATE\s+TABLE/i,
      /CREATE\s+DATABASE/i,
      /CREATE\s+VIEW/i,
      /GRANT\s+/i,
      /REVOKE\s+/i,
      /;[\s\n]*(DROP|DELETE|TRUNCATE|ALTER)/i, // 多语句检查
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql_query)) {
        throw ApiError.forbidden('不允许执行此操作，涉及危险SQL语句');
      }
    }

    return operationType;
  }

getOperationType(trimmedSql) {
    if (trimmedSql.startsWith('SELECT')) return 'SELECT';
    if (trimmedSql.startsWith('INSERT')) return 'INSERT';
    if (trimmedSql.startsWith('UPDATE')) return 'UPDATE';
    if (trimmedSql.startsWith('DELETE')) return 'DELETE';
    return null;
  }

validateParameters(parameters) {
    if (!parameters || typeof parameters !== 'object') return;

    for (const [key, value] of Object.entries(parameters)) {
      // 检查参数名称只包含字母、数字、下划线
      if (!/^[a-zA-Z0-9_]+$/.test(key)) {
        throw ApiError.badRequest(`参数名无效: ${key}`);
      }

      // 检查参数值长度（防止超大值）
      if (typeof value === 'string' && value.length > 10000) {
        throw ApiError.badRequest(`参数值过长: ${key}`);
      }
    }
  }
}
module.exports = SqlValidation;
