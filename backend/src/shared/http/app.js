if (process.env.NODE_ENV === 'production') {
  require('dotenv').config({ path: '.env.production', override: false });
}
require('dotenv').config({ override: false });
const { validateRuntimeConfig } = require('../config/runtime');
validateRuntimeConfig();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const {
  accessLogMiddleware,
  operationLogMiddleware,
} = require('./requestLogger');
const { clientIpMiddleware, parseTrustProxy } = require('./clientIp');


function createHttpApp({ maskingMiddleware } = {}) {
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
  app.use(maskingMiddleware);

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


  return app;
}

module.exports = { createHttpApp };
