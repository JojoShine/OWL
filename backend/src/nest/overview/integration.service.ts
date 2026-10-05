import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { shared } from '../compatibility/shared';
const ApiError = shared('utils/ApiError');
@Injectable()
export class IntegrationService {
    constructor(private readonly db: PrismaService) { }
    async ping(req: any) {
        const started = Date.now();
        let credential: any = null, failure: any = null;
        try {
            const apiKey = req.get('X-API-Key'), timestamp = req.get('X-Timestamp'), nonce = req.get('X-Nonce'), provided = req.get('X-Signature');
            if (!apiKey || !timestamp || !nonce || !provided)
                throw ApiError.badRequest('签名请求头不完整');
            credential = await this.db.owl_third_party_api_keys.findFirst({ where: { api_key: apiKey, ...live } });
            if (!credential)
                throw ApiError.unauthorized('第三方凭证无效');
            if (credential.status !== 'active' || (credential.expires_at && credential.expires_at <= new Date()))
                throw ApiError.forbidden('第三方凭证不可用');
            const timestampNumber = Number(timestamp);
            if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() - timestampNumber) > 300000)
                throw ApiError.badRequest('请求时间戳无效或已过期');
            const crypto = shared('security/third-party-crypto');
            const canonical = crypto.buildCanonicalRequest({ method: req.method, path: new URL(req.originalUrl, 'http://local').pathname, query: req.query, timestamp, nonce, rawBody: req.rawBody });
            if (!crypto.signaturesMatch(provided, crypto.createSignature(canonical, crypto.decryptSecret(credential))))
                throw ApiError.unauthorized('第三方凭证无效');
            const redis = shared('config/redis');
            if (!redis.isRedisAvailable())
                throw ApiError.serviceUnavailable('签名防重放服务暂不可用');
            if (await redis.redisClient.set(`third-party:nonce:${credential.id}:${nonce}`, '1', { NX: true, EX: 600 }) !== 'OK')
                throw ApiError.conflict('请求已处理，请勿重复提交');
            if (!(credential.scopes || []).includes('integration:ping'))
                throw ApiError.forbidden('第三方凭证无此接口权限');
            await this.db.owl_third_party_api_keys.update({ where: { id: credential.id }, data: { last_used_at: new Date(), updatedAt: new Date() } }).catch((error: any) => shared('config/logger').logger.error('Third-party last-used update failed', error));
            return { client: credential.client_name, serverTime: new Date().toISOString() };
        }
        catch (error: any) {
            failure = error;
            throw error.statusCode ? error : ApiError.unauthorized('第三方凭证无效');
        }
        finally {
            await this.db.owl_third_party_api_call_logs.create({ data: { third_party_key_id: credential?.id || null, client_name: credential?.client_name || null, request_method: req.method, request_path: req.originalUrl, ip_address: req.clientIp, response_code: failure ? (failure.statusCode || 401) : 200, response_time: Date.now() - started, failure_reason: failure ? (failure.errorCode || failure.name) : null } }).catch((error: any) => shared('config/logger').logger.error('Third-party request audit failed', error));
        }
    }
}
