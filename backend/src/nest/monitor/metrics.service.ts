import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { shared } from '../compatibility/shared';
import { jsonValue } from '../storage/storage.helpers';
@Injectable()
export class MetricsService {
    private readonly systemProbe = new (shared('utils/system-metrics'))();
    private readonly applicationProbe = new (shared('utils/application-metrics'))();
    private readonly cacheProbe = new (shared('utils/cache-metrics'))();
    constructor(private readonly db: PrismaService) { }
    getSystemMetrics() { return this.systemProbe.getSystemMetrics(); }
    getApplicationMetrics() { return this.applicationProbe.getApplicationMetrics(); }
    getCacheMetrics() { return this.cacheProbe.getCacheMetrics(); }
    async getDatabaseMetrics() {
        const [size]: any = await this.db.$queryRaw `SELECT pg_size_pretty(pg_database_size(current_database())) as size, pg_database_size(current_database()) as size_bytes`;
        const extension: any = await this.db.$queryRaw `SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'`;
        let slowQueries: any = [];
        if (extension.length) {
            try {
                slowQueries = await this.db.$queryRaw `SELECT query,calls,total_exec_time,mean_exec_time,max_exec_time FROM pg_stat_statements WHERE mean_exec_time > 1000 ORDER BY mean_exec_time DESC LIMIT 10`;
            }
            catch { /* Extension may not be loaded in shared_preload_libraries. */ }
        }
        return { connections: this.db.poolStatus(), dbSize: { size: size.size, sizeInMB: Number((Number(size.size_bytes) / (1024 * 1024)).toFixed(2)) }, slowQueries: jsonValue(slowQueries.map((row: any) => ({ query: row.query.substring(0, 200), calls: row.calls, totalTime: Number(Number(row.total_exec_time).toFixed(2)), meanTime: Number(Number(row.mean_exec_time).toFixed(2)), maxTime: Number(Number(row.max_exec_time).toFixed(2)) }))), connection: { host: process.env.DB_HOST || 'localhost', port: Number(process.env.DB_PORT) || 5432, database: process.env.DB_NAME || '' }, timestamp: new Date() };
    }
}
