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
  const response = {
    success: false,
    ...require('../utils/business-errors').publicError(err),
    timestamp: new Date().toISOString(),
  };

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