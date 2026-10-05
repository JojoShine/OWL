/**
 * 自定义API错误类
 * 用于抛出带有HTTP状态码的错误
 */
class ApiError extends Error {
  constructor(statusCode, message, errors = null, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.errorCode = errorCode; // 错误码，便于前端处理
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }

  // 静态方法：创建400错误
  static badRequest(message = '请求参数错误', errors = null) {
    return new ApiError(400, message, errors, 'BAD_REQUEST');
  }

  // 静态方法：创建401错误
  static unauthorized(message = '未授权，请先登录') {
    return new ApiError(401, message, null, 'UNAUTHORIZED');
  }

  // 静态方法：创建403错误
  static forbidden(message = '没有权限访问此资源') {
    return new ApiError(403, message, null, 'FORBIDDEN');
  }

  // 静态方法：创建404错误
  static notFound(message = '请求的资源不存在') {
    return new ApiError(404, message, null, 'NOT_FOUND');
  }

  // 静态方法：创建409错误
  static conflict(message = '资源冲突') {
    return new ApiError(409, message, null, 'CONFLICT');
  }

  // 静态方法：创建422错误
  static validationError(message = '数据验证失败', errors = null) {
    return new ApiError(422, message, errors, 'VALIDATION_ERROR');
  }

  // 静态方法：创建429错误
  static tooManyRequests(message = '请求过于频繁，请稍后再试') {
    return new ApiError(429, message, null, 'TOO_MANY_REQUESTS');
  }

  // 静态方法：创建500错误
  static internal(message = '服务器内部错误，请稍后重试') {
    return new ApiError(500, message, null, 'INTERNAL_SERVER_ERROR');
  }

  // 静态方法：创建503错误
  static serviceUnavailable(message = '服务暂时不可用，请稍后重试') {
    return new ApiError(503, message, null, 'SERVICE_UNAVAILABLE');
  }

  // 静态方法：数据库错误
  static databaseError(message = '数据库操作失败') {
    return new ApiError(500, message, null, 'DATABASE_ERROR');
  }

  // 静态方法：网络错误
  static networkError(message = '网络请求失败') {
    return new ApiError(500, message, null, 'NETWORK_ERROR');
  }
}

module.exports = ApiError;
