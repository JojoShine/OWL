import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { ModuleConfigService } from './module-config.service';
import { DbReaderService } from './db-reader.service';
import { SqlService } from './sql.service';
import { shared } from '../compatibility/shared';
const ApiError: any = shared('utils/ApiError');
const IDENTIFIER_PATTERN: any = /^[a-z][a-z0-9_]*$/;
const SYSTEM_FIELDS: any = new Set([
    'id',
    'created_by',
    'updated_by',
    'deleted_by',
    'created_at',
    'updated_at',
    'deleted_at',
]);
const SUPPORTED_TYPES: any = new Set([
    'string',
    'text',
    'integer',
    'bigint',
    'decimal',
    'boolean',
    'date',
    'datetime',
    'json',
]);
function badRequest(message: any) {
    throw ApiError.badRequest(message);
}
function normalizeIdentifier(value: any, label: any, maxLength: any) {
    const normalized: any = String(value || '').trim();
    if (!IDENTIFIER_PATTERN.test(normalized) || normalized.length > maxLength) {
        badRequest(`${label}只能使用小写字母、数字和下划线，并以字母开头`);
    }
    return normalized;
}
function normalizeDefaultValue(field: any) {
    if (field.default_current_time) {
        if (field.type !== 'datetime')
            badRequest(`字段 ${field.name} 仅日期时间类型支持当前时间默认值`);
        return 'CURRENT_TIMESTAMP';
    }
    const value: any = field.default_value;
    if (value === undefined || value === null || value === '')
        return undefined;
    if (['string', 'text'].includes(field.type))
        return String(value);
    if (['integer', 'bigint'].includes(field.type)) {
        if (!/^-?\d+$/.test(String(value)))
            badRequest(`字段 ${field.name} 的默认值必须为整数`);
        return field.type === 'integer' ? Number(value) : String(value);
    }
    if (field.type === 'decimal') {
        if (!/^-?\d+(\.\d+)?$/.test(String(value)))
            badRequest(`字段 ${field.name} 的默认值必须为数字`);
        return String(value);
    }
    if (field.type === 'boolean') {
        if (typeof value !== 'boolean')
            badRequest(`字段 ${field.name} 的默认值必须为布尔值`);
        return value;
    }
    if (field.type === 'date') {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)))
            badRequest(`字段 ${field.name} 的默认值必须为日期`);
        return String(value);
    }
    if (field.type === 'datetime') {
        if (Number.isNaN(Date.parse(value)))
            badRequest(`字段 ${field.name} 的默认值必须为日期时间`);
        return new Date(value);
    }
    if (field.type === 'json') {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        }
        catch {
            badRequest(`字段 ${field.name} 的默认值必须为有效 JSON`);
        }
    }
    return undefined;
}
function normalizeField(input: any) {
    const name: any = normalizeIdentifier(input.name, '字段名', 63);
    if (SYSTEM_FIELDS.has(name))
        badRequest(`字段 ${name} 与系统字段重名`);
    if (!SUPPORTED_TYPES.has(input.type))
        badRequest(`字段 ${name} 使用了不支持的字段类型`);
    const field: any = {
        name,
        type: input.type,
        comment: String(input.comment || '').trim().slice(0, 255),
        nullable: input.nullable !== false,
        unique: input.unique === true,
        indexed: input.indexed === true,
        default_value: input.default_value,
        default_current_time: input.default_current_time === true,
    };
    if (field.type === 'string') {
        field.length = Number(input.length || 255);
        if (!Number.isInteger(field.length) || field.length < 1 || field.length > 2000) {
            badRequest(`字段 ${name} 的长度必须在 1 到 2000 之间`);
        }
    }
    if (field.type === 'decimal') {
        field.precision = Number(input.precision || 10);
        field.scale = Number(input.scale ?? 2);
        if (!Number.isInteger(field.precision) || field.precision < 1 || field.precision > 38) {
            badRequest(`字段 ${name} 的精度必须在 1 到 38 之间`);
        }
        if (!Number.isInteger(field.scale) || field.scale < 0 || field.scale > field.precision) {
            badRequest(`字段 ${name} 的小数位必须在 0 到精度之间`);
        }
    }
    field.defaultValue = normalizeDefaultValue(field);
    return field;
}
function normalizeDefinition(definition: any = {}) {
    const suffix: any = normalizeIdentifier(definition.table_name, '业务表名', 59);
    if (suffix.startsWith('biz_') || suffix.startsWith('owl_')) {
        badRequest('业务表名只需填写 biz_ 后面的名称');
    }
    if (!Array.isArray(definition.fields) || definition.fields.length === 0) {
        badRequest('请至少添加一个业务字段');
    }
    if (definition.fields.length > 100)
        badRequest('单张业务表最多支持 100 个业务字段');
    const fields: any = definition.fields.map(normalizeField);
    const names: any = new Set();
    for (const field of fields) {
        if (names.has(field.name))
            badRequest(`字段 ${field.name} 重复`);
        names.add(field.name);
    }
    return {
        tableName: `biz_${suffix}`,
        tableComment: String(definition.table_comment || '').trim().slice(0, 255),
        fields,
    };
}
export const quoteId: any = (value: string) => '"' + value.replace(/"/g, '""') + '"';
export const quoteLiteral: any = (value: any) => "'" + String(value instanceof Date ? value.toISOString() : typeof value === 'object' ? JSON.stringify(value) : value).replace(/'/g, "''") + "'";
@Injectable()
export class BusinessTableService {
    constructor(private readonly db: PrismaService, private readonly sql: SqlService, private readonly reader: DbReaderService, private readonly configs: ModuleConfigService) { }
    async createBusinessTable(input: any, userId: string): Promise<any> {
        const definition: any = normalizeDefinition(input), table: any = quoteId(definition.tableName);
        return this.db.$transaction(async (tx: any) => {
            if (await this.reader.tableExists(definition.tableName, { transaction: tx }))
                throw ApiError.conflict(`业务表 ${definition.tableName} 已存在`);
            const columns: any = ['id uuid PRIMARY KEY DEFAULT gen_random_uuid()'];
            for (const field of definition.fields) {
                const types: any = { string: `varchar(${field.length})`, text: 'text', integer: 'integer', bigint: 'bigint', decimal: `numeric(${field.precision},${field.scale})`, boolean: 'boolean', date: 'date', datetime: 'timestamptz', json: 'jsonb' };
                columns.push(`${quoteId(field.name)} ${types[field.type]}${field.nullable ? '' : ' NOT NULL'}${field.unique ? ' UNIQUE' : ''}${field.defaultValue === undefined ? '' : ' DEFAULT ' + (field.default_current_time ? 'CURRENT_TIMESTAMP' : quoteLiteral(field.defaultValue))}`);
            }
            columns.push('created_by uuid', 'updated_by uuid', 'deleted_by uuid', 'created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP', 'updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP', 'deleted_at timestamptz');
            await this.sql.execute(`CREATE TABLE ${table} (${columns.join(', ')})`, {}, tx);
            if (definition.tableComment)
                await this.sql.execute(`COMMENT ON TABLE ${table} IS ${quoteLiteral(definition.tableComment)}`, {}, tx);
            for (const field of definition.fields) {
                if (field.comment)
                    await this.sql.execute(`COMMENT ON COLUMN ${table}.${quoteId(field.name)} IS ${quoteLiteral(field.comment)}`, {}, tx);
                if (field.indexed && !field.unique)
                    await this.sql.execute(`CREATE INDEX ON ${table} (${quoteId(field.name)})`, {}, tx);
            }
            return { tableName: definition.tableName, moduleConfig: await this.configs.initializeModuleConfig(definition.tableName, { transaction: tx, userId }) };
        });
    }
}
