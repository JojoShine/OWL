import { Injectable, BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException, ServiceUnavailableException, HttpException } from '@nestjs/common';
import { randomBytes, createHmac } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { shared } from '../compatibility/shared';
const publicKey = (row: any) => { const { key_hash, ...data } = row; return data; };
@Injectable()
export class SqlApiKeysService {
    constructor(private readonly db: PrismaService) { }
    digestKey(raw: string) { if (!process.env.API_KEY_PEPPER)
        throw new Error('SQL API 密钥安全配置缺失'); return createHmac('sha256', process.env.API_KEY_PEPPER).update(raw).digest('hex'); }
    private material() { const raw = 'oak_' + randomBytes(32).toString('hex'); return { raw, key_hash: this.digestKey(raw), key_prefix: `${raw.slice(0, 12)}…${raw.slice(-4)}` }; }
    private async owned(db: any, id: string, userId: string) { const row = await db.owl_api_keys.findFirst({ where: { id, created_by: userId, ...live } }); if (!row)
        throw new NotFoundException('接口密钥不存在'); return row; }
    private async interfaces(db: any, ids: string[]) { const unique = [...new Set(ids || [])]; if (!unique.length)
        throw new BadRequestException('请至少授权一个 SQL 接口'); if (await db.owl_api_interfaces.count({ where: { id: { in: unique }, ...live } }) !== unique.length)
        throw new BadRequestException('授权接口中包含无效记录'); return unique; }
    private async assign(db: any, id: string, ids: string[], userId: string) { await db.owl_api_key_interfaces.deleteMany({ where: { api_key_id: id } }); await db.owl_api_key_interfaces.createMany({ data: ids.map(interface_id => ({ api_key_id: id, interface_id, created_by: userId })) }); }
    async listKeys(userId: string, { interfaceId }: any = {}) { const links = await this.db.owl_api_key_interfaces.findMany({ where: { ...live, ...(interfaceId ? { interface_id: interfaceId } : {}) } }); const rows = await this.db.owl_api_keys.findMany({ where: { created_by: userId, ...live, ...(interfaceId ? { id: { in: links.map(link => link.api_key_id) } } : {}) }, orderBy: { createdAt: 'desc' } }); return Promise.all(rows.map(async (row) => ({ ...publicKey(row), interfaces: await this.db.owl_api_interfaces.findMany({ where: { id: { in: links.filter(link => link.api_key_id === row.id).map(link => link.interface_id) }, ...live }, select: { id: true, name: true, endpoint: true, method: true, version: true } }) }))); }
    async createKey(body: any, userId: string) { return this.db.$transaction(async (tx) => { const ids = await this.interfaces(tx, body.interface_ids), secret = this.material(); const row = await tx.owl_api_keys.create({ data: { client_name: body.client_name.trim(), description: body.description || '', key_hash: secret.key_hash, key_prefix: secret.key_prefix, status: 'active', expires_at: body.expires_at ? new Date(body.expires_at) : new Date(Date.now() + 180 * 86400000), created_by: userId } }); await this.assign(tx, row.id, ids, userId); return { id: row.id, client_name: row.client_name, api_key: secret.raw, key_prefix: row.key_prefix, expires_at: row.expires_at, interface_ids: ids }; }); }
    async updateKey(id: string, body: any, userId: string) { return this.db.$transaction(async (tx) => { const row = await this.owned(tx, id, userId), ids = await this.interfaces(tx, body.interface_ids); const updated = await tx.owl_api_keys.update({ where: { id }, data: { client_name: body.client_name.trim(), description: body.description || '', expires_at: body.expires_at ? new Date(body.expires_at) : row.expires_at, updated_by: userId, updatedAt: new Date() } }); await this.assign(tx, id, ids, userId); return publicKey(updated); }); }
    async changeStatus(id: string, status: string, userId: string) { await this.owned(this.db, id, userId); return publicKey(await this.db.owl_api_keys.update({ where: { id }, data: { status, updated_by: userId, updatedAt: new Date() } })); }
    async regenerateKey(id: string, userId: string) { const row = await this.owned(this.db, id, userId), secret = this.material(); await this.db.owl_api_keys.update({ where: { id }, data: { key_hash: secret.key_hash, key_prefix: secret.key_prefix, status: 'active', expires_at: new Date(Date.now() + 180 * 86400000), updated_by: userId, updatedAt: new Date() } }); return { id, client_name: row.client_name, api_key: secret.raw, key_prefix: secret.key_prefix }; }
    async deleteKey(id: string, userId: string) { await this.owned(this.db, id, userId); await this.db.owl_api_keys.update({ where: { id }, data: { ...deleted(), deleted_by: userId } }); }
    async authenticate(raw: string) { const row = await this.db.owl_api_keys.findFirst({ where: { key_hash: this.digestKey(raw), ...live } }); if (!row)
        throw new UnauthorizedException('接口密钥无效'); if (row.status !== 'active' || !row.expires_at || row.expires_at <= new Date())
        throw new ForbiddenException('接口密钥不可用'); return row; }
    async authorizeInterface(key: any, definition: any) { const grant = await this.db.owl_api_key_interfaces.findFirst({ where: { api_key_id: key.id, interface_id: definition.id, ...live } }); if (!grant)
        throw new ForbiddenException('接口密钥未获得当前接口授权'); const redis = shared('config/redis'); if (!redis.isRedisAvailable())
        throw new ServiceUnavailableException('接口限流服务暂不可用'); const rateKey = `sql-api:rate:${key.id}:${definition.id}:${Math.floor(Date.now() / 60000)}`; const count = await redis.redisClient.incr(rateKey); if (count === 1)
        await redis.redisClient.expire(rateKey, 60); if (count > definition.rate_limit)
        throw new HttpException('接口调用频率超限', 429); await this.db.owl_api_keys.update({ where: { id: key.id }, data: { last_used_at: new Date(), updatedAt: new Date() } }); }
}
