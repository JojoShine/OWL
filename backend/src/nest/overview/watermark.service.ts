import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { live, pick } from '../identity/identity.helpers';
import { SqlService } from '../dynamic/sql.service';
import { shared } from '../compatibility/shared';
@Injectable()
export class WatermarkService extends shared('utils/watermark-renderer') {
    constructor(private readonly db: PrismaService, private readonly sql: SqlService) { super(); }
    async getWatermarkConfig(transaction?: any) { const rows = await this.sql.rows('SELECT id, enabled, lines, font_size, font_weight, color, opacity, rotation, spacing, masking_rules, created_by, updated_by, deleted_by, created_at AS "createdAt", updated_at AS "updatedAt", deleted_at AS "deletedAt" FROM owl_watermark_config WHERE deleted_at IS NULL LIMIT 1', {}, transaction); return rows[0] || this.getDefaultConfig(); }
    async updateWatermarkConfig(body: any, user: any) {
        return this.db.$transaction(async (tx) => {
            await tx.$executeRawUnsafe('SELECT pg_advisory_xact_lock(602006)');
            const row = await tx.owl_watermark_config.findFirst({ where: live });
            const data = pick(body, ['enabled', 'lines', 'font_size', 'font_weight', 'color', 'opacity', 'rotation', 'spacing', 'masking_rules']);
            if (data.font_weight !== undefined)
                data.font_weight = Number(data.font_weight);
            for (const key of ['lines', 'masking_rules'])
                if (data[key] === null)
                    data[key] = Prisma.DbNull;
            if (row)
                await tx.owl_watermark_config.update({ where: { id: row.id }, data: { ...data, created_by: user.id, updatedAt: new Date() } });
            else
                await tx.owl_watermark_config.create({ data: { ...data, created_by: user.id } });
            return this.getWatermarkConfig(tx);
        });
    }
}
