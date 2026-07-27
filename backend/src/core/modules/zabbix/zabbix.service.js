/**
 * Zabbix实例管理Service
 * 模块归属：Zabbix集成模块
 * 使用场景：Zabbix实例的CRUD操作、测试连接、手动同步
 */
const { v4: uuidv4 } = require('uuid');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { createClient } = require('./zabbix-client');
const { Op } = require('sequelize');

/**
 * 获取实例列表
 * @param {object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.pageSize - 每页数量
 * @param {string} options.name - 名称模糊搜索
 * @param {string} options.status - 状态筛选
 * @returns {Promise<object>} 分页结果
 */
async function listInstances({ page = 1, pageSize = 10, name = '', status = '' }) {
  const where = {};

  if (name && name.trim()) {
    where.name = { [Op.iLike]: `%${name}%` };
  }

  if (status && status.trim()) {
    where.status = status;
  }

  const offset = (page - 1) * pageSize;

  const { count, rows } = await db.ZabbixInstance.findAndCountAll({
    where,
    offset,
    limit: pageSize,
    order: [['created_at', 'DESC']],
    attributes: { exclude: ['api_token'] }, // 列表不返回token
  });

  return {
    rows,
    total: count,
    page,
    pageSize,
  };
}

/**
 * 获取实例详情
 * @param {string} id - 实例ID
 * @returns {Promise<object>} 实例详情
 */
async function getInstance(id) {
  const instance = await db.ZabbixInstance.findByPk(id, {
    attributes: { exclude: ['api_token'] }, // 详情不返回token
  });

  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  return instance;
}

/**
 * 创建实例
 * @param {object} data - 实例数据
 * @param {string} userId - 创建者ID
 * @returns {Promise<object>} 创建的实例
 */
async function createInstance({ name, url, api_token, sync_interval, description }, userId) {
  // 检查名称是否重复
  const existing = await db.ZabbixInstance.findOne({ where: { name } });
  if (existing) {
    throw ApiError.badRequest('实例名称已存在');
  }

  const instance = await db.ZabbixInstance.create({
    id: uuidv4(),
    name,
    url,
    api_token,
    sync_interval: sync_interval || 60,
    description: description || '',
    status: 'active',
    created_by: userId,
  });

  return {
    id: instance.id,
    name: instance.name,
    url: instance.url,
    status: instance.status,
    sync_interval: instance.sync_interval,
    description: instance.description,
    created_at: instance.created_at,
  };
}

/**
 * 更新实例
 * @param {string} id - 实例ID
 * @param {object} data - 更新数据
 * @returns {Promise<object>} 更新后的实例
 */
async function updateInstance(id, { name, url, api_token, sync_interval, description, status }) {
  const instance = await db.ZabbixInstance.findByPk(id);

  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  // 如果修改名称，检查是否重复
  if (name && name !== instance.name) {
    const existing = await db.ZabbixInstance.findOne({ where: { name } });
    if (existing) {
      throw ApiError.badRequest('实例名称已存在');
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (url !== undefined) updateData.url = url;
  if (api_token !== undefined) updateData.api_token = api_token;
  if (sync_interval !== undefined) updateData.sync_interval = sync_interval;
  if (description !== undefined) updateData.description = description;
  if (status !== undefined) updateData.status = status;

  await instance.update(updateData);

  return {
    id: instance.id,
    name: instance.name,
    url: instance.url,
    status: instance.status,
    sync_interval: instance.sync_interval,
    description: instance.description,
    updated_at: instance.updated_at,
  };
}

/**
 * 删除实例
 * @param {string} id - 实例ID
 * @returns {Promise<boolean>}
 */
async function deleteInstance(id) {
  const instance = await db.ZabbixInstance.findByPk(id);

  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  await instance.destroy();
  return true;
}

/**
 * 测试连接
 * @param {string} id - 实例ID
 * @returns {Promise<object>} 测试结果
 */
async function testConnection(id) {
  const instance = await db.ZabbixInstance.findByPk(id);

  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  const client = createClient(instance.url, instance.api_token);
  const result = await client.testConnection();

  logger.info('Zabbix连接测试', {
    instanceId: id,
    instanceName: instance.name,
    success: result.success,
  });

  return result;
}

/**
 * 手动同步（更新last_sync_at）
 * @param {string} id - 实例ID
 * @returns {Promise<object>} 同步结果
 */
async function syncInstance(id) {
  const instance = await db.ZabbixInstance.findByPk(id);

  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  // 测试连接
  const client = createClient(instance.url, instance.api_token);
  const testResult = await client.testConnection();

  if (!testResult.success) {
    throw ApiError.badRequest(`同步失败: ${testResult.message}`);
  }

  // 更新同步时间
  await instance.update({ last_sync_at: new Date() });

  logger.info('Zabbix手动同步', {
    instanceId: id,
    instanceName: instance.name,
  });

  return {
    success: true,
    message: '同步成功',
    last_sync_at: instance.last_sync_at,
  };
}

/**
 * 获取同步的主机列表（从本地DB）
 * @param {string} instanceId - Zabbix实例ID
 * @param {object} options - 查询选项
 * @returns {Promise<object>} 主机列表
 */
async function getHosts(instanceId, { page = 1, pageSize = 20, name = '' }) {
  const instance = await db.ZabbixInstance.findByPk(instanceId);
  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  const where = { instance_id: instanceId };
  if (name && name.trim()) {
    where.name = { [Op.iLike]: `%${name}%` };
  }

  const offset = (page - 1) * pageSize;
  const { count, rows } = await db.ZabbixHost.findAndCountAll({
    where,
    offset,
    limit: pageSize,
    order: [['name', 'ASC']],
  });

  return { rows, total: count, page, pageSize };
}

/**
 * 获取主机详情 + 监控项（实时从Zabbix API）
 * @param {string} instanceId - Zabbix实例ID
 * @param {string} hostId - Zabbix主机ID
 * @returns {Promise<object>} 主机详情
 */
async function getHostDetail(instanceId, hostId) {
  const instance = await db.ZabbixInstance.findByPk(instanceId);
  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  const client = createClient(instance.url, instance.api_token);

  // 获取主机信息
  const hosts = await client.getHosts({
    hostids: [hostId],
    selectInterfaces: true,
    selectGroups: true,
  });

  if (!hosts || hosts.length === 0) {
    throw ApiError.notFound('Zabbix主机不存在');
  }

  const host = hosts[0];

  // 获取主机的监控项
  const items = await client.getItems({
    hostids: [hostId],
    sortfield: 'name',
  });

  return { host, items };
}

/**
 * 获取当前问题/告警列表（实时从Zabbix API）
 * @param {string} instanceId - Zabbix实例ID
 * @param {object} options - 查询选项
 * @returns {Promise<object>} 问题列表
 */
async function getProblems(instanceId, { hostids, severity_min, limit = 50 }) {
  const instance = await db.ZabbixInstance.findByPk(instanceId);
  if (!instance) {
    throw ApiError.notFound('Zabbix实例不存在');
  }

  const client = createClient(instance.url, instance.api_token);

  const options = {
    hostids: hostids || undefined,
    severity_min: severity_min || undefined,
    limit,
  };

  const problems = await client.getProblems(options);

  return problems;
}

module.exports = {
  listInstances,
  getInstance,
  createInstance,
  updateInstance,
  deleteInstance,
  testConnection,
  syncInstance,
  getHosts,
  getHostDetail,
  getProblems,
};
