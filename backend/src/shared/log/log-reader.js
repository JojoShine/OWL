const path = require('path');
const { readLogs, getLogStats } = require('../utils/logReader');
const { logger } = require('../config/logger');

class LogService {
  /**
   * 获取操作日志
   */
  async getOperationLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/operation');
    return await readLogs(logDir, query);
  }

  /**
   * 获取登录日志
   */
  async getLoginLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/login');
    return await readLogs(logDir, query);
  }

  /**
   * 获取系统日志
   */
  async getSystemLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/system');
    return await readLogs(logDir, query);
  }

  /**
   * 获取访问日志
   */
  async getAccessLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/access');
    return await readLogs(logDir, query);
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/error');
    return await readLogs(logDir, query);
  }

  /**
   * 获取数据库访问日志
   */
  async getDatabaseAccessLogs(query) {
    const logDir = path.join(__dirname, '../../../logs/database-access');
    return await readLogs(logDir, query);
  }

  /**
   * 获取日志统计信息
   */
  async getStats(type, startDate, endDate) {
    const logDirs = {
      operation: path.join(__dirname, '../../../logs/operation'),
      login: path.join(__dirname, '../../../logs/login'),
      system: path.join(__dirname, '../../../logs/system'),
      access: path.join(__dirname, '../../../logs/access'),
      error: path.join(__dirname, '../../../logs/error'),
      database: path.join(__dirname, '../../../logs/database-access'),
    };

    if (type && logDirs[type]) {
      // 获取指定类型的统计
      return await getLogStats(logDirs[type], startDate, endDate);
    }

    // 获取所有类型的统计
    const stats = {};
    for (const [logType, logDir] of Object.entries(logDirs)) {
      stats[logType] = await getLogStats(logDir, startDate, endDate);
    }

    return stats;
  }

  /**
   * 导出日志
   */
  async exportLogs(type, query, format = 'json') {
    const logDirs = {
      operation: path.join(__dirname, '../../../logs/operation'),
      login: path.join(__dirname, '../../../logs/login'),
      system: path.join(__dirname, '../../../logs/system'),
      access: path.join(__dirname, '../../../logs/access'),
      error: path.join(__dirname, '../../../logs/error'),
      database: path.join(__dirname, '../../../logs/database-access'),
    };

    if (!logDirs[type]) {
      throw new Error('Invalid log type');
    }

    // 获取日志（不分页，获取全部）
    const result = await readLogs(logDirs[type], { ...query, page: 1, limit: 100000 });

    if (format === 'csv') {
      return this.convertToCSV(result.logs, type);
    }

    return result.logs;
  }

  /**
   * 将日志转换为CSV格式
   */
  convertToCSV(logs, type) {
    if (!logs || logs.length === 0) {
      return '';
    }

    // 根据日志类型确定字段
    const fields = this.getCSVFields(type);

    // CSV 表头
    const header = fields.map(f => f.label).join(',');

    // CSV 数据行
    const rows = logs.map(log => {
      return fields.map(f => {
        let value = log[f.key] || '';
        // 如果值包含逗号或引号，需要用引号包裹并转义
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  }

  /**
   * 获取CSV字段定义
   */
  getCSVFields(type) {
    const commonFields = [
      { key: 'timestamp', label: '时间' },
      { key: 'level', label: '级别' },
    ];

    const typeFields = {
      operation: [
        { key: 'user', label: '用户ID' },
        { key: 'method', label: '请求方法' },
        { key: 'url', label: 'URL' },
        { key: 'ip', label: 'IP地址' },
        { key: 'userAgent', label: '用户代理' },
      ],
      login: [
        { key: 'user', label: '用户ID' },
        { key: 'username', label: '用户名' },
        { key: 'action', label: '操作' },
        { key: 'status', label: '状态' },
        { key: 'ip', label: 'IP地址' },
        { key: 'message', label: '消息' },
      ],
      system: [
        { key: 'message', label: '消息' },
        { key: 'stack', label: '堆栈' },
      ],
      access: [
        { key: 'method', label: '请求方法' },
        { key: 'url', label: 'URL' },
        { key: 'status', label: '状态码' },
        { key: 'ip', label: 'IP地址' },
      ],
      error: [
        { key: 'message', label: '错误消息' },
        { key: 'stack', label: '堆栈' },
        { key: 'url', label: 'URL' },
      ],
      database: [
        { key: 'type', label: '数据库类型' },
        { key: 'action', label: '操作类型' },
        { key: 'key', label: '键' },
        { key: 'table_name', label: '表名' },
        { key: 'user_id', label: '用户ID' },
      ],
    };

    return [...commonFields, ...(typeFields[type] || [])];
  }
}

module.exports = new LogService();
