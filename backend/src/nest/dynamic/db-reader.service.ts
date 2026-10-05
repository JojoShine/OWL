import { Injectable } from '@nestjs/common';
import { SqlService } from './sql.service';
import { shared } from '../compatibility/shared';
const { logger }: any = shared('config/logger');
@Injectable()
export class DbReaderService {
    [key: string]: any;
    constructor(private readonly sql: SqlService) { }
    /**
     * 获取所有数据库表列表
     * @param {Object} options - 查询选项
     * @returns {Promise<Object>} 表列表和分页信息
     */
    async getTables(options: any = {}): Promise<any> {
        const { search, page = 1, limit = 10 }: any = options;
        try {
            // 构建基础查询条件
            let whereClause: any = `
        WHERE t.table_schema = 'public'
          AND t.table_type = 'BASE TABLE'
          AND t.table_name NOT ILIKE 'SequelizeMeta'
      `;
            // 添加搜索条件
            const replacements: any = {};
            if (search) {
                whereClause += ` AND t.table_name LIKE :search`;
                replacements.search = `%${search}%`;
            }
            // 查询总数
            const countQuery: any = `
        SELECT COUNT(*) as total
        FROM information_schema.tables t
        ${whereClause}
      `;
            const [countResult]: any = await this.sql.rows(countQuery, replacements, undefined).then((rows: any) => [rows]);
            const total: any = parseInt(countResult[0].total);
            // 计算偏移量
            const offset: any = (page - 1) * limit;
            // 查询数据
            let dataQuery: any = `
        SELECT
          t.table_name,
          obj_description(('"' || t.table_schema || '"."' || t.table_name || '"')::regclass) AS table_comment,
          (
            SELECT COUNT(*)
            FROM information_schema.columns c
            WHERE c.table_name = t.table_name
              AND c.table_schema = t.table_schema
          ) AS column_count,
          (
            -- 模块配置和生成历史都存在，或者是 owl_ 开头的系统表
            SELECT (
              (
                EXISTS(
                  SELECT 1
                  FROM owl_generated_modules gm
                  WHERE gm.table_name = t.table_name
                    AND gm.deleted_at IS NULL
                )
                AND EXISTS(
                  SELECT 1
                  FROM owl_generation_history gh
                  WHERE gh.table_name = t.table_name
                )
              )
              OR t.table_name LIKE 'owl_%'
            )
          ) AS is_generated,
          (
            -- 检查是否已包含全部 6 个审计字段
            SELECT COUNT(*) >= 6
            FROM information_schema.columns c
            WHERE c.table_name = t.table_name
              AND c.table_schema = 'public'
              AND c.column_name IN ('created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by')
          ) AS audit_fields_complete
        FROM information_schema.tables t
        ${whereClause}
        ORDER BY t.table_name
        LIMIT ${limit} OFFSET ${offset}
      `;
            const [results]: any = await this.sql.rows(dataQuery, replacements, undefined).then((rows: any) => [rows]);
            const data: any = results.map((row: any) => ({
                tableName: row.table_name,
                comment: row.table_comment || '',
                columnCount: parseInt(row.column_count),
                isGenerated: row.is_generated,
                auditFieldsComplete: row.audit_fields_complete,
            }));
            return {
                data,
                pagination: {
                    total,
                    page: parseInt(page),
                    pageSize: parseInt(limit),
                    totalPages: Math.ceil(total / limit),
                },
            };
        }
        catch (error: any) {
            logger.error('获取表列表失败:', error);
            throw error;
        }
    }
    /**
     * 获取表结构详情
     * @param {String} tableName - 表名
     * @returns {Promise<Object>} 表结构详情
     */
    async getTableStructure(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            // 获取表注释
            const [tableInfo]: any = await this.sql.rows(`
        SELECT obj_description((quote_ident('public') || '.' || quote_ident(:tableName))::regclass) AS table_comment
      `, { tableName }, transaction).then((rows: any) => [rows]);
            // 获取字段信息
            const columns: any = await this.getTableColumns(tableName, options);
            // 获取索引信息
            const indexes: any = await this.getTableIndexes(tableName, options);
            // 获取主键信息
            const primaryKeys: any = await this.getPrimaryKeys(tableName, options);
            // 获取外键信息
            const foreignKeys: any = await this.getForeignKeys(tableName, options);
            return {
                tableName,
                comment: tableInfo[0]?.table_comment || '',
                columns,
                indexes,
                primaryKeys,
                foreignKeys,
            };
        }
        catch (error: any) {
            logger.error(`获取表 ${tableName} 结构失败:`, error);
            throw error;
        }
    }
    /**
     * 获取表字段信息
     * @param {String} tableName - 表名
     * @returns {Promise<Array>} 字段列表
     */
    async getTableColumns(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            const [results]: any = await this.sql.rows(`
        SELECT
          c.column_name,
          c.data_type,
          c.character_maximum_length,
          c.numeric_precision,
          c.numeric_scale,
          c.is_nullable,
          c.column_default,
          c.udt_name,
          col_description((quote_ident(c.table_schema) || '.' || quote_ident(c.table_name))::regclass::oid, c.ordinal_position) AS column_comment
        FROM information_schema.columns c
        WHERE c.table_name = :tableName
          AND c.table_schema = 'public'
        ORDER BY c.ordinal_position
      `, { tableName }, transaction).then((rows: any) => [rows]);
            return results.map((col: any) => ({
                name: col.column_name,
                type: col.data_type,
                length: col.character_maximum_length,
                precision: col.numeric_precision,
                scale: col.numeric_scale,
                nullable: col.is_nullable === 'YES',
                defaultValue: col.column_default,
                udtName: col.udt_name,
                comment: col.column_comment || '',
            }));
        }
        catch (error: any) {
            logger.error(`获取表 ${tableName} 字段信息失败:`, error);
            throw error;
        }
    }
    /**
     * 获取表索引信息
     * @param {String} tableName - 表名
     * @returns {Promise<Array>} 索引列表
     */
    async getTableIndexes(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            const [results]: any = await this.sql.rows(`
        SELECT
          i.indexname AS index_name,
          i.indexdef AS index_definition,
          CASE
            WHEN i.indexdef LIKE '%UNIQUE%' THEN true
            ELSE false
          END AS is_unique
        FROM pg_indexes i
        WHERE i.tablename = :tableName
          AND i.schemaname = 'public'
        ORDER BY i.indexname
      `, { tableName }, transaction).then((rows: any) => [rows]);
            return results.map((idx: any) => ({
                name: idx.index_name,
                definition: idx.index_definition,
                isUnique: idx.is_unique,
            }));
        }
        catch (error: any) {
            logger.error(`获取表 ${tableName} 索引信息失败:`, error);
            throw error;
        }
    }
    /**
     * 获取主键信息
     * @param {String} tableName - 表名
     * @returns {Promise<Array>} 主键列名列表
     */
    async getPrimaryKeys(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            const [results]: any = await this.sql.rows(`
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = :tableName
          AND tc.table_schema = 'public'
        ORDER BY kcu.ordinal_position
      `, { tableName }, transaction).then((rows: any) => [rows]);
            return results.map((row: any) => row.column_name);
        }
        catch (error: any) {
            logger.error(`获取表 ${tableName} 主键信息失败:`, error);
            throw error;
        }
    }
    /**
     * 获取外键信息
     * @param {String} tableName - 表名
     * @returns {Promise<Array>} 外键列表
     */
    async getForeignKeys(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            const [results]: any = await this.sql.rows(`
        SELECT
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.delete_rule,
          rc.update_rule
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = :tableName
          AND tc.table_schema = 'public'
      `, { tableName }, transaction).then((rows: any) => [rows]);
            return results.map((fk: any) => ({
                columnName: fk.column_name,
                referencedTable: fk.foreign_table_name,
                referencedColumn: fk.foreign_column_name,
                onDelete: fk.delete_rule,
                onUpdate: fk.update_rule,
            }));
        }
        catch (error: any) {
            logger.error(`获取表 ${tableName} 外键信息失败:`, error);
            throw error;
        }
    }
    /**
     * 检查表是否存在
     * @param {String} tableName - 表名
     * @returns {Promise<Boolean>} 是否存在
     */
    async tableExists(tableName: any, options: any = {}): Promise<any> {
        const { transaction }: any = options;
        try {
            const [results]: any = await this.sql.rows(`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name = :tableName
        ) AS exists
      `, { tableName }, transaction).then((rows: any) => [rows]);
            return results[0].exists;
        }
        catch (error: any) {
            logger.error(`检查表 ${tableName} 是否存在失败:`, error);
            throw error;
        }
    }
}
