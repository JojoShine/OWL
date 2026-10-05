const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * 解析单行日志
 * @param {string} line - 日志行
 * @returns {object|null} - 解析后的日志对象
 */
function parseLogLine(line) {
  try {
    // 日志格式: 2025-10-16 08:14:21 [info]: {"user":"...","method":"..."}
    const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);

    if (!match) {
      return null;
    }

    const [, timestamp, level, content] = match;

    // 尝试解析为JSON格式
    try {
      const data = JSON.parse(content);
      return {
        timestamp,
        level,
        ...data,
      };
    } catch {
      // 不是JSON，处理其他格式

      // 检查是否是Apache格式的访问日志
      // 格式: ::1 - - [16/Oct/2025:00:10:35 +0000] "GET /api/departments/tree HTTP/1.1" 200 - "http://localhost:3002/" "Mozilla/5.0..."
      const accessMatch = content.match(/^(\S+) - - \[([^\]]+)\] "(\w+) (\S+) HTTP\/[\d.]+"\s+(\d+)/);
      if (accessMatch) {
        const [, ip, , method, url, status] = accessMatch;
        return {
          timestamp,
          level,
          ip,
          method,
          url,
          status: parseInt(status),
          message: content,
        };
      }

      // 默认：纯文本消息（system log, error log等）
      return {
        timestamp,
        level,
        message: content,
      };
    }
  } catch (error) {
    // 忽略解析失败的行
    return null;
  }
}

/**
 * 检查日志是否匹配过滤条件
 * @param {object} log - 日志对象
 * @param {object} filters - 过滤条件
 * @returns {boolean}
 */
function matchesFilters(log, filters = {}) {
  // 用户ID过滤
  if (filters.userId && log.user !== filters.userId) {
    return false;
  }

  // HTTP方法过滤
  if (filters.method && log.method !== filters.method) {
    return false;
  }

  // URL关键词过滤
  if (filters.url && log.url && !log.url.includes(filters.url)) {
    return false;
  }

  // 状态过滤（登录日志）
  if (filters.status && log.status !== filters.status) {
    return false;
  }

  // 用户名过滤（登录日志）
  if (filters.username && log.username && !log.username.includes(filters.username)) {
    return false;
  }

  // 操作类型过滤（登录日志）
  if (filters.action && log.action !== filters.action) {
    return false;
  }

  // 数据库类型过滤（数据库日志）
  if (filters.dbType && log.type !== filters.dbType) {
    return false;
  }

  return true;
}

/**
 * 分页日志数据
 * @param {array} logs - 日志数组
 * @param {number} page - 页码
 * @param {number} limit - 每页数量
 * @returns {object}
 */
function paginateLogs(logs, page = 1, limit = 50) {
  const total = logs.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const paginatedLogs = logs.slice(start, start + limit);

  return {
    logs: paginatedLogs,
    total,
    page,
    limit,
    totalPages,
  };
}

/**
 * 读取单个日志文件
 * @param {string} filePath - 文件路径
 * @param {object} filters - 过滤条件
 * @returns {Promise<array>}
 */
async function readLogFile(filePath, filters = {}) {
  const logs = [];

  // 检查文件是否存在
  try {
    await fs.access(filePath);
  } catch {
    return logs;
  }

  const fileStream = fsSync.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const log = parseLogLine(line);
    if (log && matchesFilters(log, filters)) {
      logs.push(log);
    }
  }

  return logs;
}

/**
 * 获取指定类型的所有日志文件
 * @param {string} logDir - 日志目录
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Promise<array>}
 */
async function getLogFiles(logDir, startDate = null, endDate = null) {
  try {
    const files = await fs.readdir(logDir);
    const logFiles = files
      .filter(file => file.endsWith('.log') && !file.endsWith('-audit.json'))
      .map(file => ({
        path: path.join(logDir, file),
        name: file,
      }));

    // 如果没有日期范围，返回所有文件
    if (!startDate && !endDate) {
      return logFiles;
    }

    // 按日期过滤
    const filteredFiles = logFiles.filter(({ name }) => {
      // 提取文件名中的日期部分
      const match = name.match(/(\d{4}-\d{2}-\d{2})/);
      if (!match) return false;

      const fileDate = match[1];

      if (startDate && fileDate < startDate) return false;
      if (endDate && fileDate > endDate) return false;

      return true;
    });

    return filteredFiles;
  } catch (error) {
    console.error('Failed to read log directory:', error);
    return [];
  }
}

/**
 * 读取多个日志文件并合并
 * @param {string} logDir - 日志目录
 * @param {object} query - 查询条件
 * @returns {Promise<object>}
 */
async function readLogs(logDir, query = {}) {
  const {
    startDate,
    endDate,
    userId,
    method,
    url,
    status,
    username,
    action,
    dbType,
    page = 1,
    limit = 50,
  } = query;

  // 获取日期范围内的所有日志文件
  const files = await getLogFiles(logDir, startDate, endDate);

  let allLogs = [];

  // 读取所有相关文件
  for (const { path: filePath } of files) {
    const logs = await readLogFile(filePath, {
      userId,
      method,
      url,
      status,
      username,
      action,
      dbType,
    });
    allLogs = allLogs.concat(logs);
  }

  // 排序（最新的在前）
  allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // 分页
  return paginateLogs(allLogs, page, limit);
}

/**
 * 获取日志统计信息
 * @param {string} logDir - 日志目录
 * @param {string} startDate - 开始日期
 * @param {string} endDate - 结束日期
 * @returns {Promise<object>}
 */
async function getLogStats(logDir, startDate = null, endDate = null) {
  const files = await getLogFiles(logDir, startDate, endDate);

  let allLogs = [];

  // 读取所有相关文件
  for (const { path: filePath } of files) {
    const logs = await readLogFile(filePath);
    allLogs = allLogs.concat(logs);
  }

  // 统计数据
  const stats = {
    total: allLogs.length,
    byDate: {},
    byUser: {},
    byMethod: {},
    byStatus: {},
  };

  allLogs.forEach(log => {
    // 按日期统计
    const date = log.timestamp?.split(' ')[0];
    if (date) {
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    }

    // 按用户统计
    if (log.user) {
      stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
    }

    // 按HTTP方法统计
    if (log.method) {
      stats.byMethod[log.method] = (stats.byMethod[log.method] || 0) + 1;
    }

    // 按状态统计（登录日志）
    if (log.status) {
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1;
    }
  });

  return stats;
}

module.exports = {
  parseLogLine,
  matchesFilters,
  paginateLogs,
  readLogFile,
  getLogFiles,
  readLogs,
  getLogStats,
};