/**
 * 统一响应格式工具
 * 所有API响应都应该使用这些方法来保持一致性
 */

/**
 * 成功响应
 * @param {Object} res - Express响应对象
 * @param {*} data - 响应数据
 * @param {String} message - 响应消息
 * @param {Number} statusCode - HTTP状态码，默认200
 */
const success = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 失败响应
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 * @param {Number} statusCode - HTTP状态码，默认400
 * @param {Object} errors - 详细错误信息（可选）
 */
const error = (res, message = 'Error', statusCode = 400, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * 分页响应
 * @param {Object} res - Express响应对象
 * @param {Array} items - 数据列表
 * @param {Object} pagination - 分页信息对象 { total, page, pageSize }
 * @param {String} message - 响应消息
 */
const paginated = (res, items, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      pagination: {
        total: pagination.total,
        page: parseInt(pagination.page),
        pageSize: parseInt(pagination.pageSize),
        totalPages: Math.ceil(pagination.total / pagination.pageSize),
      },
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 列表响应（不分页，统一返回items格式）
 * @param {Object} res - Express响应对象
 * @param {Array} items - 数据列表
 * @param {String} message - 响应消息
 */
const list = (res, items, message = 'Success') => {
  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
    },
    timestamp: new Date().toISOString(),
  });
};

/**
 * 创建成功响应（201状态码）
 * @param {Object} res - Express响应对象
 * @param {*} data - 创建的资源数据
 * @param {String} message - 响应消息
 */
const created = (res, data = null, message = 'Created successfully') => {
  return success(res, data, message, 201);
};

/**
 * 无内容响应（204状态码）
 * @param {Object} res - Express响应对象
 */
const noContent = (res) => {
  return res.status(204).send();
};

/**
 * 未找到响应（404状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const notFound = (res, message = 'Resource not found') => {
  return error(res, message, 404);
};

/**
 * 未授权响应（401状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const unauthorized = (res, message = 'Unauthorized') => {
  return error(res, message, 401);
};

/**
 * 禁止访问响应（403状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const forbidden = (res, message = 'Forbidden') => {
  return error(res, message, 403);
};

/**
 * 验证错误响应（422状态码）
 * @param {Object} res - Express响应对象
 * @param {Object} errors - 验证错误详情
 * @param {String} message - 错误消息
 */
const validationError = (res, errors, message = 'Validation failed') => {
  return error(res, message, 422, errors);
};

/**
 * 服务器错误响应（500状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const serverError = (res, message = 'Internal server error') => {
  return error(res, message, 500);
};

/**
 * 冲突响应（409状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const conflict = (res, message = 'Resource conflict') => {
  return error(res, message, 409);
};

/**
 * 请求过多响应（429状态码）
 * @param {Object} res - Express响应对象
 * @param {String} message - 错误消息
 */
const tooManyRequests = (res, message = 'Too many requests') => {
  return error(res, message, 429);
};

module.exports = {
  success,
  error,
  paginated,
  list,
  created,
  noContent,
  notFound,
  unauthorized,
  forbidden,
  validationError,
  serverError,
  conflict,
  tooManyRequests,
};
