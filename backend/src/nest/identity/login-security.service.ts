import { HttpException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { SystemConfigService } from '../system-config/system-config.service';
import { shared } from '../compatibility/shared';

export async function authRedis<T>(operation: (client: any) => Promise<T>): Promise<T> {
    const redis = shared('config/redis');
    if (!redis.isRedisAvailable()) throw unavailable();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([operation(redis.redisClient), new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(unavailable()), 3000);
        })]);
    } catch { throw unavailable(); }
    finally { if (timer) clearTimeout(timer); }
}
export function unavailable() {
    return new ServiceUnavailableException({ errorCode: 'AUTH_UNAVAILABLE', message: '登录服务暂不可用，请稍后重试' });
}
// Both keys share a hash tag so the decision also works with Redis Cluster.
export const loginDecision = `
local ttl = redis.call('TTL', KEYS[2])
if ttl >= 0 then return math.max(ttl, 1) end
if ARGV[1] == 'success' then redis.call('DEL', KEYS[1]); return 0 end
if ARGV[1] == 'check' then return 0 end
local count = redis.call('INCR', KEYS[1])
if count == 1 then redis.call('EXPIRE', KEYS[1], 900) end
if count >= tonumber(ARGV[2]) then
 redis.call('SET', KEYS[2], '1', 'EX', ARGV[3])
 redis.call('DEL', KEYS[1])
 return tonumber(ARGV[3])
end
return 0`;
@Injectable()
export class LoginSecurityService {
    constructor(private readonly config: SystemConfigService) {}
    private async decide(username: string, action: 'check' | 'failure' | 'success') {
        const settings = await this.config.getConfig();
        const digest = createHash('sha256').update(username).digest('hex');
        const prefix = `owl:login:{${digest}}`;
        const remaining = Number(await authRedis(client => client.eval(loginDecision, {
            keys: [`${prefix}:failures`, `${prefix}:lock`],
            arguments: [action, String(settings.login_failure_limit), String(settings.login_lock_minutes * 60)],
        })));
        if (remaining > 0) throw new HttpException({ errorCode: 'AUTH_LOCKED', message: '尝试次数过多，请稍后重试', params: { retryAfterSeconds: remaining } }, 429);
    }
    assertUnlocked(username: string) { return this.decide(username, 'check'); }
    recordFailure(username: string) { return this.decide(username, 'failure'); }
    acceptSuccess(username: string) { return this.decide(username, 'success'); }
}
