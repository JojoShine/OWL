const { Client } = require('ssh2');
const net = require('net');
const { ServerMonitor, ServerMonitorPort, ServerMonitorLog } = require('../../../models');
const { Op } = require('sequelize');
const emailService = require('../notification/email.service');

/**
 * 服务器监控服务
 * 通过SSH采集远程服务器指标 + TCP端口探测
 */
class ServerMonitorService {
  constructor() {
    this.scheduledJobs = new Map(); // serverId -> intervalId
    this.lastAlertTime = new Map(); // serverId -> timestamp
  }

  /**
   * 获取所有服务器列表（带分页）
   */
  async getAllServers(filters = {}) {
    const { page = 1, limit = 20, enabled, status } = filters;
    const offset = (page - 1) * limit;

    const where = {};
    if (enabled !== undefined) where.enabled = enabled;
    if (status) where.status = status;

    const { count, rows } = await ServerMonitor.findAndCountAll({
      where,
      include: [
        { model: ServerMonitorPort, as: 'ports', required: false },
      ],
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      servers: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 根据ID获取服务器详情
   */
  async getServerById(id) {
    const server = await ServerMonitor.findByPk(id, {
      include: [
        { model: ServerMonitorPort, as: 'ports' },
        { model: ServerMonitorLog, as: 'logs', limit: 10, order: [['checked_at', 'DESC']] },
      ],
    });
    return server;
  }

  /**
   * 创建服务器监控配置
   */
  async createServer(data, userId) {
    const server = await ServerMonitor.create({
      ...data,
      created_by: userId,
    });
    return server;
  }

  /**
   * 更新服务器监控配置
   */
  async updateServer(id, data, userId) {
    const server = await ServerMonitor.findByPk(id);
    if (!server) throw new Error('服务器不存在');

    await server.update({
      ...data,
      updated_by: userId,
    });
    return server;
  }

  /**
   * 删除服务器监控配置（软删除）
   */
  async deleteServer(id, userId) {
    const server = await ServerMonitor.findByPk(id);
    if (!server) throw new Error('服务器不存在');

    // 停止定时任务
    this.stopMonitoring(id);

    // 使用 Sequelize 软删除，同时记录 deleted_by
    await server.update({ deleted_by: userId });
    await server.destroy(); // paranoid: true 时会设置 deleted_at
    return true;
  }

  /**
   * 测试SSH连接
   */
  async testConnection(serverId) {
    const server = await ServerMonitor.findByPk(serverId);
    if (!server) throw new Error('服务器不存在');

    return new Promise((resolve, reject) => {
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error('连接超时'));
      }, (server.timeout || 30) * 1000);

      conn.on('ready', () => {
        clearTimeout(timeout);
        conn.end();
        resolve({ success: true, message: 'SSH连接成功' });
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      const connectConfig = {
        host: server.ip_address,
        port: server.port || 22,
        username: server.username,
        readyTimeout: (server.timeout || 30) * 1000,
      };

      if (server.auth_type === 'password') {
        connectConfig.password = server.password;
      } else if (server.auth_type === 'key' && server.private_key) {
        connectConfig.privateKey = server.private_key;
      }

      conn.connect(connectConfig);
    });
  }

  /**
   * 通过SSH执行命令并返回结果
   */
  _execCommand(conn, command) {
    return new Promise((resolve, reject) => {
      conn.exec(command, (err, stream) => {
        if (err) return reject(err);

        let stdout = '';
        let stderr = '';

        stream.on('close', (code) => {
          if (code !== 0 && stderr) {
            reject(new Error(stderr));
          } else {
            resolve(stdout.trim());
          }
        });

        stream.on('data', (data) => {
          stdout += data.toString();
        });

        stream.stderr.on('data', (data) => {
          stderr += data.toString();
        });
      });
    });
  }

  /**
   * 采集服务器指标
   */
  async collectMetrics(server) {
    return new Promise(async (resolve, reject) => {
      const conn = new Client();
      const timeout = setTimeout(() => {
        conn.end();
        reject(new Error('采集超时'));
      }, (server.timeout || 30) * 1000);

      conn.on('ready', async () => {
        try {
          // CPU使用率
          const cpuOutput = await this._execCommand(conn, "top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
          const cpuUsage = parseFloat(cpuOutput) || 0;

          // 内存信息
          const memOutput = await this._execCommand(conn, "free -m | grep Mem");
          const memParts = memOutput.split(/\s+/);
          const memoryTotalMb = parseFloat(memParts[1]) || 0;
          const memoryUsedMb = parseFloat(memParts[2]) || 0;
          const memoryUsage = memoryTotalMb > 0 ? ((memoryUsedMb / memoryTotalMb) * 100).toFixed(2) : 0;

          // 磁盘使用率
          const diskOutput = await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $5}'");
          const diskUsage = parseFloat(diskOutput.replace('%', '')) || 0;
          const diskTotalGb = parseFloat((await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $2}'")).replace('G', '')) || 0;
          const diskUsedGb = parseFloat((await this._execCommand(conn, "df -BG / | tail -1 | awk '{print $3}'")).replace('G', '')) || 0;

          // 负载
          const loadOutput = await this._execCommand(conn, "cat /proc/loadavg");
          const loadParts = loadOutput.split(' ');
          const loadAvg1m = parseFloat(loadParts[0]) || 0;
          const loadAvg5m = parseFloat(loadParts[1]) || 0;
          const loadAvg15m = parseFloat(loadParts[2]) || 0;

          clearTimeout(timeout);
          conn.end();

          const metrics = {
            cpuUsage,
            memoryUsage: parseFloat(memoryUsage),
            memoryUsedMb,
            memoryTotalMb,
            diskUsage,
            diskUsedGb,
            diskTotalGb,
            loadAvg1m,
            loadAvg5m,
            loadAvg15m,
          };
          
          resolve(metrics);
        } catch (err) {
          clearTimeout(timeout);
          conn.end();
          reject(err);
        }
      });

      conn.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });

      const connectConfig = {
        host: server.ip_address,
        port: server.port || 22,
        username: server.username,
        readyTimeout: (server.timeout || 30) * 1000,
      };

      if (server.auth_type === 'password') {
        connectConfig.password = server.password;
      } else if (server.auth_type === 'key' && server.private_key) {
        connectConfig.privateKey = server.private_key;
      }

      conn.connect(connectConfig);
    });
  }

  /**
   * 探测TCP端口是否畅通
   */
  async checkPort(host, port, timeout = 5000) {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const timer = setTimeout(() => {
        socket.destroy();
        resolve('timeout');
      }, timeout);

      socket.on('connect', () => {
        clearTimeout(timer);
        socket.destroy();
        resolve('open');
      });

      socket.on('error', () => {
        clearTimeout(timer);
        resolve('closed');
      });

      socket.connect(port, host);
    });
  }

  /**
   * 检查单个服务器
   */
  async checkServer(serverId) {
    const server = await ServerMonitor.findByPk(serverId, {
      include: [{ model: ServerMonitorPort, as: 'ports', where: { enabled: true }, required: false }],
    });

    if (!server || !server.enabled) return;

    const logData = {
      server_id: serverId,
      check_status: 'success',
      checked_at: new Date(),
    };

    try {
      // 采集指标
      const metrics = await this.collectMetrics(server);
      
      // 将指标数据转换为数据库字段格式（蛇形命名）
      Object.assign(logData, {
        cpu_usage: metrics.cpuUsage,
        memory_usage: metrics.memoryUsage,
        memory_used_mb: metrics.memoryUsedMb,
        memory_total_mb: metrics.memoryTotalMb,
        disk_usage: metrics.diskUsage,
        disk_used_gb: metrics.diskUsedGb,
        disk_total_gb: metrics.diskTotalGb,
        load_avg_1m: metrics.loadAvg1m,
        load_avg_5m: metrics.loadAvg5m,
        load_avg_15m: metrics.loadAvg15m,
      });

      // 更新状态和最新指标
      await server.update({
        status: 'online',
        last_check_at: new Date(),
        last_metrics: {
          cpu_usage: metrics.cpuUsage,
          memory_usage: metrics.memoryUsage,
          memory_used_mb: metrics.memoryUsedMb,
          memory_total_mb: metrics.memoryTotalMb,
          disk_usage: metrics.diskUsage,
          disk_used_gb: metrics.diskUsedGb,
          disk_total_gb: metrics.diskTotalGb,
          load_avg_1m: metrics.loadAvg1m,
          load_avg_5m: metrics.loadAvg5m,
          load_avg_15m: metrics.loadAvg15m,
        },
      });

      // 检查告警阈值
      const alerts = [];
      if (metrics.cpuUsage > parseFloat(server.cpu_threshold)) {
        alerts.push(`CPU使用率 ${metrics.cpuUsage}% 超过阈值 ${server.cpu_threshold}%`);
      }
      if (metrics.memoryUsage > parseFloat(server.memory_threshold)) {
        alerts.push(`内存使用率 ${metrics.memoryUsage}% 超过阈值 ${server.memory_threshold}%`);
      }
      if (metrics.diskUsage > parseFloat(server.disk_threshold)) {
        alerts.push(`磁盘使用率 ${metrics.diskUsage}% 超过阈值 ${server.disk_threshold}%`);
      }

      // 检查端口
      if (server.ports && server.ports.length > 0) {
        for (const portConfig of server.ports) {
          const portStatus = await this.checkPort(server.ip_address, portConfig.port, server.timeout * 1000);
          
          // 更新端口状态（checkPort 返回 'open'/'closed'/'timeout'）
          await portConfig.update({
            last_check_status: portStatus,
            last_checked_at: new Date(),
          });
          
          if (portStatus !== 'open') {
            alerts.push(`${portConfig.service_name || '服务'} 端口 ${portConfig.port} 无法访问（${portStatus}）`);
          }
        }
      }

      // 发送告警邮件
      if (alerts.length > 0 && server.alert_enabled) {
        await this.sendAlert(server, alerts);
      }
    } catch (err) {
      logData.check_status = 'failed';
      logData.error_message = err.message;

      await server.update({
        status: 'error',
        last_check_at: new Date(),
      });

      // 连接失败也发送告警
      if (server.alert_enabled) {
        await this.sendAlert(server, [`服务器连接失败: ${err.message}`]);
      }
    } finally {
      // 保存日志
      await ServerMonitorLog.create(logData);
    }
  }

  /**
   * 发送告警邮件
   * 模块归属：服务器监控 | 使用场景：指标超阈值或端口不通时发送告警
   */
  async sendAlert(server, alerts) {
    if (!server.alert_recipients || !Array.isArray(server.alert_recipients) || server.alert_recipients.length === 0) {
      return;
    }

    const now = new Date();
    const lastAlert = this.lastAlertTime.get(server.id);
    const alertInterval = (server.alert_interval || 1800) * 1000;

    // 检查告警间隔
    if (lastAlert && (now - lastAlert) < alertInterval) {
      return;
    }

    this.lastAlertTime.set(server.id, now);

    const subject = `[监控告警] ${server.name} (${server.ip_address})`;
    const content = alerts.join('\n');

    try {
      await emailService.sendAlertEmail({
        templateId: server.alert_template_id || null,
        recipients: server.alert_recipients,
        title: subject,
        content,
      });
    } catch (err) {
      console.error('发送告警邮件失败:', err);
    }
  }

  /**
   * 启动单个服务器的定时监控
   */
  startMonitoring(serverId) {
    if (this.scheduledJobs.has(serverId)) {
      this.stopMonitoring(serverId);
    }

    const job = setInterval(() => {
      this.checkServer(serverId).catch(console.error);
    }, 60 * 1000); // 默认每分钟检查一次

    this.scheduledJobs.set(serverId, job);
  }

  /**
   * 停止单个服务器的定时监控
   */
  stopMonitoring(serverId) {
    const job = this.scheduledJobs.get(serverId);
    if (job) {
      clearInterval(job);
      this.scheduledJobs.delete(serverId);
    }
  }

  /**
   * 启动所有启用服务器的定时监控
   */
  async startAllMonitoring() {
    const servers = await ServerMonitor.findAll({
      where: { enabled: true },
    });

    for (const server of servers) {
      this.startMonitoring(server.id);
    }
  }

  /**
   * 停止所有定时监控
   */
  stopAllMonitoring() {
    for (const [serverId] of this.scheduledJobs) {
      this.stopMonitoring(serverId);
    }
  }

  /**
   * 获取服务器监控日志
   */
  async getServerLogs(serverId, filters = {}) {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    const { count, rows } = await ServerMonitorLog.findAndCountAll({
      where: { server_id: serverId },
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });

    return {
      items: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 启动/停止服务器监控
   */
  async toggleMonitoring(serverId) {
    const server = await ServerMonitor.findByPk(serverId);
    if (!server) throw new Error('服务器不存在');

    const newEnabled = !server.enabled;
    await server.update({ enabled: newEnabled });

    if (newEnabled) {
      this.startMonitoring(serverId);
    } else {
      this.stopMonitoring(serverId);
    }

    return server;
  }

  /**
   * 初始化调度器（应用启动时调用）
   */
  async initializeScheduledJobs() {
    await this.startAllMonitoring();
    console.log('✅ 服务器监控调度器已启动');
  }

  /**
   * 添加服务端口
   */
  async addPort(serverId, data) {
    const server = await ServerMonitor.findByPk(serverId);
    if (!server) throw new Error('服务器不存在');

    const port = await ServerMonitorPort.create({
      ...data,
      server_id: serverId,
    });

    // 后台执行端口检测，不阻塞返回
    if (port.enabled) {
      this._runInitialPortCheck(server, port);
    }

    return port;
  }

  /**
   * 后台执行端口初始检测（不阻塞主流程）
   */
  async _runInitialPortCheck(server, port) {
    try {
      const portStatus = await this.checkPort(server.ip_address, port.port, server.timeout * 1000);
      await port.update({
        last_check_status: portStatus,
        last_checked_at: new Date(),
      });
    } catch (err) {
      // 检测异常时标记为closed，不影响端口已添加的事实
      try {
        await port.update({
          last_check_status: 'closed',
          last_checked_at: new Date(),
        });
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * 更新服务端口
   */
  async updatePort(portId, data) {
    const port = await ServerMonitorPort.findByPk(portId);
    if (!port) throw new Error('端口配置不存在');

    await port.update(data);
    return port;
  }

  /**
   * 删除服务端口
   */
  async deletePort(portId) {
    const port = await ServerMonitorPort.findByPk(portId);
    if (!port) throw new Error('端口配置不存在');

    await port.destroy(); // 软删除
    return true;
  }
}

module.exports = new ServerMonitorService();
