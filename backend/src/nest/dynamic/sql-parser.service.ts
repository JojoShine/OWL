import { Injectable } from '@nestjs/common';
import { SqlService } from './sql.service';
import { shared } from '../compatibility/shared';
/**
 * SQL解析和验证服务
 *
 * 功能：
 * 1. SQL语法验证
 * 2. 提取查询字段列表
 * 3. 推断字段类型
 * 4. 安全性检查（防止SQL注入）
 * 5. 执行示例查询
 */
const ApiError: any = shared('utils/ApiError');
@Injectable()
export class SqlParserService {
    constructor(private readonly sql: SqlService) { }
    /**
     * 验证SQL语法
     * @param {string} sql - SQL查询语句
     * @returns {Promise<{valid: boolean, error?: string}>}
     */
    async validateSql(sql: any): Promise<any> {
        try {
            // 1. 基础检查
            if (!sql || typeof sql !== 'string') {
                return { valid: false, error: 'SQL语句不能为空' };
            }
            // 2. 安全性检查
            const safetyCheck: any = this.checkSqlSafety(sql);
            if (!safetyCheck.safe) {
                return { valid: false, error: safetyCheck.error };
            }
            // 3. 语法验证 - 使用EXPLAIN检查SQL是否可执行
            // 将 :paramName 格式的占位符替换为NULL，以便EXPLAIN可以执行
            const sqlForValidation: any = sql;
            const explainSql: any = `EXPLAIN ${sqlForValidation}`;
            const params: any = Object.fromEntries([...sql.matchAll(/:([A-Za-z_][A-Za-z0-9_]*)/g)].map((match: any) => [match[1], null]));
            await this.sql.rows(explainSql, params);
            return { valid: true };
        }
        catch (error: any) {
            return {
                valid: false,
                error: `SQL语法错误: ${error.message}`
            };
        }
    }
    /**
     * 解析SQL并提取字段信息
     * @param {string} sql - SQL查询语句
     * @returns {Promise<Array<{fieldName: string, fieldType: string, fieldComment: string}>>}
     */
    async parseSqlFields(sql: any): Promise<any> {
        const safety: any = this.checkSqlSafety(sql);
        if (!safety.safe)
            throw new ApiError(403, safety.error);
        try {
            // 1. 提取SQL中涉及的表名和它们的comment
            const tableComments: any = await this._extractTableComments(sql);
            // 2. 执行查询获取示例数据（限制1条）
            const limitedSql: any = this._addLimitToSql(sql, 1);
            const results: any = await this.sql.rows(limitedSql, {});
            if (!results || results.length === 0) {
                throw new ApiError(400, 'SQL查询没有返回结果，无法推断字段类型');
            }
            const sampleRow: any = results[0];
            // 3. 确定默认分组
            // 如果只有一个表，使用该表的comment作为默认分组
            // 如果有多个表，使用第一个表的comment，或'default'
            const defaultGroup: any = tableComments.length === 1
                ? tableComments[0].comment || 'default'
                : 'default';
            // 4. 提取字段信息
            const fields: any = [];
            for (const [fieldName, value] of Object.entries(sampleRow)) {
                const field: any = {
                    fieldName,
                    fieldType: this._inferFieldType(value, fieldName),
                    fieldComment: this._generateFieldComment(fieldName),
                    // 默认配置
                    isSearchable: false,
                    showInList: true,
                    showInForm: fieldName !== 'id', // id通常不在表单中显示
                    showInDetail: true,
                    listSort: 0,
                    fieldGroup: defaultGroup
                };
                fields.push(field);
            }
            // 5. 返回字段配置和可用的分组选项
            return {
                fields,
                availableGroups: tableComments.map((t: any) => ({
                    value: t.comment || t.tableName,
                    label: t.comment || t.tableName,
                    tableName: t.tableName
                }))
            };
        }
        catch (error: any) {
            throw new ApiError(400, `解析SQL字段失败: ${error.message}`);
        }
    }
    /**
     * 执行示例查询（用于预览）
     * @param {string} sql - SQL查询语句
     * @param {number} limit - 返回记录数限制
     * @returns {Promise<Array>}
     */
    async executeSampleQuery(sql: any, limit: any = 10): Promise<any> {
        try {
            // 1. 安全性检查
            const safetyCheck: any = this.checkSqlSafety(sql);
            if (!safetyCheck.safe) {
                throw new ApiError(403, safetyCheck.error);
            }
            // 2. 添加LIMIT限制
            const limitedSql: any = this._addLimitToSql(sql, limit);
            // 3. 执行查询
            const results: any = await this.sql.rows(limitedSql, {});
            return results;
        }
        catch (error: any) {
            throw new ApiError(400, `执行SQL查询失败: ${error.message}`);
        }
    }
    /**
     * 检查SQL安全性
     * @param {string} sql - SQL查询语句
     * @returns {{safe: boolean, error?: string}}
     */
    checkSqlSafety(sql: any): any {
        const upperSql: any = sql.toUpperCase().trim();
        // 1. 白名单检查：只允许SELECT语句
        if (!upperSql.startsWith('SELECT')) {
            return {
                safe: false,
                error: '只允许SELECT查询语句'
            };
        }
        // 2. 黑名单检查：禁止危险操作
        const dangerousKeywords: any = [
            'DROP',
            'DELETE',
            'UPDATE',
            'INSERT',
            'TRUNCATE',
            'ALTER',
            'CREATE',
            'REPLACE',
            'GRANT',
            'REVOKE',
            'EXECUTE',
            'EXEC'
        ];
        for (const keyword of dangerousKeywords) {
            // 使用正则表达式确保是独立的关键词，而不是字段名的一部分
            const regex: any = new RegExp(`\\b${keyword}\\b`, 'i');
            if (regex.test(sql)) {
                return {
                    safe: false,
                    error: `SQL语句包含禁止的关键词: ${keyword}`
                };
            }
        }
        // 3. 检查多语句（防止SQL注入）
        if (sql.includes(';') && sql.trim().indexOf(';') !== sql.trim().length - 1) {
            return {
                safe: false,
                error: '不允许执行多条SQL语句'
            };
        }
        // 4. 检查注释注入
        if (sql.includes('--') || sql.includes('/*')) {
            return {
                safe: false,
                error: 'SQL语句不能包含注释符号'
            };
        }
        return { safe: true };
    }
    /**
     * 为SQL添加LIMIT子句
     * @param {string} sql - 原始SQL
     * @param {number} limit - 限制数量
     * @returns {string}
     */
    _addLimitToSql(sql: any, limit: any): any {
        // 移除末尾的分号（如果有）
        let cleanSql: any = sql.trim().replace(/;$/, '');
        // 检查是否已有LIMIT子句
        const upperSql: any = cleanSql.toUpperCase();
        if (upperSql.includes('LIMIT')) {
            // 替换现有的LIMIT
            cleanSql = cleanSql.replace(/LIMIT\s+\d+/i, `LIMIT ${limit}`);
        }
        else {
            // 添加LIMIT
            cleanSql = `${cleanSql} LIMIT ${limit}`;
        }
        return cleanSql;
    }
    /**
     * 推断字段类型（基于值的类型）
     * @param {*} value - 字段值
     * @param {string} fieldName - 字段名
     * @returns {string}
     */
    _inferFieldType(value: any, fieldName: any): any {
        // 1. 基于字段名推断
        const lowerFieldName: any = fieldName.toLowerCase();
        if (lowerFieldName.includes('id') || lowerFieldName === 'uuid') {
            return 'UUID';
        }
        if (lowerFieldName.includes('email')) {
            return 'STRING';
        }
        if (lowerFieldName.includes('phone') || lowerFieldName.includes('tel')) {
            return 'STRING';
        }
        if (lowerFieldName.includes('date') || lowerFieldName.includes('time')) {
            return 'DATE';
        }
        if (lowerFieldName.includes('is_') || lowerFieldName.includes('has_')) {
            return 'BOOLEAN';
        }
        // 2. 基于值的类型推断
        if (value === null) {
            return 'STRING'; // 默认类型
        }
        const valueType: any = typeof value;
        switch (valueType) {
            case 'number':
                return Number.isInteger(value) ? 'INTEGER' : 'DECIMAL';
            case 'boolean':
                return 'BOOLEAN';
            case 'string':
                // 检查是否是日期格式
                if (this._isDateString(value)) {
                    return 'DATE';
                }
                // 检查是否是UUID
                if (this._isUUID(value)) {
                    return 'UUID';
                }
                // 根据长度判断
                if (value.length > 255) {
                    return 'TEXT';
                }
                return 'STRING';
            case 'object':
                if (value instanceof Date) {
                    return 'DATE';
                }
                return 'JSON';
            default:
                return 'STRING';
        }
    }
    /**
     * 生成字段注释（基于字段名）
     * @param {string} fieldName - 字段名
     * @returns {string}
     */
    _generateFieldComment(fieldName: any): any {
        // 简单的驼峰转中文映射
        const commonMappings: any = {
            id: 'ID',
            name: '名称',
            title: '标题',
            description: '描述',
            content: '内容',
            status: '状态',
            type: '类型',
            category: '分类',
            created_at: '创建时间',
            updated_at: '更新时间',
            deleted_at: '删除时间',
            created_by: '创建人',
            updated_by: '更新人',
            email: '邮箱',
            phone: '电话',
            address: '地址',
            age: '年龄',
            gender: '性别',
            birthday: '生日',
            avatar: '头像',
            sort: '排序',
            remark: '备注'
        };
        const lowerFieldName: any = fieldName.toLowerCase();
        return commonMappings[lowerFieldName] || fieldName;
    }
    /**
     * 检查字符串是否是日期格式
     * @param {string} value - 字符串值
     * @returns {boolean}
     */
    _isDateString(value: any): any {
        // 简单的日期格式检查
        const datePattern: any = /^\d{4}-\d{2}-\d{2}/;
        return datePattern.test(value) && !isNaN(Date.parse(value));
    }
    /**
     * 检查字符串是否是UUID格式
     * @param {string} value - 字符串值
     * @returns {boolean}
     */
    _isUUID(value: any): any {
        const uuidPattern: any = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidPattern.test(value);
    }
    /**
     * 从SQL中提取表名并获取它们的comment
     * @param {string} sql - SQL查询语句
     * @returns {Promise<Array<{tableName: string, comment: string}>>}
     */
    async _extractTableComments(sql: any): Promise<any> {
        try {
            // 1. 使用正则表达式提取FROM和JOIN后面的表名
            // 匹配 FROM table_name 或 FROM table_name AS alias 或 FROM table_name alias
            // 以及 JOIN table_name 的各种形式
            const tablePattern: any = /(?:FROM|JOIN)\s+([a-z_][a-z0-9_]*)\s*(?:AS\s+[a-z_][a-z0-9_]*|\s+[a-z_][a-z0-9_]*)?/gi;
            const tableNames: any = new Set();
            let match: any;
            while ((match = tablePattern.exec(sql)) !== null) {
                // match[1] 是表名
                tableNames.add(match[1].toLowerCase());
            }
            if (tableNames.size === 0) {
                return [{ tableName: 'unknown', comment: 'default' }];
            }
            // 2. 查询这些表的comment
            const tableList: any = Array.from(tableNames);
            const placeholders: any = tableList.map((_: any, i: any) => `:table${i}`).join(', ');
            const query: any = `
        SELECT
          tablename as "tableName",
          obj_description((schemaname || '.' || tablename)::regclass, 'pg_class') as comment
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename IN (${placeholders})
      `;
            const results: any = await this.sql.rows(query, Object.fromEntries(tableList.map((table: any, i: any) => ['table' + i, table])));
            // 3. 返回表名和comment的映射
            return results.map((row: any) => ({
                tableName: row.tableName,
                comment: row.comment || row.tableName
            }));
        }
        catch (error: any) {
            // 如果提取失败，返回默认值
            return [{ tableName: 'default', comment: 'default' }];
        }
    }
}
// 导出单例
