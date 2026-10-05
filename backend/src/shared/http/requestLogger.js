const morgan = require('morgan');
const { accessLogger, operationLogger } = require('../config/logger');

morgan.token('client-ip', (req) => req.clientIp || req.ip || 'unknown');

// 访问日志中间件
const accessLogMiddleware = morgan(
  ':client-ip - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"',
  {
    stream: {
      write: (message) => accessLogger.http(message.trim()),
    },
  }
);

// 过滤敏感字段的函数
const filterSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'pwd', 'passwd', 'secret', 'token', 'access_token', 'refresh_token'];
  const filtered = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (filtered[field]) {
      filtered[field] = '***FILTERED***';
    }
  });
  
  return filtered;
};

// 操作日志中间件
const operationLogMiddleware = (req, res, next) => {
  // 记录操作日志（POST, PUT, DELETE请求）
  const oldSend = res.send;

  res.send = function (data) {
    res.send = oldSend;

    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      operationLogger.info(
        JSON.stringify({
          user: req.user?.id || 'anonymous',
          method: req.method,
          url: req.originalUrl,
          ip: req.clientIp,
          userAgent: req.get('user-agent'),
          body: filterSensitiveData(req.body),  // 过滤敏感字段
          timestamp: new Date().toISOString(),
        })
      );
    }

    return res.send(data);
  };

  next();
};

module.exports = {
  accessLogMiddleware,
  operationLogMiddleware,
};
