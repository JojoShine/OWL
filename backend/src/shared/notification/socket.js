const { logger } = require('../config/logger');

/**
 * WebSocket服务
 * 负责Socket.io连接管理、实时消息推送
 */
class SocketService {
  constructor() {
    this.io = null;
    this.userSockets = new Map(); // userId -> Set of socketIds
    this.socketUsers = new Map(); // socketId -> userId
  }

  /**
   * 初始化Socket.io服务器
   * @param {Object} server - HTTP服务器实例
   * @returns {Object} io实例
   */
  initialize(server, authenticate) {
    const socketIo = require('socket.io');

    this.io = socketIo(server, {
      cors: {
        origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // 心跳检测配置
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // 身份验证中间件
    this.io.use(authenticate);

    // 连接处理
    this.io.on('connection', this.handleConnection.bind(this));

    logger.info('Socket.io服务已初始化');

    return this.io;
  }

  /**
   * 处理新的Socket连接
   * @param {Object} socket - socket实例
   */
  handleConnection(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    // 记录用户连接
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId).add(socketId);
    this.socketUsers.set(socketId, userId);

    logger.info(`用户连接: userId=${userId}, socketId=${socketId}, 在线连接数=${this.userSockets.get(userId).size}`);

    // 加入用户私有房间（用于单播）
    socket.join(`user:${userId}`);

    // 发送连接成功消息
    socket.emit('connected', {
      message: '已连接到通知服务',
      userId,
      socketId,
    });

    // 监听断开连接事件
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // 监听心跳事件
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    // 监听客户端消息
    socket.on('message', (data) => {
      logger.debug(`收到客户端消息: userId=${userId}, data=`, data);
    });
  }

  /**
   * 处理Socket断开连接
   * @param {Object} socket - socket实例
   */
  handleDisconnect(socket) {
    const userId = socket.userId;
    const socketId = socket.id;

    // 从映射中移除
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socketId);

      // 如果用户没有其他连接，移除用户映射
      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.socketUsers.delete(socketId);

    logger.info(`用户断开连接: userId=${userId}, socketId=${socketId}`);
  }

  /**
   * 推送消息给指定用户
   * @param {String} userId - 用户ID
   * @param {String} event - 事件名称
   * @param {Object} data - 消息数据
   * @returns {Boolean} 是否推送成功
   */
  pushToUser(userId, event, data) {
    try {
      if (!this.io) {
        logger.warn('Socket.io未初始化');
        return false;
      }

      // 检查用户是否在线
      if (!this.userSockets.has(userId)) {
        logger.debug(`用户不在线，无法推送: userId=${userId}`);
        return false;
      }

      // 推送到用户的所有连接
      this.io.to(`user:${userId}`).emit(event, data);

      logger.debug(`推送消息成功: userId=${userId}, event=${event}`);

      return true;
    } catch (error) {
      logger.error('推送消息失败:', error);
      return false;
    }
  }

  /**
   * 推送通知给指定用户
   * @param {String} userId - 用户ID
   * @param {Object} notification - 通知数据
   * @returns {Boolean} 是否推送成功
   */
  pushNotification(userId, notification) {
    return this.pushToUser(userId, 'notification', notification);
  }

  /**
   * 广播消息给所有在线用户
   * @param {String} event - 事件名称
   * @param {Object} data - 消息数据
   * @returns {Number} 在线用户数量
   */
  broadcast(event, data) {
    try {
      if (!this.io) {
        logger.warn('Socket.io未初始化');
        return 0;
      }

      // 广播给所有连接
      this.io.emit(event, data);

      const onlineUserCount = this.userSockets.size;

      logger.info(`广播消息: event=${event}, 在线用户数=${onlineUserCount}`);

      return onlineUserCount;
    } catch (error) {
      logger.error('广播消息失败:', error);
      return 0;
    }
  }

  /**
   * 广播通知给所有在线用户
   * @param {Object} notification - 通知数据
   * @returns {Number} 在线用户数量
   */
  broadcastNotification(notification) {
    return this.broadcast('notification', notification);
  }

  /**
   * 检查用户是否在线
   * @param {String} userId - 用户ID
   * @returns {Boolean} 是否在线
   */
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  /**
   * 获取用户的连接数量
   * @param {String} userId - 用户ID
   * @returns {Number} 连接数量
   */
  getUserConnectionCount(userId) {
    if (!this.userSockets.has(userId)) {
      return 0;
    }
    return this.userSockets.get(userId).size;
  }

  /**
   * 获取在线用户列表
   * @returns {Array} 在线用户ID列表
   */
  getOnlineUsers() {
    return Array.from(this.userSockets.keys());
  }

  /**
   * 获取在线用户数量
   * @returns {Number} 在线用户数量
   */
  getOnlineUserCount() {
    return this.userSockets.size;
  }

  /**
   * 获取总连接数
   * @returns {Number} 总连接数
   */
  getTotalConnectionCount() {
    let total = 0;
    this.userSockets.forEach(sockets => {
      total += sockets.size;
    });
    return total;
  }

  /**
   * 断开指定用户的所有连接
   * @param {String} userId - 用户ID
   * @returns {Number} 断开的连接数
   */
  disconnectUser(userId) {
    if (!this.userSockets.has(userId)) {
      return 0;
    }

    const sockets = this.userSockets.get(userId);
    let disconnectedCount = 0;

    sockets.forEach(socketId => {
      const socket = this.io.sockets.sockets.get(socketId);
      if (socket) {
        socket.disconnect(true);
        disconnectedCount++;
      }
    });

    logger.info(`强制断开用户连接: userId=${userId}, count=${disconnectedCount}`);

    return disconnectedCount;
  }

  /**
   * 获取Socket.io统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      onlineUsers: this.getOnlineUserCount(),
      totalConnections: this.getTotalConnectionCount(),
      initialized: this.io !== null,
    };
  }
}

module.exports = new SocketService();
