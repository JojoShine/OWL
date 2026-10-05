const ApiError = require('./ApiError');
class ApiParameters {
getOperationType(sql) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    return 'SELECT';
  }

validateParameters(requestParams = {}, paramDefinitions = []) {
    for (const paramDef of paramDefinitions) {
      const { name, required, type } = paramDef;

      // 检查必需参数
      if (required && (requestParams[name] === undefined || requestParams[name] === null || requestParams[name] === '')) {
        throw ApiError.badRequest(`参数 ${name} 是必需的`);
      }

      // 检查参数类型
      if (requestParams[name] !== undefined && requestParams[name] !== null && type) {
        this.validateParameterType(requestParams[name], type, name);
      }
    }

    // 特殊检查：limit 和 offset 必须是正整数
    if (requestParams.limit !== undefined && requestParams.limit !== null) {
      const limit = parseInt(requestParams.limit);
      if (isNaN(limit) || limit <= 0) {
        throw ApiError.badRequest('limit 参数必须是正整数');
      }
      // 强制转换为整数
      requestParams.limit = limit;
    }

    if (requestParams.offset !== undefined && requestParams.offset !== null) {
      const offset = parseInt(requestParams.offset);
      if (isNaN(offset) || offset < 0) {
        throw ApiError.badRequest('offset 参数必须是非负整数');
      }
      // 强制转换为整数
      requestParams.offset = offset;
    }
  }

validateParameterType(value, expectedType, paramName) {
    // 对于所有类型，只验证值不为空，数据库 会自动处理类型转换
    // 这样可以兼容从 API 传来的各种数据格式
    if (value === null || value === undefined || value === '') {
      // 空值已在前面的 validateParameters 中检查过
      return;
    }

    // 简单的格式验证，但不强制严格的类型匹配
    const normalizedType = expectedType.toLowerCase();

    switch (normalizedType) {
      case 'number':
      case 'int':
      case 'integer':
        // 允许字符串数字通过，数据库 会转换
        if (typeof value !== 'number' && typeof value !== 'string') {
          throw ApiError.badRequest(`参数 ${paramName} 必须是数字或字符串`);
        }
        if (typeof value === 'string' && isNaN(value)) {
          throw ApiError.badRequest(`参数 ${paramName} 不是有效的数字`);
        }
        break;
      case 'boolean':
        // 允许布尔值、字符串 'true'/'false'
        if (typeof value !== 'boolean' && typeof value !== 'string') {
          throw ApiError.badRequest(`参数 ${paramName} 必须是布尔值`);
        }
        break;
      case 'date':
        // 验证是否可以解析为日期
        if (isNaN(Date.parse(value))) {
          throw ApiError.badRequest(`参数 ${paramName} 不是有效的日期格式`);
        }
        break;
      // 对于 string 类型，任何值都可以转换为字符串，所以不需要验证
      default:
        // 其他类型也接受，让 数据库 处理
        break;
    }
  }

prepareReplacements(requestParams = {}, paramDefinitions = []) {
    const replacements = {};

    // 如果有参数定义，使用定义的参数
    if (paramDefinitions && Array.isArray(paramDefinitions)) {
      for (const paramDef of paramDefinitions) {
        const { name } = paramDef;
        const value = requestParams[name];

        if (value !== undefined && value !== null) {
          replacements[name] = value;
        }
      }
    }

    // 同时添加所有请求参数（兼容没有定义的情况）
    Object.keys(requestParams).forEach(key => {
      if (requestParams[key] !== undefined && requestParams[key] !== null) {
        replacements[key] = requestParams[key];
      }
    });

    return replacements;
  }
}
module.exports = ApiParameters;
