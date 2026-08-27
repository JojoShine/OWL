if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production', override: false });
}
require('dotenv').config({ override: false });
const { validateRuntimeConfig } = require('./config/runtime');
validateRuntimeConfig();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { logger } = require('./config/logger');
const { connectRedis } = require('./config/redis');
const { ensureBucketExists } = require('./config/minio');
const { errorHandler, notFound } = require('./middlewares/error');
const {
  accessLogMiddleware,
  operationLogMiddleware,
} = require('./middlewares/requestLogger');
const dataMaskingMiddleware = require('./middlewares/dataMasking');
const { clientIpMiddleware, parseTrustProxy } = require('./middlewares/clientIp');

const app = express();

// 仅信任明确配置或来自本机/私有网络的反向代理，使 req.ip 能安全解析真实客户端地址。
app.set('trust proxy', parseTrustProxy(process.env.TRUST_PROXY));

// 基础中间件
app.use(clientIpMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: false, // 允许跨域资源访问
}));
app.use(compression());

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({
  limit: '50mb',
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));
app.use(express.urlencoded({
  extended: true,
  limit: '50mb',
  verify: (req, res, buffer) => {
    req.rawBody = Buffer.from(buffer);
  },
}));

// 日志中间件
app.use(accessLogMiddleware);
app.use(operationLogMiddleware);

// 数据脱敏中间件（在路由之前注册，拦截所有响应）
app.use(dataMaskingMiddleware());

// 限流（排除特定接口）
const isProduction = process.env.NODE_ENV === 'production';
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (isProduction ? 15 * 60 * 1000 : 60 * 60 * 1000),
  max: parseInt(process.env.RATE_LIMIT_MAX) || (isProduction ? 100 : 1000),
  message: '请求过于频繁，请稍后再试',
  skip: (req) => {
    // 排除以下接口不受限流影响：
    // - 监控接口（需要高频轮询）
    // - 健康检查接口
    // - 验证码接口（登录页面需要频繁刷新）
    // - 认证接口（登录、注册等）
    // - 仪表板接口（需要频繁刷新）
    // - 文件接口（文件操作可能较多）
    // - 动态模块导入接口（数据导入可能触发多次请求）
    const excludedPaths = [
      '/api/system/monitor',
      '/api/health',
      '/api/system/captcha',
      '/api/system/dashboard',
      '/api/system/files',
      '/api/system/folders',
    ];

    // 动态模块导入接口单独排除（仅排除 import 路径，不影响其他模块请求）
    if (req.path.match(/^\/api\/modules\/[^/]+\/import$/)) {
      return true;
    }

    return excludedPaths.some(path => req.path.startsWith(path));
  },
});
app.use('/api/', limiter);

// 导入路由
const apiRoutes = require('./routes');

// 健康检查（全局，不在/api下）
const { success } = require('./utils/response');
app.get('/health', (req, res) => {
  success(res, { status: 'ok' }, 'Server is running');
});

// API路由（所有业务路由都在 /api 下）
app.use('/api', apiRoutes);

// 错误处理
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '127.0.0.1';
let httpServer = null;
let isShuttingDown = false;

// 启动服务器
const startServer = async () => {
  try {
    // 尝试连接Redis（可选，连接失败不影响应用启动）
    await connectRedis();

    // 连接数据库
    const db = require('./models');
    await db.sequelize.authenticate();
    logger.info('Database connected successfully');

    // 初始化 Minio bucket
    await ensureBucketExists();

    // 初始化接口监控定时任务
    const apiMonitorService = require('./core/modules/monitor/api-monitor.service');
    await apiMonitorService.initializeScheduledJobs();

    // 启动告警检查定时任务
    const alertService = require('./core/modules/monitor/alert.service');
    alertService.startAlertCheckJob();

    // 启动服务器监控调度器
    const serverMonitorService = require('./core/modules/monitor/server-monitor.service');
    await serverMonitorService.initializeScheduledJobs();

    // 创建HTTP服务器（用于Socket.io）
    const http = require('http');
    httpServer = http.createServer(app);

    // 初始化Socket.io服务
    const socketService = require('./core/modules/notification/socket.service');
    socketService.initialize(httpServer);

    httpServer.listen(PORT, HOST, () => {
      logger.info(`Server running at http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`API URL: http://localhost:${PORT}/api`);
      logger.info(`WebSocket URL: ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}, shutting down gracefully`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out');
    process.exit(1);
  }, 15000);
  forceExitTimer.unref();

  try {
    require('./core/modules/monitor/api-monitor.service').stopAllScheduledJobs();
    require('./core/modules/monitor/alert.service').stopAlertCheckJob();
    require('./core/modules/monitor/server-monitor.service').stopAllMonitoring();

    const socketService = require('./core/modules/notification/socket.service');
    if (socketService.io) {
      await new Promise((resolve) => socketService.io.close(resolve));
    }

    if (httpServer?.listening) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      });
    }

    const { redisClient } = require('./config/redis');
    if (redisClient.isOpen) await redisClient.quit();

    const db = require('./models');
    await db.sequelize.close();
    clearTimeout(forceExitTimer);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceExitTimer);
    logger.error('Graceful shutdown failed:', error);
    process.exit(1);
  }
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));

startServer();

module.exports = app;
