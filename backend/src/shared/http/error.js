const { logger } = require('../config/logger');
const ApiError = require('../utils/ApiError');

// 统一错误处理中间件
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  // 如果有验证错误详情，添加到响应中
  if (err.errors) {
    response.errors = err.errors;
  }

  // 开发环境返回堆栈信息
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404错误处理
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found - ${req.originalUrl}`));
};

module.exports = {
  errorHandler,
  notFound,
};