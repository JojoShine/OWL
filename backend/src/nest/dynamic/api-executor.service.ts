import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SqlService } from './sql.service';
import { shared } from '../compatibility/shared';
@Injectable()
export class ApiExecutorService extends shared('utils/api-parameters') {
    constructor(private readonly db: PrismaService, private readonly sql: SqlService) { super(); }
    async executeInterface(definition: any, params: any, ip: string | null = null, keyId: string | null = null) {
        const started = Date.now(), operationType = this.getOperationType(definition.sql_query);
        let responseCode = 200, errorMessage: string | null = null;
        try {
            if (definition.status === 'inactive')
                throw new ForbiddenException('接口已禁用');
            this.validateParameters(params, definition.parameters || []);
            const bindings = this.prepareReplacements(params, definition.parameters || []);
            if (operationType === 'SELECT')
                return await this.sql.rows(definition.sql_query, bindings);
            const affectedRows = await this.sql.execute(definition.sql_query, bindings);
            return { operationType, affectedRows, message: `${operationType} 操作成功，受影响行数: ${affectedRows}` };
        }
        catch (error: any) {
            responseCode = error.statusCode || error.status || 500;
            errorMessage = error.message;
            throw error;
        }
        finally {
            await this.db.owl_api_call_logs.create({ data: { interface_id: definition.id, api_key_id: keyId, request_method: operationType, response_code: responseCode, response_time: Date.now() - started, error_message: errorMessage, ip_address: ip } }).catch(() => { });
        }
    }
    testInterface(definition: any, params: any, ip: string | null = null, keyId: string | null = null) { return this.executeInterface(definition, params, ip, keyId); }
}
