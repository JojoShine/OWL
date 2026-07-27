/**
 * Zabbix数据同步服务
 * 模块归属：Zabbix集成模块
 * 使用场景：定时从Zabbix同步主机列表、监控数据
 */
const db = require('../../../models');
const { logger } = require('../../../config/logger');
const { createClient } = require('./zabbix-client');

/**
 * 同步单个实例的主机列表
 * @param {object} instance - ZabbixInstance记录（需包含api_token）
 * @returns {Promise<object>} 同步结果
 */
async function syncHosts(instance) {
  const client = createClient(instance.url, instance.api_token);

  // 获取主机列表（包含接口信息和主机组）
  const hosts = await client.getHosts({
    selectInterfaces: true,
    selectGroups: true,
  });

  let created = 0;
  let updated = 0;

  for (const zHost of hosts) {
    // 提取IP地址
    const ip = zHost.interfaces?.[0]?.ip || '';

    // 提取主机组名称
    const groupNames = (zHost.groups || []).map(g => g.name);

    // Zabbix主机状态: 0=启用, 1=禁用
    const status = zHost.status === '0' ? 'available' : 'unavailable';

    const existing = await db.ZabbixHost.findOne({
      where: {
        instance_id: instance.id,
        zabbix_hostid: zHost.hostid,
      },
    });

    if (existing) {
      await existing.update({
        host: zHost.host,
        name: zHost.name,
        status,
        ip_address: ip,
        groups: groupNames,
        last_sync_at: new Date(),
      });
      updated++;
    } else {
      await db.ZabbixHost.create({
        instance_id: instance.id,
        zabbix_hostid: zHost.hostid,
        host: zHost.host,
        name: zHost.name,
        status,
        ip_address: ip,
        groups: groupNames,
        last_sync_at: new Date(),
      });
      created++;
    }
  }

  // 更新实例的最后同步时间
  await db.ZabbixInstance.update(
    { last_sync_at: new Date() },
    { where: { id: instance.id } }
  );

  logger.info('Zabbix主机同步完成', {
    instanceId: instance.id,
    instanceName: instance.name,
    total: hosts.length,
    created,
    updated,
  });

  return { total: hosts.length, created, updated };
}

/**
 * 同步所有活跃实例
 * @returns {Promise<object>} 同步结果汇总
 */
async function syncAllInstances() {
  const instances = await db.ZabbixInstance.findAll({
    where: { status: 'active' },
  });

  const results = {};

  for (const instance of instances) {
    try {
      results[instance.name] = await syncHosts(instance);
    } catch (error) {
      logger.error(`同步实例 ${instance.name} 失败:`, error.message);
      results[instance.name] = { error: error.message };
    }
  }

  return results;
}

/**
 * 启动定时同步
 * 为每个活跃实例按照其sync_interval定时同步
 */
let syncTimers = [];

function startSyncScheduler() {
  // 清除已有的定时器
  stopSyncScheduler();

  db.ZabbixInstance.findAll({
    where: { status: 'active' },
  }).then(instances => {
    for (const instance of instances) {
      const intervalMs = (instance.sync_interval || 60) * 1000;

      const timer = setInterval(async () => {
        try {
          // 重新获取实例数据（确保token等信息是最新的）
          const fresh = await db.ZabbixInstance.findByPk(instance.id);
          if (fresh && fresh.status === 'active') {
            await syncHosts(fresh);
          }
        } catch (error) {
          logger.error(`定时同步 ${instance.name} 失败:`, error.message);
        }
      }, intervalMs);

      syncTimers.push(timer);
      logger.info(`已启动 ${instance.name} 的定时同步，间隔 ${instance.sync_interval}s`);
    }
  }).catch(error => {
    logger.error('启动同步调度器失败:', error.message);
  });
}

function stopSyncScheduler() {
  for (const timer of syncTimers) {
    clearInterval(timer);
  }
  syncTimers = [];
}

module.exports = {
  syncHosts,
  syncAllInstances,
  startSyncScheduler,
  stopSyncScheduler,
};
