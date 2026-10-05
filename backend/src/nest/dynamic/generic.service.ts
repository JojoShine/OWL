import { Injectable } from '@nestjs/common';
import { SqlService } from './sql.service';
import { shared } from '../compatibility/shared';
const ApiError: any = shared('utils/ApiError');
const { logger }: any = shared('config/logger');
/**
 * 通用CRUD服务 - 配置驱动
 * 根据 GeneratedModule 配置动态执行数据库操作
 * 无需生成代码文件，实现零重启
 */
@Injectable()
export class GenericService {
    [key: string]: any;
    constructor(private readonly sql: SqlService) { }
    // 表字段缓存（用于检查审计字段是否存在），5分钟过期
    _tableColumnsCache: Record<string, any> = {};
    _tableColumnsCacheTime: Record<string, any> = {};
    _TABLE_COLUMNS_CACHE_TTL = 5 * 60 * 1000;
    /**
     * 获取表的字段名列表（带缓存）
     * 使用模块：代码生成器（Generic CRUD）
     * 使用场景：动态判断表是否包含审计字段，避免硬编码
     *
     * @param {string} tableName - 表名
     * @returns {Promise<Set<string>>} 字段名集合
     */
    async _getTableColumns(tableName: any): Promise<any> {
        const now: any = Date.now();
        if (this._tableColumnsCache[tableName] &&
            (now - (this._tableColumnsCacheTime[tableName] || 0)) < this._TABLE_COLUMNS_CACHE_TTL) {
            return this._tableColumnsCache[tableName];
        }
        const columns: any = await this.sql.rows(`SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = :tableName`, { tableName }, undefined);
        const columnSet: any = new Set(columns.map((c: any) => c.column_name));
        this._tableColumnsCache[tableName] = columnSet;
        this._tableColumnsCacheTime[tableName] = now;
        return columnSet;
    }
    /**
     * 检查表是否有某个字段
     */
    async _hasColumn(tableName: any, columnName: any): Promise<any> {
        const columns: any = await this._getTableColumns(tableName);
        return columns.has(columnName);
    }
    /**
     * 获取列表（分页 + 搜索）
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} query - 查询参数
     */
    async list(moduleConfig: any, query: any): Promise<any> {
        // 检查是否使用动态SQL
        if (moduleConfig.custom_sql) {
            return this._executeCustomSqlList(moduleConfig, query);
        }
        const { page = 1, limit = 10, sort = 'created_at', order = 'DESC', ...searchParams }: any = query;
        const offset: any = (page - 1) * limit;
        const tableName: any = moduleConfig.table_name;
        // 验证 sort 和 order 参数防止 SQL 注入
        const validSort: any = this._validateSortField(moduleConfig, sort);
        const validOrder: any = this._validateOrder(order);
        // 构建搜索条件
        const { whereClause, replacements }: any = await this._buildWhereClauseWithSoftDelete(moduleConfig, tableName, searchParams);
        // 添加分页参数
        replacements.limit = parseInt(limit);
        replacements.offset = offset;
        // 使用安全的表名
        const safeTableName: any = this._escapeIdentifier(tableName);
        // 查询数据（Sequelize timezone: '+08:00' 已自动处理时区转换，无需手动 AT TIME ZONE）
        const dataQuery: any = `
      SELECT * FROM ${safeTableName}
      ${whereClause}
      ORDER BY ${this._escapeIdentifier(validSort)} ${validOrder}
      LIMIT :limit OFFSET :offset
    `;
        const rows: any = await this.sql.rows(dataQuery, replacements, undefined);
        // 查询总数
        const countQuery: any = `
      SELECT COUNT(*) as count FROM ${safeTableName}
      ${whereClause}
    `;
        const [{ count }]: any = await this.sql.rows(countQuery, replacements, undefined);
        logger.info(`Generic list query executed for table: ${tableName}, results: ${rows.length}`);
        return {
            data: rows,
            pagination: {
                total: parseInt(count),
                page: parseInt(page),
                pageSize: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }
    /**
     * 获取详情
     * @param {Object} moduleConfig - 模块配置
     * @param {Number|String} id - 记录ID
     */
    async getById(moduleConfig: any, id: any): Promise<any> {
        // 检查是否使用动态SQL
        if (moduleConfig.custom_sql) {
            return this._executeCustomSqlDetail(moduleConfig, id);
        }
        const tableName: any = moduleConfig.table_name;
        const safeTableName: any = this._escapeIdentifier(tableName);
        // 如果表有 deleted_at 字段，过滤已软删除的记录
        const softDeleteFilter: any = await this._hasColumn(tableName, 'deleted_at')
            ? ' AND "deleted_at" IS NULL' : '';
        const query: any = `SELECT * FROM ${safeTableName} WHERE id = :id${softDeleteFilter} LIMIT 1`;
        const [item]: any = await this.sql.rows(query, { id }, undefined);
        if (!item) {
            throw ApiError.notFound(`${moduleConfig.description}不存在`);
        }
        logger.info(`Generic getById executed for table: ${tableName}, id: ${id}`);
        return item;
    }
    /**
     * 创建记录
     *
     * 使用模块：代码生成器（Generic CRUD）
     * 使用场景：前端创建数据时自动填充 created_at/updated_at/created_by/updated_by
     *
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} data - 创建数据
     * @param {string} [userId] - 当前用户ID
     */
    async create(moduleConfig: any, data: any, userId: any = null): Promise<any> {
        if (!moduleConfig.enable_create) {
            throw ApiError.forbidden('此模块不允许创建操作');
        }
        const tableName: any = moduleConfig.table_name;
        // 验证必填字段
        this._validateRequiredFields(moduleConfig, data);
        // 验证字段值规则
        this._validateFieldValues(moduleConfig, data, false);
        // 过滤掉系统字段和不存在的字段
        const validData: any = this._filterValidFields(moduleConfig, data);
        // 构建插入SQL
        const fields: any = Object.keys(validData);
        const fieldNames: any = fields.map((f: any) => this._escapeIdentifier(f)).join(', ');
        const fieldPlaceholders: any = fields.map((f: any) => `:${f}`).join(', ');
        // 动态拼接审计字段
        const auditColumns: any = ['created_at', 'updated_at'];
        const auditValues: any = ['NOW()', 'NOW()'];
        const auditReplacements: any = {};
        if (userId && await this._hasColumn(tableName, 'created_by')) {
            auditColumns.push('created_by', 'updated_by');
            auditValues.push(':created_by', ':updated_by');
            auditReplacements.created_by = userId;
            auditReplacements.updated_by = userId;
        }
        const safeTableName: any = this._escapeIdentifier(tableName);
        const query: any = `
      INSERT INTO ${safeTableName} (${fieldNames}, ${auditColumns.join(', ')})
      VALUES (${fieldPlaceholders}, ${auditValues.join(', ')})
      RETURNING *
    `;
        const [result]: any = await this.sql.rows(query, { ...validData, ...auditReplacements }, undefined).then((rows: any) => [rows]);
        const item: any = result[0];
        logger.info(`Generic create executed for table: ${tableName}, id: ${item.id}`);
        return item;
    }
    /**
     * 更新记录
     *
     * 使用模块：代码生成器（Generic CRUD）
     * 使用场景：前端更新数据时自动填充 updated_at/updated_by
     *
     * @param {Object} moduleConfig - 模块配置
     * @param {Number|String} id - 记录ID
     * @param {Object} data - 更新数据
     * @param {string} [userId] - 当前用户ID
     */
    async update(moduleConfig: any, id: any, data: any, userId: any = null): Promise<any> {
        if (!moduleConfig.enable_update) {
            throw ApiError.forbidden('此模块不允许更新操作');
        }
        const tableName: any = moduleConfig.table_name;
        // 先检查记录是否存在
        await this.getById(moduleConfig, id);
        // 过滤掉系统字段和不存在的字段
        const validData: any = this._filterValidFields(moduleConfig, data);
        // 验证字段值规则（更新模式）
        this._validateFieldValues(moduleConfig, validData, true);
        // 构建更新SQL
        const fields: any = Object.keys(validData);
        if (fields.length === 0) {
            throw ApiError.badRequest('没有可更新的字段');
        }
        const setClause: any = fields.map((f: any) => `${this._escapeIdentifier(f)} = :${f}`).join(', ');
        // 动态拼接审计字段
        let auditSet: any = 'updated_at = NOW()';
        const auditReplacements: any = {};
        if (userId && await this._hasColumn(tableName, 'updated_by')) {
            auditSet += ', updated_by = :updated_by';
            auditReplacements.updated_by = userId;
        }
        const safeTableName: any = this._escapeIdentifier(tableName);
        const query: any = `
      UPDATE ${safeTableName}
      SET ${setClause}, ${auditSet}
      WHERE id = :id
      RETURNING *
    `;
        const [result]: any = await this.sql.rows(query, { ...validData, ...auditReplacements, id }, undefined).then((rows: any) => [rows]);
        const item: any = result[0];
        logger.info(`Generic update executed for table: ${tableName}, id: ${id}`);
        return item;
    }
    /**
     * 删除记录（软删除）
     *
     * 使用模块：代码生成器（Generic CRUD）
     * 使用场景：前端删除数据时自动填充 deleted_at/deleted_by
     *
     * @param {Object} moduleConfig - 模块配置
     * @param {Number|String} id - 记录ID
     * @param {string} [userId] - 当前用户ID
     */
    async delete(moduleConfig: any, id: any, userId: any = null): Promise<any> {
        if (!moduleConfig.enable_delete) {
            throw ApiError.forbidden('此模块不允许删除操作');
        }
        const tableName: any = moduleConfig.table_name;
        // 先检查记录是否存在
        await this.getById(moduleConfig, id);
        const safeTableName: any = this._escapeIdentifier(tableName);
        // 如果表有 deleted_at 字段，执行软删除；否则物理删除
        if (await this._hasColumn(tableName, 'deleted_at')) {
            let setClause: any = 'deleted_at = NOW()';
            const auditReplacements: any = {};
            if (userId && await this._hasColumn(tableName, 'deleted_by')) {
                setClause += ', deleted_by = :deleted_by';
                auditReplacements.deleted_by = userId;
            }
            const query: any = `UPDATE ${safeTableName} SET ${setClause} WHERE id = :id`;
            await this.sql.execute(query, { ...auditReplacements, id }, undefined);
        }
        else {
            const query: any = `DELETE FROM ${safeTableName} WHERE id = :id`;
            await this.sql.execute(query, { id }, undefined);
        }
        logger.info(`Generic delete executed for table: ${tableName}, id: ${id}`);
        return { message: `${moduleConfig.description}删除成功` };
    }
    /**
     * 批量删除记录（软删除）
     *
     * 使用模块：代码生成器（Generic CRUD）
     * 使用场景：前端批量删除数据时自动填充 deleted_at/deleted_by
     *
     * @param {Object} moduleConfig - 模块配置
     * @param {Array} ids - 记录ID列表
     * @param {string} [userId] - 当前用户ID
     */
    async batchDelete(moduleConfig: any, ids: any, userId: any = null): Promise<any> {
        if (!moduleConfig.enable_batch_delete) {
            throw ApiError.forbidden('此模块不允许批量删除操作');
        }
        if (!Array.isArray(ids) || ids.length === 0) {
            throw ApiError.badRequest('请提供要删除的ID列表');
        }
        const tableName: any = moduleConfig.table_name;
        // 构建IN条件的占位符
        const placeholders: any = ids.map((_: any, i: any) => `:id${i}`).join(', ');
        const replacements: any = {};
        ids.forEach((id: any, i: any) => {
            replacements[`id${i}`] = id;
        });
        const safeTableName: any = this._escapeIdentifier(tableName);
        // 如果表有 deleted_at 字段，执行软删除；否则物理删除
        if (await this._hasColumn(tableName, 'deleted_at')) {
            let setClause: any = 'deleted_at = NOW()';
            if (userId && await this._hasColumn(tableName, 'deleted_by')) {
                setClause += ', deleted_by = :deleted_by';
                replacements.deleted_by = userId;
            }
            const query: any = `UPDATE ${safeTableName} SET ${setClause} WHERE id IN (${placeholders})`;
            const [, count]: any = await this.sql.execute(query, replacements, undefined).then((count: any) => [null, count]);
            logger.info(`Generic batchDelete (soft) executed for table: ${tableName}, count: ${count}`);
            return { message: `成功删除 ${count} 条记录`, count };
        }
        else {
            const query: any = `DELETE FROM ${safeTableName} WHERE id IN (${placeholders})`;
            const [, count]: any = await this.sql.execute(query, replacements, undefined).then((count: any) => [null, count]);
            logger.info(`Generic batchDelete executed for table: ${tableName}, count: ${count}`);
            return { message: `成功删除 ${count} 条记录`, count };
        }
    }
    /**
     * 导出数据
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} query - 查询参数
     */
    async export(moduleConfig: any, query: any): Promise<any> {
        if (!moduleConfig.enable_export) {
            throw ApiError.forbidden('此模块不允许导出操作');
        }
        const tableName: any = moduleConfig.table_name;
        // 构建搜索条件（不分页，带软删除过滤）
        const { whereClause, replacements }: any = await this._buildWhereClauseWithSoftDelete(moduleConfig, tableName, query);
        const safeTableNameExport: any = this._escapeIdentifier(tableName);
        const exportQuery: any = `
      SELECT * FROM ${safeTableNameExport}
      ${whereClause}
      ORDER BY created_at DESC
    `;
        const items: any = await this.sql.rows(exportQuery, replacements, undefined);
        logger.info(`Generic export executed for table: ${tableName}, count: ${items.length}`);
        return items;
    }
    // 审计字段列表（下载模板和导入时需排除）
    static get AUDIT_FIELDS() {
        return ['id', 'created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by', 'deleted_by'];
    }
    /**
     * 下载导入模板
     * @param {Object} moduleConfig - 模块配置
     * @returns {Object} 模板信息
     */
    async downloadTemplate(moduleConfig: any): Promise<any> {
        if (!moduleConfig.enable_import) {
            throw ApiError.forbidden('此模块不允许导入操作');
        }
        const auditFields: any = GenericService.AUDIT_FIELDS;
        // 返回字段信息用于前端生成模板（排除主键和审计字段）
        return {
            tableName: moduleConfig.table_name,
            fields: moduleConfig.fields
                .filter((f: any) => f.show_in_form && !auditFields.includes(f.field_name))
                .map((f: any) => ({
                name: f.field_name || '',
                comment: f.field_comment || '',
                type: f.field_type || '',
                required: f.is_required,
            })),
        };
    }
    /**
     * 导入Excel数据
     * @param {Object} moduleConfig - 模块配置
     * @param {Array} rows - 导入的数据行
     * @returns {Object} 导入结果
     */
    async importFromExcel(moduleConfig: any, rows: any): Promise<any> {
        if (!moduleConfig.enable_import) {
            throw ApiError.forbidden('此模块不允许导入操作');
        }
        const tableName: any = moduleConfig.table_name;
        const errors: any = [];
        const successRows: any = [];
        // 验证数据
        rows.forEach((row: any, index: any) => {
            const rowNum: any = index + 3; // Excel行号（第一行是字段名，第二行是注释，从第三行开始是实际数据）
            // 检查必填字段（排除审计字段）
            const auditFields: any = GenericService.AUDIT_FIELDS;
            moduleConfig.fields
                .filter((f: any) => f.is_required && f.show_in_form && !auditFields.includes(f.field_name))
                .forEach((field: any, fieldIndex: any) => {
                if (!row[field.field_name]) {
                    errors.push({
                        row: rowNum,
                        field: field.field_name,
                        fieldLabel: field.field_comment || field.field_name,
                        columnNum: fieldIndex + 1,
                        message: `${field.field_comment || field.field_name}不能为空`,
                    });
                }
            });
            // 检查字段值规则（长度、格式、范围等）- 逐字段校验（排除审计字段）
            moduleConfig.fields
                .filter((f: any) => f.show_in_form && !auditFields.includes(f.field_name))
                .forEach((field: any, fieldIndex: any) => {
                const fieldName: any = field.field_name;
                const value: any = row[fieldName];
                const rules: any = field.form_rules;
                // 如果没有规则或值为空，跳过
                if (!rules || Object.keys(rules).length === 0)
                    return;
                if (value === null || value === '' || value === undefined)
                    return;
                const fieldLabel: any = field.field_comment || fieldName;
                // 精确长度校验（兼容 exactLength 和 length 两种属性名）
                const exactLen: any = rules.exactLength || rules.length;
                if (exactLen && String(value).length !== exactLen) {
                    errors.push({
                        row: rowNum,
                        field: fieldName,
                        fieldLabel,
                        columnNum: fieldIndex + 1,
                        message: `${fieldLabel}长度必须为${exactLen}位`,
                    });
                    return;
                }
                if (rules.minLength && String(value).length < rules.minLength) {
                    errors.push({
                        row: rowNum,
                        field: fieldName,
                        fieldLabel,
                        columnNum: fieldIndex + 1,
                        message: `${fieldLabel}长度不能少于${rules.minLength}位`,
                    });
                    return;
                }
                if (rules.maxLength && String(value).length > rules.maxLength) {
                    errors.push({
                        row: rowNum,
                        field: fieldName,
                        fieldLabel,
                        columnNum: fieldIndex + 1,
                        message: `${fieldLabel}长度不能超过${rules.maxLength}位`,
                    });
                    return;
                }
                // 正则格式校验
                if (rules.pattern) {
                    const regex: any = new RegExp(rules.pattern);
                    if (!regex.test(value)) {
                        errors.push({
                            row: rowNum,
                            field: fieldName,
                            fieldLabel,
                            columnNum: fieldIndex + 1,
                            message: `${fieldLabel}格式不正确`,
                        });
                        return;
                    }
                }
                // 数值范围校验
                if (typeof value === 'number') {
                    if (rules.min !== undefined && value < rules.min) {
                        errors.push({
                            row: rowNum,
                            field: fieldName,
                            fieldLabel,
                            columnNum: fieldIndex + 1,
                            message: `${fieldLabel}不能小于${rules.min}`,
                        });
                        return;
                    }
                    if (rules.max !== undefined && value > rules.max) {
                        errors.push({
                            row: rowNum,
                            field: fieldName,
                            fieldLabel,
                            columnNum: fieldIndex + 1,
                            message: `${fieldLabel}不能大于${rules.max}`,
                        });
                        return;
                    }
                }
                // 枚举校验
                if (rules.enum && Array.isArray(rules.enum)) {
                    if (!rules.enum.includes(value)) {
                        errors.push({
                            row: rowNum,
                            field: fieldName,
                            fieldLabel,
                            columnNum: fieldIndex + 1,
                            message: `${fieldLabel}值不在允许范围内`,
                        });
                        return;
                    }
                }
            });
            // 如果没有错误，添加到成功行
            if (!errors.some((e: any) => e.row === rowNum)) {
                successRows.push({ ...row, rowNum });
            }
        });
        // 批量插入成功的数据
        let successCount: any = 0;
        if (successRows.length > 0) {
            // 保留完整的字段配置，便于错误时获取字段注释（排除主键和审计字段）
            const auditFields: any = GenericService.AUDIT_FIELDS;
            const fieldConfigs: any = moduleConfig.fields.filter((f: any) => f.show_in_form && !auditFields.includes(f.field_name));
            const fields: any = fieldConfigs.map((f: any) => f.field_name);
            const safeTableNameImport: any = this._escapeIdentifier(tableName);
            const safeFieldNames: any = fields.map((f: any) => this._escapeIdentifier(f));
            // 批量插入配置：每次插入1000条
            const BATCH_SIZE: any = 1000;
            const batches: any = [];
            for (let i: any = 0; i < successRows.length; i += BATCH_SIZE) {
                batches.push(successRows.slice(i, i + BATCH_SIZE));
            }
            // 逐批插入数据
            for (const batch of batches) {
                try {
                    const values: any = batch.map((row: any) => {
                        return fields.map((field: any, idx: any) => {
                            const value: any = row[field];
                            const fieldConfig: any = fieldConfigs[idx];
                            // 空值处理
                            if (value === '' || value === null || value === undefined) {
                                return null;
                            }
                            // 日期字段处理
                            const fieldType: any = fieldConfig.field_type?.toLowerCase();
                            if (fieldType && (fieldType.includes('date') || fieldType.includes('timestamp') || fieldType.includes('time'))) {
                                const parsedDate: any = this._parseDate(value);
                                if (parsedDate === null && value) {
                                    // 日期格式不正确，但有值
                                    throw new Error(`第 ${row.rowNum} 行，字段"${fieldConfig.field_comment || field}"的日期格式不正确: ${value}`);
                                }
                                return parsedDate;
                            }
                            return value;
                        });
                    });
                    // 使用 ? 作为占位符，Sequelize 会自动转换为 $1, $2 等
                    const placeholders: any = batch.map(() => {
                        const fieldPlaceholders: any = fields.map(() => '?').join(',');
                        return `(${fieldPlaceholders})`;
                    }).join(',');
                    const flatValues: any = values.flat();
                    const insertQuery: any = `
            INSERT INTO ${safeTableNameImport} (${safeFieldNames.join(',')})
            VALUES ${placeholders}
          `;
                    await this.sql.execute(insertQuery, flatValues, undefined);
                    successCount += batch.length;
                }
                catch (error: any) {
                    // 如果批量插入失败，逐行插入以找出具体的错误行
                    logger.warn(`Batch insert failed, falling back to row-by-row insert for batch of ${batch.length} rows`);
                    for (const successRow of batch) {
                        try {
                            const values: any = fields.map((field: any, idx: any) => {
                                const value: any = successRow[field];
                                const fieldConfig: any = fieldConfigs[idx];
                                // 空值处理
                                if (value === '' || value === null || value === undefined) {
                                    return null;
                                }
                                // 日期字段处理
                                const fieldType: any = fieldConfig.field_type?.toLowerCase();
                                if (fieldType && (fieldType.includes('date') || fieldType.includes('timestamp') || fieldType.includes('time'))) {
                                    const parsedDate: any = this._parseDate(value);
                                    if (parsedDate === null && value) {
                                        throw new Error(`第 ${successRow.rowNum} 行，字段"${fieldConfig.field_comment || field}"的日期格式不正确: ${value}`);
                                    }
                                    return parsedDate;
                                }
                                return value;
                            });
                            const placeholders: any = fields.map(() => '?').join(',');
                            const insertQuery: any = `
                INSERT INTO ${safeTableNameImport} (${safeFieldNames.join(',')})
                VALUES (${placeholders})
              `;
                            await this.sql.execute(insertQuery, values, undefined);
                            successCount++;
                        }
                        catch (rowError: any) {
                            // 从错误消息中提取值，通过值反查字段
                            let fieldName: any = null;
                            let fieldLabel: any = '未知字段';
                            let columnNum: any = 0;
                            // 提取错误消息中引号内的值
                            const valueMatch: any = rowError.message.match(/: "([^"]+)"/);
                            const errorValue: any = valueMatch ? valueMatch[1] : null;
                            // 如果找到错误值，遍历字段查找匹配
                            if (errorValue) {
                                for (let i: any = 0; i < fieldConfigs.length; i++) {
                                    const fieldConfig: any = fieldConfigs[i];
                                    const rowValue: any = successRow[fieldConfig.field_name];
                                    if (rowValue && String(rowValue) === errorValue) {
                                        fieldName = fieldConfig.field_name;
                                        fieldLabel = fieldConfig.field_comment || fieldConfig.field_name;
                                        columnNum = i + 1;
                                        break;
                                    }
                                }
                            }
                            // 优化错误提示
                            let errorMessage: any = rowError.message;
                            if (rowError.message.includes('date/time field value out of range')) {
                                errorMessage = `日期时间格式错误: "${errorValue}"`;
                            }
                            else if (rowError.message.includes('invalid input syntax')) {
                                errorMessage = `数据格式错误: "${errorValue}"`;
                            }
                            errors.push({
                                row: successRow.rowNum,
                                field: fieldName || '未知字段',
                                fieldLabel: fieldLabel,
                                columnNum: columnNum,
                                message: errorMessage,
                            });
                            logger.error(`Import error row ${successRow.rowNum}:`, rowError.message);
                        }
                    }
                }
            }
            logger.info(`Generic import executed for table: ${tableName}, success: ${successCount}, failure: ${errors.length}`);
        }
        return {
            success: errors.length === 0,
            message: `导入完成：成功 ${successCount} 条，失败 ${errors.length} 条`,
            successCount,
            failureCount: errors.length,
            errors: errors.slice(0, 100), // 只返回前100条错误
        };
    }
    /**
     * 构建WHERE条件子句
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} searchParams - 搜索参数
     * @returns {Object} { whereClause, replacements }
     */
    _buildWhereClause(moduleConfig: any, searchParams: any): any {
        const conditions: any = [];
        const replacements: any = {};
        const processedFields: any = new Set(); // 记录已处理的字段
        // 获取可搜索字段
        const searchableFields: any = moduleConfig.fields.filter((f: any) => f.is_searchable);
        // 首先处理字段配置中的搜索
        searchableFields.forEach((field: any) => {
            const fieldName: any = field.field_name;
            const safeFieldName: any = this._escapeIdentifier(fieldName);
            const searchValue: any = searchParams[fieldName];
            const searchType: any = field.search_type || 'like';
            // 对于日期时间字段，优先使用范围查询
            const isDateTimeField: any = ['date', 'timestamp', 'timestamp without time zone', 'timestamp with time zone'].includes(field.field_type?.toLowerCase());
            if (isDateTimeField || searchType === 'range') {
                // 范围查询（用于数字和日期）
                const startValue: any = searchParams[`${fieldName}_start`];
                const endValue: any = searchParams[`${fieldName}_end`];
                if (startValue !== undefined && startValue !== null && startValue !== '') {
                    conditions.push(`${safeFieldName} >= :${fieldName}_start`);
                    replacements[`${fieldName}_start`] = startValue;
                    processedFields.add(fieldName);
                }
                if (endValue !== undefined && endValue !== null && endValue !== '') {
                    conditions.push(`${safeFieldName} <= :${fieldName}_end`);
                    replacements[`${fieldName}_end`] = endValue;
                    processedFields.add(fieldName);
                }
                // 如果已经处理了范围查询，跳过后续的单值查询
                if (startValue || endValue) {
                    return;
                }
            }
            // 处理单值查询
            if (searchValue !== undefined && searchValue !== null && searchValue !== '') {
                switch (searchType) {
                    case 'like':
                        // 模糊搜索
                        conditions.push(`${safeFieldName} ILIKE :${fieldName}`);
                        replacements[fieldName] = `%${searchValue}%`;
                        break;
                    case 'exact':
                        // 精确匹配
                        conditions.push(`${safeFieldName} = :${fieldName}`);
                        replacements[fieldName] = searchValue;
                        break;
                    case 'range':
                        // range 类型已在上面处理
                        break;
                    default:
                        // 默认使用 LIKE
                        conditions.push(`${safeFieldName} ILIKE :${fieldName}`);
                        replacements[fieldName] = `%${searchValue}%`;
                }
                processedFields.add(fieldName);
            }
        });
        const whereClause: any = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        return { whereClause, replacements };
    }
    /**
     * 构建 WHERE 条件（带软删除过滤）
     * 如果表有 deleted_at 字段，自动添加 deleted_at IS NULL 过滤
     *
     * @param {Object} moduleConfig - 模块配置
     * @param {string} tableName - 表名
     * @param {Object} searchParams - 搜索参数
     * @returns {Object} { whereClause, replacements }
     */
    async _buildWhereClauseWithSoftDelete(moduleConfig: any, tableName: any, searchParams: any): Promise<any> {
        const result: any = this._buildWhereClause(moduleConfig, searchParams);
        // 如果表有 deleted_at 字段，自动追加软删除过滤
        if (await this._hasColumn(tableName, 'deleted_at')) {
            if (result.whereClause) {
                result.whereClause += ' AND "deleted_at" IS NULL';
            }
            else {
                result.whereClause = 'WHERE "deleted_at" IS NULL';
            }
        }
        return result;
    }
    /**
     * 验证必填字段
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} data - 数据
     */
    _validateRequiredFields(moduleConfig: any, data: any): any {
        const auditFields: any = GenericService.AUDIT_FIELDS;
        const requiredFields: any = moduleConfig.fields.filter((f: any) => f.is_required && f.show_in_form && !auditFields.includes(f.field_name));
        requiredFields.forEach((field: any) => {
            const fieldName: any = field.field_name;
            const value: any = data[fieldName];
            if (value === undefined || value === null || value === '') {
                throw ApiError.badRequest(`${field.field_comment}不能为空`);
            }
        });
    }
    /**
     * 校验字段值规则
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} data - 数据
     * @param {Boolean} isUpdate - 是否是更新操作（更新时只校验提供的字段）
     */
    _validateFieldValues(moduleConfig: any, data: any, isUpdate: any = false): any {
        const auditFields: any = GenericService.AUDIT_FIELDS;
        const fields: any = moduleConfig.fields.filter((f: any) => f.show_in_form && !auditFields.includes(f.field_name));
        fields.forEach((field: any) => {
            const fieldName: any = field.field_name;
            const value: any = data[fieldName];
            const rules: any = field.form_rules;
            // 更新时，如果字段未提供则跳过
            if (isUpdate && value === undefined) {
                return;
            }
            // 如果没有规则，跳过
            if (!rules || Object.keys(rules).length === 0) {
                return;
            }
            // 空值处理：如果字段有值才校验
            if (value === null || value === '' || value === undefined) {
                return; // 必填校验由 _validateRequiredFields 处理
            }
            const fieldLabel: any = field.field_comment || fieldName;
            // 精确长度校验（兼容 exactLength 和 length 两种属性名）
            const exactLen: any = rules.exactLength || rules.length;
            if (exactLen && String(value).length !== exactLen) {
                throw ApiError.badRequest(`${fieldLabel}长度必须为${exactLen}位`);
            }
            if (rules.minLength && String(value).length < rules.minLength) {
                throw ApiError.badRequest(`${fieldLabel}长度不能少于${rules.minLength}位`);
            }
            if (rules.maxLength && String(value).length > rules.maxLength) {
                throw ApiError.badRequest(`${fieldLabel}长度不能超过${rules.maxLength}位`);
            }
            // 正则格式校验
            if (rules.pattern) {
                const regex: any = new RegExp(rules.pattern);
                if (!regex.test(value)) {
                    const message: any = rules.message || `${fieldLabel}格式不正确`;
                    throw ApiError.badRequest(message);
                }
            }
            // 数值范围校验
            if (typeof value === 'number') {
                if (rules.min !== undefined && value < rules.min) {
                    throw ApiError.badRequest(`${fieldLabel}不能小于${rules.min}`);
                }
                if (rules.max !== undefined && value > rules.max) {
                    throw ApiError.badRequest(`${fieldLabel}不能大于${rules.max}`);
                }
            }
            // 枚举校验
            if (rules.enum && Array.isArray(rules.enum)) {
                if (!rules.enum.includes(value)) {
                    throw ApiError.badRequest(`${fieldLabel}值不在允许范围内`);
                }
            }
        });
    }
    /**
     * 解析多种日期格式
     * 注意：所有带时间的日期输入均视为 UTC+8（中国标准时间），
     *       与服务器本地时区无关，确保在任何部署环境下行为一致。
     * @param {string|Date} value - 日期值
     * @returns {string|null} ISO 8601 格式的日期字符串
     */
    _parseDate(value: any): any {
        if (!value)
            return null;
        if (value instanceof Date)
            return value.toISOString();
        const str: any = String(value).trim();
        if (!str)
            return null;
        let hasTime: any = false;
        let normalized: any = null; // 标准化后的日期字符串（带 +08:00 时区）
        // 格式1: 中划线格式 2024-06-29 或 2024-06-29 10:30:00
        const dashMatch: any = str.match(/^(\d{4}-\d{2}-\d{2})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
        if (dashMatch) {
            const datePart: any = dashMatch[1];
            const timePart: any = dashMatch[2];
            hasTime = !!timePart;
            if (hasTime) {
                // 显式指定 +08:00，避免依赖服务器本地时区
                normalized = `${datePart}T${timePart}+08:00`;
            }
            else {
                // 仅日期：直接解析为 UTC（避免 getDate 受服务器时区影响）
                normalized = `${datePart}T00:00:00Z`;
            }
        }
        // 格式2: 斜杠格式 2024/06/29 或 2024/06/29 10:30:00
        else if (/^\d{4}\/\d{2}\/\d{2}/.test(str)) {
            const slashMatch: any = str.match(/^(\d{4})\/(\d{2})\/(\d{2})(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/);
            if (slashMatch) {
                const datePart: any = `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
                const timePart: any = slashMatch[4];
                hasTime = !!timePart;
                if (hasTime) {
                    normalized = `${datePart}T${timePart}+08:00`;
                }
                else {
                    normalized = `${datePart}T00:00:00Z`;
                }
            }
        }
        // 格式3: 纯数字格式 20240629 (YYYYMMDD)
        else if (/^\d{8}$/.test(str)) {
            const datePart: any = `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
            hasTime = false;
            normalized = `${datePart}T00:00:00Z`;
        }
        if (!normalized)
            return null;
        const date: any = new Date(normalized);
        if (isNaN(date.getTime()))
            return null;
        // 如果只有日期没有时间，返回 YYYY-MM-DD 格式
        if (!hasTime) {
            // 使用 UTC 方法提取日期，避免服务器时区影响
            const year: any = date.getUTCFullYear();
            const month: any = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day: any = String(date.getUTCDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        // 返回完整 ISO 时间戳（UTC）
        return date.toISOString();
    }
    /**
     * 过滤有效字段（移除系统字段和不存在的字段）
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} data - 原始数据
     * @returns {Object} 过滤后的数据
     */
    _filterValidFields(moduleConfig: any, data: any): any {
        const validFieldNames: any = moduleConfig.fields
            .filter((f: any) => f.show_in_form)
            .map((f: any) => f.field_name);
        const filtered: any = {};
        validFieldNames.forEach((fieldName: any) => {
            if (data[fieldName] !== undefined) {
                filtered[fieldName] = data[fieldName];
            }
        });
        return filtered;
    }
    /**
     * 执行自定义SQL查询（列表，带分页）
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} query - 查询参数
     * @returns {Object} { data, pagination }
     */
    async _executeCustomSqlList(moduleConfig: any, query: any): Promise<any> {
        const { page = 1, limit = 10, sort = 'created_at', order = 'DESC', ...searchParams }: any = query;
        const offset: any = (page - 1) * limit;
        // 获取基础SQL
        let baseSql: any = moduleConfig.custom_sql.trim().replace(/;$/, '');
        // 构建动态WHERE条件
        const { whereConditions, replacements }: any = this._buildDynamicWhereClause(moduleConfig, searchParams);
        // 判断原SQL是否已有WHERE子句
        const hasWhere: any = baseSql.toUpperCase().includes('WHERE');
        // 添加动态WHERE条件
        if (whereConditions.length > 0) {
            const connector: any = hasWhere ? 'AND' : 'WHERE';
            baseSql = `${baseSql} ${connector} ${whereConditions.join(' AND ')}`;
        }
        // 添加分页参数
        replacements.limit = parseInt(limit);
        replacements.offset = offset;
        const safeSort: any = this._validateSortField(moduleConfig, sort);
        const safeOrder: any = this._validateOrder(order);
        // 执行数据查询（包含ORDER BY和LIMIT）
        const dataQuery: any = `
      ${baseSql}
      ORDER BY ${safeSort} ${safeOrder}
      LIMIT :limit OFFSET :offset
    `;
        const rows: any = await this.sql.rows(dataQuery, replacements, undefined);
        // 执行计数查询（不包含ORDER BY和LIMIT）
        const countQuery: any = `SELECT COUNT(*) as count FROM (${baseSql}) AS subquery`;
        const [{ count }]: any = await this.sql.rows(countQuery, replacements, undefined);
        logger.info(`Custom SQL list query executed for module: ${moduleConfig.module_name}, results: ${rows.length}`);
        return {
            data: rows,
            pagination: {
                total: parseInt(count),
                page: parseInt(page),
                pageSize: parseInt(limit),
                totalPages: Math.ceil(count / limit),
            },
        };
    }
    /**
     * 执行自定义SQL查询（详情，单条记录）
     * @param {Object} moduleConfig - 模块配置
     * @param {Number|String} id - 记录ID
     * @returns {Object} 记录详情
     */
    async _executeCustomSqlDetail(moduleConfig: any, id: any): Promise<any> {
        // 获取基础SQL
        let baseSql: any = moduleConfig.custom_sql.trim().replace(/;$/, '');
        // 获取主键字段名（默认为 'id'）
        const primaryKey: any = moduleConfig.sql_primary_key || 'id';
        // 判断原SQL是否已有WHERE子句
        const hasWhere: any = baseSql.toUpperCase().includes('WHERE');
        // 添加主键条件
        const connector: any = hasWhere ? 'AND' : 'WHERE';
        const detailQuery: any = `${baseSql} ${connector} ${primaryKey} = :id LIMIT 1`;
        const [item]: any = await this.sql.rows(detailQuery, { id }, undefined);
        if (!item) {
            throw ApiError.notFound(`${moduleConfig.description}不存在`);
        }
        logger.info(`Custom SQL detail query executed for module: ${moduleConfig.module_name}, id: ${id}`);
        return item;
    }
    /**
     * 构建动态WHERE条件（用于自定义SQL）
     * @param {Object} moduleConfig - 模块配置
     * @param {Object} searchParams - 搜索参数
     * @returns {Object} { whereConditions, replacements }
     */
    _buildDynamicWhereClause(moduleConfig: any, searchParams: any): any {
        const whereConditions: any = [];
        const replacements: any = {};
        // 获取可搜索字段
        const searchableFields: any = moduleConfig.fields.filter((f: any) => f.is_searchable);
        searchableFields.forEach((field: any) => {
            const fieldName: any = field.field_name;
            const searchValue: any = searchParams[fieldName];
            if (searchValue !== undefined && searchValue !== null && searchValue !== '') {
                const searchType: any = field.search_type || 'like';
                switch (searchType) {
                    case 'like':
                        whereConditions.push(`${fieldName} ILIKE :${fieldName}`);
                        replacements[fieldName] = `%${searchValue}%`;
                        break;
                    case 'exact':
                        whereConditions.push(`${fieldName} = :${fieldName}`);
                        replacements[fieldName] = searchValue;
                        break;
                    case 'range':
                        const startValue: any = searchParams[`${fieldName}_start`];
                        const endValue: any = searchParams[`${fieldName}_end`];
                        if (startValue !== undefined && startValue !== null && startValue !== '') {
                            whereConditions.push(`${fieldName} >= :${fieldName}_start`);
                            replacements[`${fieldName}_start`] = startValue;
                        }
                        if (endValue !== undefined && endValue !== null && endValue !== '') {
                            whereConditions.push(`${fieldName} <= :${fieldName}_end`);
                            replacements[`${fieldName}_end`] = endValue;
                        }
                        break;
                    default:
                        whereConditions.push(`${fieldName} ILIKE :${fieldName}`);
                        replacements[fieldName] = `%${searchValue}%`;
                }
            }
        });
        return { whereConditions, replacements };
    }
    /**
     * 转义标识符（表名、字段名）防止 SQL 注入
     * PostgreSQL 使用双引号转义标识符
     * @param {String} identifier - 标识符
     * @returns {String} 转义后的标识符
     */
    _escapeIdentifier(identifier: any): any {
        if (!identifier) {
            throw new Error('Identifier cannot be empty');
        }
        // 只允许字母、数字、下划线
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier)) {
            throw ApiError.badRequest(`Invalid identifier: ${identifier}`);
        }
        // PostgreSQL 使用双引号转义标识符
        return `"${identifier}"`;
    }
    /**
     * 验证排序字段是否在允许的字段列表中
     * @param {Object} moduleConfig - 模块配置
     * @param {String} sortField - 排序字段
     * @returns {String} 验证后的排序字段
     */
    _validateSortField(moduleConfig: any, sortField: any): any {
        const validFields: any = moduleConfig.fields.map((f: any) => f.field_name);
        validFields.push('created_at', 'updated_at', 'id'); // 添加系统字段
        if (!validFields.includes(sortField)) {
            logger.warn(`Invalid sort field: ${sortField}, using default: created_at`);
            return 'created_at';
        }
        return sortField;
    }
    /**
     * 验证排序顺序
     * @param {String} order - 排序顺序
     * @returns {String} 验证后的排序顺序（ASC 或 DESC）
     */
    _validateOrder(order: any): any {
        const upperOrder: any = order?.toUpperCase();
        if (upperOrder !== 'ASC' && upperOrder !== 'DESC') {
            return 'DESC';
        }
        return upperOrder;
    }
}
