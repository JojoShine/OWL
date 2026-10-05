import { DYNAMIC_QUERY_MARKER } from '../database/dynamic-results';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { jsonValue } from '../storage/storage.helpers';
export function bindNamed(sql: string, params: Record<string, any> = {}) {
    const values: any[] = [], slots = new Map<string, string>();
    let text = '', i = 0, position = 0;
    while (i < sql.length) {
        const c = sql[i], next = sql[i + 1];
        if (c === "'" || c === '"') {
            const start = i++, escaped = c === "'" && /\b[eE]$/.test(sql.slice(0, start));
            while (i < sql.length) {
                if (escaped && sql[i] === '\\') {
                    i += 2;
                    continue;
                }
                if (sql[i] === c) {
                    i++;
                    if (sql[i] === c) {
                        i++;
                        continue;
                    }
                    break;
                }
                i++;
            }
            text += sql.slice(start, i);
            continue;
        }
        if (c === '-' && next === '-') {
            const end = sql.indexOf('\n', i);
            const stop = end < 0 ? sql.length : end;
            text += sql.slice(i, stop);
            i = stop;
            continue;
        }
        if (c === '/' && next === '*') {
            const start = i;
            i += 2;
            let depth = 1;
            while (i < sql.length && depth) {
                if (sql.slice(i, i + 2) === '/*') {
                    depth++;
                    i += 2;
                }
                else if (sql.slice(i, i + 2) === '*/') {
                    depth--;
                    i += 2;
                }
                else
                    i++;
            }
            text += sql.slice(start, i);
            continue;
        }
        if (c === '$') {
            const tag = sql.slice(i).match(/^\$(?:[A-Za-z_][A-Za-z0-9_]*)?\$/)?.[0];
            if (tag) {
                const end = sql.indexOf(tag, i + tag.length);
                const stop = end < 0 ? sql.length : end + tag.length;
                text += sql.slice(i, stop);
                i = stop;
                continue;
            }
        }
        if (c === '?' && Array.isArray(params)) {
            if (position >= params.length)
                throw new BadRequestException('缺少 SQL 参数');
            values.push(params[position++]);
            text += '$' + values.length;
            i++;
            continue;
        }
        if (c === ':' && next === ':') {
            text += '::';
            i += 2;
            continue;
        }
        if (c === ':' && /[A-Za-z_]/.test(next || '')) {
            const name = sql.slice(i + 1).match(/^[A-Za-z_][A-Za-z0-9_]*/)![0];
            if (!Object.hasOwn(params, name) || params[name] === undefined)
                throw new BadRequestException(`缺少 SQL 参数: ${name}`);
            if (!slots.has(name)) {
                const value = params[name], items = Array.isArray(value) ? value : [value];
                slots.set(name, items.length ? items.map(item => { values.push(item); return '$' + values.length; }).join(', ') : 'NULL');
            }
            text += slots.get(name);
            i += name.length + 1;
            continue;
        }
        text += c;
        i++;
    }
    return { text, values };
}
@Injectable()
export class SqlService {
    constructor(private readonly db: PrismaService) { }
    async rows(sql: string, params: Record<string, any> = {}, transaction?: any): Promise<any[]> { const bound = bindNamed(sql, params); return jsonValue(await (transaction || this.db).$queryRawUnsafe(DYNAMIC_QUERY_MARKER + '\n' + bound.text, ...bound.values)); }
    async execute(sql: string, params: Record<string, any> = {}, transaction?: any): Promise<number> { const bound = bindNamed(sql, params); return (transaction || this.db).$executeRawUnsafe(bound.text, ...bound.values); }
}
