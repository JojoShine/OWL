/**
 * Zabbix实例管理Controller
 * 模块归属：Zabbix集成模块
 * 使用场景：处理Zabbix实例相关的HTTP请求
 */
const zabbixService = require('./zabbix.service');
const { logger } = require('../../../config/logger');
const { success, paginated, created } = require('../../../utils/response');

/**
 * 获取实例列表
 * GET /api/system/zabbix
 */
exports.getList = async (req, res, next) => {
  try {
    const { page, pageSize, name, status } = req.query;

    const result = await zabbixService.listInstances({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      name: name || '',
      status: status || '',
    });

    paginated(res, result.rows, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }, '获取Zabbix实例列表成功');
  } catch (error) {
    logger.error('获取Zabbix实例列表失败:', error);
    next(error);
  }
};

/**
 * 获取实例详情
 * GET /api/system/zabbix/:id
 */
exports.getOne = async (req, res, next) => {
  try {
    const { id } = req.params;
    const instance = await zabbixService.getInstance(id);

    success(res, instance, '获取Zabbix实例详情成功');
  } catch (error) {
    logger.error('获取Zabbix实例详情失败:', error);
    next(error);
  }
};

/**
 * 创建实例
 * POST /api/system/zabbix
 */
exports.create = async (req, res, next) => {
  try {
    const { name, url, api_token, sync_interval, description } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new Error('无法获取当前用户信息');
    }

    const instance = await zabbixService.createInstance(
      { name, url, api_token, sync_interval, description },
      userId
    );

    logger.info('Zabbix实例创建', {
      instanceId: instance.id,
      instanceName: instance.name,
      createdBy: userId,
    });

    created(res, instance, 'Zabbix实例创建成功');
  } catch (error) {
    logger.error('创建Zabbix实例失败:', error);
    next(error);
  }
};

/**
 * 更新实例
 * PUT /api/system/zabbix/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, url, api_token, sync_interval, description, status } = req.body;

    const instance = await zabbixService.updateInstance(id, {
      name, url, api_token, sync_interval, description, status,
    });

    logger.info('Zabbix实例更新', {
      instanceId: id,
      instanceName: instance.name,
    });

    success(res, instance, 'Zabbix实例更新成功');
  } catch (error) {
    logger.error('更新Zabbix实例失败:', error);
    next(error);
  }
};

/**
 * 删除实例
 * DELETE /api/system/zabbix/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    await zabbixService.deleteInstance(id);

    logger.info('Zabbix实例删除', { instanceId: id });

    success(res, null, 'Zabbix实例删除成功');
  } catch (error) {
    logger.error('删除Zabbix实例失败:', error);
    next(error);
  }
};

/**
 * 测试连接
 * POST /api/system/zabbix/:id/test
 */
exports.testConnection = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await zabbixService.testConnection(id);

    success(res, result, result.message);
  } catch (error) {
    logger.error('Zabbix连接测试失败:', error);
    next(error);
  }
};

/**
 * 手动同步
 * POST /api/system/zabbix/:id/sync
 */
exports.sync = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await zabbixService.syncInstance(id);

    success(res, result, result.message);
  } catch (error) {
    logger.error('Zabbix同步失败:', error);
    next(error);
  }
};

/**
 * 获取主机列表
 * GET /api/system/zabbix/:id/hosts
 */
exports.getHosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page, pageSize, name } = req.query;

    const result = await zabbixService.getHosts(id, {
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 20,
      name: name || '',
    });

    paginated(res, result.rows, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }, '获取主机列表成功');
  } catch (error) {
    logger.error('获取Zabbix主机列表失败:', error);
    next(error);
  }
};

/**
 * 获取主机详情 + 监控项
 * GET /api/system/zabbix/:id/hosts/:hostId
 */
exports.getHostDetail = async (req, res, next) => {
  try {
    const { id, hostId } = req.params;

    const result = await zabbixService.getHostDetail(id, hostId);

    success(res, result, '获取主机详情成功');
  } catch (error) {
    logger.error('获取Zabbix主机详情失败:', error);
    next(error);
  }
};

/**
 * 获取问题/告警列表
 * GET /api/system/zabbix/:id/problems
 */
exports.getProblems = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hostids, severity_min, limit } = req.query;

    const result = await zabbixService.getProblems(id, {
      hostids: hostids ? hostids.split(',') : undefined,
      severity_min: severity_min ? parseInt(severity_min) : undefined,
      limit: limit ? parseInt(limit) : 50,
    });

    success(res, result, '获取问题列表成功');
  } catch (error) {
    logger.error('获取Zabbix问题列表失败:', error);
    next(error);
  }
};
