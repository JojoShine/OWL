/**
 * 用户会话处理模块
 * 用于WebSocket通知被踢出的用户会话
 */

const { logger } = require('../config/logger');

// 存储用户的WebSocket连接映射
const userSocketMap = new Map();

/**
 * 注册用户的WebSocket连接
 * @param {string} userId - 用户ID
 * @param {object} socket - WebSocket socket对象
 */
function registerUserSocket(userId, socket) {
  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, []);
  }
  userSocketMap.get(userId).push(socket);
  logger.debug(`User ${userId} socket registered, total: ${userSocketMap.get(userId).length}`);
}

/**
 * 注销用户的WebSocket连接
 * @param {string} userId - 用户ID
 * @param {object} socket - WebSocket socket对象
 */
function unregisterUserSocket(userId, socket) {
  if (!userSocketMap.has(userId)) return;

  const sockets = userSocketMap.get(userId);
  const index = sockets.indexOf(socket);

  if (index > -1) {
    sockets.splice(index, 1);
    logger.debug(`User ${userId} socket unregistered, remaining: ${sockets.length}`);
  }

  if (sockets.length === 0) {
    userSocketMap.delete(userId);
  }
}

/**
 * 通知被踢出的用户会话
 * @param {string} userId - 被踢出的用户ID
 * @param {object} newLoginInfo - 新登录信息
 */
function notifyKickedSessions(userId, newLoginInfo) {
  if (!userSocketMap.has(userId)) {
    logger.debug(`No active sockets for user ${userId}`);
    return;
  }

  const sockets = userSocketMap.get(userId);
  const message = {
    type: 'session:kicked',
    message: '您的账号在其他设备登录',
    newLogin: newLoginInfo,
    timestamp: new Date().toISOString()
  };

  sockets.forEach((socket) => {
    try {
      // 通过WebSocket发送踢出通知
      socket.emit('session:kicked', message);
      logger.info(`Sent kick notification to user ${userId}`);
    } catch (error) {
      logger.error(`Error sending kick notification to user ${userId}: ${error.message}`);
    }
  });
}

/**
 * 获取用户的所有WebSocket连接
 * @param {string} userId - 用户ID
 * @returns {array} WebSocket连接数组
 */
function getUserSockets(userId) {
  return userSocketMap.get(userId) || [];
}

/**
 * 获取所有用户的连接信息（用于调试）
 * @returns {object} 用户连接信息
 */
function getConnectionStats() {
  const stats = {};
  userSocketMap.forEach((sockets, userId) => {
    stats[userId] = sockets.length;
  });
  return stats;
}

module.exports = {
  registerUserSocket,
  unregisterUserSocket,
  notifyKickedSessions,
  getUserSockets,
  getConnectionStats
};
