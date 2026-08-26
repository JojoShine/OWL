const db = require('../models');
const ApiError = require('../utils/ApiError');
const { logger } = require('../config/logger');
const { redisClient, isRedisAvailable } = require('../config/redis');
const {
  decryptSecret,
  buildCanonicalRequest,
  createSignature,
  signaturesMatch,
} = require('../core/modules/third_party_keys/third-party-crypto.service');

function auditRequest(req, credential, startedAt, failureReason = null) {
  req.res.once('finish', () => {
    db.ThirdPartyApiCallLog.create({
      third_party_key_id: credential?.id || null,
      client_name: credential?.client_name || null,
      request_method: req.method,
      request_path: req.originalUrl,
      ip_address: req.clientIp,
      response_code: req.res.statusCode,
      response_time: Date.now() - startedAt,
      failure_reason: failureReason,
    }).catch((error) => logger.error('Third-party request audit failed', error));
  });
}

function verifyThirdPartySignature(requiredScope) {
  return async (req, res, next) => {
    const startedAt = Date.now();
    let credential = null;
    try {
      const apiKey = req.get('X-API-Key');
      const timestamp = req.get('X-Timestamp');
      const nonce = req.get('X-Nonce');
      const providedSignature = req.get('X-Signature');
      if (!apiKey || !timestamp || !nonce || !providedSignature) {
        throw ApiError.badRequest('签名请求头不完整');
      }

      credential = await db.ThirdPartyApiKey.findOne({ where: { api_key: apiKey } });
      if (!credential) throw ApiError.unauthorized('第三方凭证无效');
      if (credential.status !== 'active') throw ApiError.forbidden('第三方凭证不可用');
      if (credential.expires_at && new Date(credential.expires_at) <= new Date()) {
        throw ApiError.forbidden('第三方凭证不可用');
      }

      const timestampNumber = Number(timestamp);
      if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() - timestampNumber) > 300000) {
        throw ApiError.badRequest('请求时间戳无效或已过期');
      }

      const canonicalRequest = buildCanonicalRequest({
        method: req.method,
        path: new URL(req.originalUrl, 'http://local').pathname,
        query: req.query,
        timestamp,
        nonce,
        rawBody: req.rawBody,
      });
      const expectedSignature = createSignature(canonicalRequest, decryptSecret(credential));
      if (!signaturesMatch(providedSignature, expectedSignature)) {
        throw ApiError.unauthorized('第三方凭证无效');
      }

      if (!isRedisAvailable()) throw ApiError.serviceUnavailable('签名防重放服务暂不可用');
      const nonceAccepted = await redisClient.set(
        `third-party:nonce:${credential.id}:${nonce}`,
        '1',
        { NX: true, EX: 600 }
      );
      if (nonceAccepted !== 'OK') throw ApiError.conflict('请求已处理，请勿重复提交');

      if (requiredScope && !(credential.scopes || []).includes(requiredScope)) {
        throw ApiError.forbidden('第三方凭证无此接口权限');
      }

      req.thirdPartyClient = {
        id: credential.id,
        apiKey: credential.api_key,
        clientName: credential.client_name,
        scopes: credential.scopes || [],
      };
      auditRequest(req, credential, startedAt);
      credential.update({ last_used_at: new Date() })
        .catch((error) => logger.error('Third-party last-used update failed', error));
      next();
    } catch (error) {
      auditRequest(req, credential, startedAt, error.errorCode || error.name);
      next(error.statusCode ? error : ApiError.unauthorized('第三方凭证无效'));
    }
  };
}

module.exports = { verifyThirdPartySignature };
