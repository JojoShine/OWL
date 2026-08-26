const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');

class ApiBuilderExecutorService {
  /**
   * 获取SQL操作类型
   */
  getOperationType(sql) {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT')) return 'SELECT';
    if (trimmed.startsWith('INSERT')) return 'INSERT';
    if (trimmed.startsWith('UPDATE')) return 'UPDATE';
    if (trimmed.startsWith('DELETE')) return 'DELETE';
    return 'SELECT';
  }

  /**
   * 执行接口SQL查询
   * @param {Object} interface_ - 接口配置对象
   * @param {Object} params - 请求参数
   * @param {string} ipAddress - 请求来源IP
   * @returns {Promise<Object>} 查询结果
   */
  async executeInterface(interface_, params, ipAddress = null, apiKeyId = null) {
    const startTime = Date.now();
    let responseCode = 200;
    let errorMessage = null;
    let result = null;

    try {
      // 验证接口状态
      if (interface_.status === 'inactive') {
        throw ApiError.forbidden('接口已禁用');
      }

      // 验证参数
      if (interface_.parameters && Array.isArray(interface_.parameters)) {
        this.validateParameters(params, interface_.parameters);
      }

      // 准备参数化查询的替换值
      const replacements = this.prepareReplacements(params, interface_.parameters);

      // 获取操作类型
      const operationType = this.getOperationType(interface_.sql_query);

      // 执行SQL查询（使用参数化查询，防止SQL注入）
      const QueryTypes = require('sequelize').QueryTypes;
      let queryType = QueryTypes.SELECT;

      if (operationType === 'INSERT') queryType = QueryTypes.INSERT;
      else if (operationType === 'UPDATE') queryType = QueryTypes.UPDATE;
      else if (operationType === 'DELETE') queryType = QueryTypes.DELETE;

      const queryResult = await db.sequelize.query(interface_.sql_query, {
        replacements,
        type: queryType,
      });

      // 处理结果
      if (operationType === 'SELECT') {
        result = queryResult;
      } else {
        // INSERT, UPDATE, DELETE 返回受影响行数
        result = {
          operationType,
          affectedRows: queryResult[1] || 0,
          message: `${operationType} 操作成功，受影响行数: ${queryResult[1] || 0}`,
        };
      }

      responseCode = 200;

      logger.info(`API executed successfully: ${interface_.endpoint} v${interface_.version} - ${operationType}`);
    } catch (error) {
      responseCode = error.statusCode || 500;
      errorMessage = error.message || 'SQL execution failed';
      logger.error(`Error executing API: ${interface_.endpoint}`, error);
      throw error;
    } finally {
      // 异步记录日志（不阻塞响应）
      const responseTime = Date.now() - startTime;
      const operationType = this.getOperationType(interface_.sql_query);
      this.logApiCall(interface_.id, apiKeyId, operationType, params, responseCode, responseTime, errorMessage, ipAddress);
    }

    return result;
  }

  /**
   * 测试接口（带日志记录）
   */
  async testInterface(interface_, params, ipAddress = null, apiKeyId = null) {
    const startTime = Date.now();
    let responseCode = 200;
    let errorMessage = null;
    let result = null;

    try {
      // 验证接口状态
      if (interface_.status === 'inactive') {
        throw ApiError.forbidden('接口已禁用');
      }

      // 验证参数
      if (interface_.parameters && Array.isArray(interface_.parameters)) {
        this.validateParameters(params, interface_.parameters);
      }

      // 准备参数化查询的替换值
      const replacements = this.prepareReplacements(params, interface_.parameters);

      // 获取操作类型
      const operationType = this.getOperationType(interface_.sql_query);

      // 执行SQL查询（使用参数化查询，防止SQL注入）
      const QueryTypes = require('sequelize').QueryTypes;
      let queryType = QueryTypes.SELECT;

      if (operationType === 'INSERT') queryType = QueryTypes.INSERT;
      else if (operationType === 'UPDATE') queryType = QueryTypes.UPDATE;
      else if (operationType === 'DELETE') queryType = QueryTypes.DELETE;

      const queryResult = await db.sequelize.query(interface_.sql_query, {
        replacements,
        type: queryType,
      });

      // 处理结果
      if (operationType === 'SELECT') {
        result = queryResult;
      } else {
        // INSERT, UPDATE, DELETE 返回受影响行数
        result = {
          operationType,
          affectedRows: queryResult[1] || 0,
          message: `${operationType} 操作成功，受影响行数: ${queryResult[1] || 0}`,
        };
      }

      responseCode = 200;

      logger.info(`API test successful: ${interface_.endpoint} v${interface_.version} - ${operationType}`);
    } catch (error) {
      responseCode = error.statusCode || 500;
      errorMessage = error.message || 'SQL execution failed';
      logger.error(`Error testing API: ${interface_.endpoint}`, error);
      throw error;
    } finally {
      // 异步记录日志
      const responseTime = Date.now() - startTime;
      const operationType = this.getOperationType(interface_.sql_query);
      this.logApiCall(interface_.id, apiKeyId, operationType, params, responseCode, responseTime, errorMessage, ipAddress);
    }

    return result;
  }

  /**
   * 验证请求参数是否满足定义要求
   */
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

  /**
   * 验证单个参数的类型
   * 注：Sequelize 会自动进行类型转换，所以这里验证比较宽松
   */
  validateParameterType(value, expectedType, paramName) {
    // 对于所有类型，只验证值不为空，Sequelize 会自动处理类型转换
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
        // 允许字符串数字通过，Sequelize 会转换
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
        // 其他类型也接受，让 Sequelize 处理
        break;
    }
  }

  /**
   * 准备参数化查询的替换值（使用 Sequelize 参数化查询，防止 SQL 注入）
   * @param {Object} requestParams - 请求参数
   * @param {Array} paramDefinitions - 参数定义
   * @returns {Object} replacements 对象
   */
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

  /**
   * 异步记录API调用日志
   * 不阻塞主流程
   */
  logApiCall(interfaceId, apiKeyId, method, params, responseCode, responseTime, errorMessage, ipAddress) {
    // 异步执行，不等待完成
    setImmediate(async () => {
      try {
        await db.ApiCallLog.create({
          interface_id: interfaceId,
          api_key_id: apiKeyId,
          request_method: method,
          response_code: responseCode,
          response_time: responseTime,
          error_message: errorMessage,
          ip_address: ipAddress,
        });
        logger.info('API Call Log', {
          interfaceId,
          apiKeyId,
          method,
          responseCode,
          responseTime,
          errorMessage,
          ipAddress,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Error logging API call:', error);
      }
    });
  }
}

module.exports = new ApiBuilderExecutorService();
