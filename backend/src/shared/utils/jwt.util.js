const jwt = require('jsonwebtoken');

/**
 * JWT工具函数
 * 统一管理JWT的生成、验证和解码
 */

/**
 * 生成JWT Token
 * @param {Object} payload - 载荷数据
 * @param {Object} options - 可选配置
 *   - expiresIn: JWT过期时间（默认从环境变量读取）
 * @returns {String} JWT token
 */
function generateToken(payload, options = {}) {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };

  const finalOptions = { ...defaultOptions, ...options };

  return jwt.sign(payload, process.env.JWT_SECRET, finalOptions);
}

/**
 * 验证JWT Token
 * @param {String} token - JWT token
 * @returns {Object} 解码后的payload
 * @throws {Error} 验证失败时抛出异常
 *   - JsonWebTokenError: token无效
 *   - TokenExpiredError: token已过期
 */
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * 解码JWT Token（不验证签名）
 * @param {String} token - JWT token
 * @returns {Object} 解码后的payload（可能为null）
 */
function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * 刷新JWT Token
 * @param {String} token - 旧的JWT token
 * @param {Object} options - 可选配置
 * @returns {String} 新的JWT token
 * @throws {Error} token无效时抛出异常
 */
function refreshToken(token, options = {}) {
  const decoded = verifyToken(token);
  // 移除exp字段，让新token重新生成过期时间
  delete decoded.iat;
  delete decoded.exp;
  return generateToken(decoded, options);
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  refreshToken,
};
