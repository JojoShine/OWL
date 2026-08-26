const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');

class ApiBuilderService {
  /**
   * 创建接口
   */
  async createInterface(data, userId) {
    const { name, description, sql_query, method, endpoint, version, parameters, require_auth, rate_limit } = data;

    try {
      const interface_ = await db.ApiInterface.create({
        name,
        description,
        sql_query,
        method: method || 'GET',
        endpoint,
        version: version || 1,
        parameters: parameters || null,
        require_auth: require_auth !== false,
        rate_limit: rate_limit || 1000,
        created_by: userId,
      });

      logger.info(`Interface created: ${interface_.id} by user ${userId}`);
      return interface_;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw ApiError.badRequest(`接口端点 ${endpoint} 版本 ${version || 1} 已存在`);
      }
      throw error;
    }
  }

  /**
   * 获取接口列表
   */
  async getInterfaces(query) {
    const { page = 1, limit = 10, search, status } = query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { endpoint: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await db.ApiInterface.findAndCountAll({
      where,
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
      ],
      offset,
      limit: parseInt(limit),
      order: [['created_at', 'DESC']],
      distinct: true,
    });

    return {
      items: rows.map(row => row.get({ plain: true })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 获取接口详情
   */
  async getInterfaceById(id) {
    const interface_ = await db.ApiInterface.findByPk(id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'username', 'real_name'],
        },
        {
          model: db.ApiKey,
          as: 'keys',
          attributes: ['id', 'client_name', 'key_prefix', 'status', 'expires_at', 'created_at'],
          through: { attributes: [] },
        },
      ],
    });

    if (!interface_) {
      throw ApiError.notFound('接口不存在');
    }

    return interface_;
  }

  /**
   * 更新接口
   */
  async updateInterface(id, data) {
    const interface_ = await this.getInterfaceById(id);

    const { name, description, sql_query, method, endpoint, version, parameters, status, require_auth, rate_limit } = data;

    try {
      await interface_.update({
        name: name !== undefined ? name : interface_.name,
        description: description !== undefined ? description : interface_.description,
        sql_query: sql_query !== undefined ? sql_query : interface_.sql_query,
        method: method !== undefined ? method : interface_.method,
        endpoint: endpoint !== undefined ? endpoint : interface_.endpoint,
        version: version !== undefined ? version : interface_.version,
        parameters: parameters !== undefined ? parameters : interface_.parameters,
        status: status !== undefined ? status : interface_.status,
        require_auth: require_auth !== undefined ? require_auth : interface_.require_auth,
        rate_limit: rate_limit !== undefined ? rate_limit : interface_.rate_limit,
      });

      logger.info(`Interface updated: ${id}`);
      return interface_;
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw ApiError.badRequest(`接口端点 ${endpoint} 版本 ${version} 已存在`);
      }
      throw error;
    }
  }

  /**
   * 删除接口
   */
  async deleteInterface(id) {
    const interface_ = await this.getInterfaceById(id);
    await interface_.destroy();

    logger.info(`Interface deleted: ${id}`);
    return { message: '接口已删除' };
  }

  /**
   * 验证SQL是否安全（防止SQL注入）
   */
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

  /**
   * 获取SQL操作类型
   */
  getOperationType(trimmedSql) {
    if (trimmedSql.startsWith('SELECT')) return 'SELECT';
    if (trimmedSql.startsWith('INSERT')) return 'INSERT';
    if (trimmedSql.startsWith('UPDATE')) return 'UPDATE';
    if (trimmedSql.startsWith('DELETE')) return 'DELETE';
    return null;
  }

  /**
   * 验证参数安全性
   */
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

  /**
   * 测试SQL查询
   */
  async testSql(sql_query, parameters = {}) {
    try {
      if (!sql_query || !sql_query.trim()) {
        throw ApiError.badRequest('SQL语句不能为空');
      }

      // 验证SQL安全性
      const operationType = this.validateSqlSafety(sql_query);

      // 验证参数安全性
      this.validateParameters(parameters);

      const sequelize = db.sequelize;
      const QueryTypes = require('sequelize').QueryTypes;

      let queryType = QueryTypes.SELECT;
      if (operationType === 'INSERT') queryType = QueryTypes.INSERT;
      else if (operationType === 'UPDATE') queryType = QueryTypes.UPDATE;
      else if (operationType === 'DELETE') queryType = QueryTypes.DELETE;

      // 执行查询
      const result = await sequelize.query(sql_query, {
        replacements: parameters,
        type: queryType,
      });

      // 根据操作类型返回不同的响应格式
      if (operationType === 'SELECT') {
        const columns = result && result.length > 0
          ? Object.keys(result[0]).map(key => ({
              name: key,
              type: typeof result[0][key],
            }))
          : [];

        return {
          success: true,
          operationType: 'SELECT',
          columns,
          rowCount: result ? result.length : 0,
          sample: result ? result.slice(0, 5) : [],
        };
      } else {
        // INSERT, UPDATE, DELETE 的结果
        return {
          success: true,
          operationType,
          affectedRows: result[1] || 0, // Sequelize 返回 [result, affectedCount]
          message: `${operationType} 操作成功`,
        };
      }
    } catch (error) {
      logger.error('Error testing SQL:', error);
      if (error.statusCode) {
        throw error;
      }
      throw ApiError.badRequest(`SQL执行失败: ${error.message}`);
    }
  }

  /**
   * 执行SQL查询（实际执行，不是测试）
   */
  async executeSql(sql_query, parameters = {}) {
    try {
      if (!sql_query || !sql_query.trim()) {
        throw ApiError.badRequest('SQL语句不能为空');
      }

      // 验证SQL安全性
      const operationType = this.validateSqlSafety(sql_query);

      // 验证参数安全性
      this.validateParameters(parameters);

      const sequelize = db.sequelize;
      const QueryTypes = require('sequelize').QueryTypes;

      let queryType = QueryTypes.SELECT;
      if (operationType === 'INSERT') queryType = QueryTypes.INSERT;
      else if (operationType === 'UPDATE') queryType = QueryTypes.UPDATE;
      else if (operationType === 'DELETE') queryType = QueryTypes.DELETE;

      // 执行查询
      const result = await sequelize.query(sql_query, {
        replacements: parameters,
        type: queryType,
      });

      // 记录SQL执行日志
      logger.info(`SQL executed: ${operationType}`, {
        affectedRows: result[1] || 0,
        timestamp: new Date().toISOString(),
      });

      // 根据操作类型返回不同的响应格式
      if (operationType === 'SELECT') {
        const columns = result && result.length > 0
          ? Object.keys(result[0]).map(key => ({
              name: key,
              type: typeof result[0][key],
            }))
          : [];

        return {
          success: true,
          operationType: 'SELECT',
          columns,
          rowCount: result ? result.length : 0,
          data: result || [],
        };
      } else {
        return {
          success: true,
          operationType,
          affectedRows: result[1] || 0,
          message: `${operationType} 操作成功，受影响行数: ${result[1] || 0}`,
        };
      }
    } catch (error) {
      logger.error('Error executing SQL:', error);
      if (error.statusCode) {
        throw error;
      }
      throw ApiError.badRequest(`SQL执行失败: ${error.message}`);
    }
  }
}

module.exports = new ApiBuilderService();
