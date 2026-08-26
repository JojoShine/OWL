const { Op } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const dbReaderService = require('./db-reader.service');
const {
  getJoiType,
  getZodType,
  getFormComponent,
  getSearchComponent,
  getDefaultSearchType,
  getFormatType,
  isSystemField,
  isReadonlyField,
} = require('./template-helpers');
const { validateSortField, validateOrder } = require('../../../utils/query-validator');

class ModuleConfigService {
  /**
   * 获取模块配置列表（分页）
   */
  async getModuleConfigs(query) {
    const {
      page = 1,
      limit = 10,
      table_name,
      module_name,
      sort = 'created_at',
      order = 'DESC',
    } = query;

    const offset = (page - 1) * limit;
    const where = {};

    if (table_name) {
      where.table_name = { [Op.iLike]: `%${table_name}%` };
    }

    if (module_name) {
      where.module_name = { [Op.iLike]: `%${module_name}%` };
    }

    const safeSort = validateSortField(sort, ['module_name', 'table_name']);
    const safeOrder = validateOrder(order);

    const { count, rows } = await db.GeneratedModule.findAndCountAll({
      where,
      include: [
        {
          model: db.GeneratedField,
          as: 'fields',
          order: [['field_order', 'ASC']],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [[safeSort, safeOrder]],
    });

    return {
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        pageSize: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * 获取单个模块配置详情
   */
  async getModuleConfigById(id, options = {}) {
    const { transaction } = options;
    const config = await db.GeneratedModule.findByPk(id, {
      transaction,
      include: [
        {
          model: db.GeneratedField,
          as: 'fields',
          order: [['field_order', 'ASC']],
        },
      ],
    });

    if (!config) {
      throw ApiError.notFound('模块配置不存在');
    }

    return config;
  }

  /**
   * 根据表名获取模块配置
   */
  async getModuleConfigByTableName(tableName, options = {}) {
    const { transaction } = options;
    const config = await db.GeneratedModule.findOne({
      transaction,
      where: { table_name: tableName },
      include: [
        {
          model: db.GeneratedField,
          as: 'fields',
          order: [['field_order', 'ASC']],
        },
      ],
    });

    return config;
  }

  /**
   * 初始化模块配置（从数据库表结构自动生成）
   */
  async initializeModuleConfig(tableName, options = {}) {
    const { transaction, userId } = options;
    // 检查表是否存在
    const tableExists = await dbReaderService.tableExists(tableName, { transaction });
    if (!tableExists) {
      throw ApiError.notFound(`表 ${tableName} 不存在`);
    }

    // 检查是否已经有配置
    const existingConfig = await this.getModuleConfigByTableName(tableName, { transaction });
    if (existingConfig) {
      throw ApiError.badRequest(`表 ${tableName} 已经存在配置`);
    }

    // 获取表结构
    const tableStructure = await dbReaderService.getTableStructure(tableName, { transaction });

    // 验证表是否有必需的时间戳字段
    this._validateTimestampColumns(tableName, tableStructure.columns);

    // 生成模块名称（表名转驼峰）
    const moduleName = this._tableNameToModuleName(tableName);
    const modulePath = tableName.replace(/_/g, '-');

    // 创建模块配置
    const moduleConfig = await db.GeneratedModule.create({
      table_name: tableName,
      module_name: moduleName,
      module_path: modulePath,
      description: tableStructure.comment || moduleName,
      permission_prefix: modulePath,
      enable_create: true,
      enable_update: true,
      enable_delete: true,
      enable_batch_delete: true,
      enable_export: false,
      enable_import: true,
      created_by: userId || null,
    }, { transaction });

    // 创建字段配置
    await this._generateFieldConfigs(tableStructure.columns, moduleConfig.id, { transaction, userId });

    // 重新加载包含字段的配置
    return await this.getModuleConfigById(moduleConfig.id, { transaction });
  }

  /**
   * 创建/更新模块配置
   */
  async saveModuleConfig(data) {
    const { id, table_name, fields, ...moduleData } = data;

    let moduleConfig;

    if (id) {
      // 更新现有配置
      moduleConfig = await db.GeneratedModule.findByPk(id);
      if (!moduleConfig) {
        throw ApiError.notFound('模块配置不存在');
      }

      await moduleConfig.update(moduleData);
    } else {
      // 创建新配置
      if (!table_name) {
        throw ApiError.badRequest('表名不能为空');
      }

      // 检查表名是否已存在配置
      const existing = await this.getModuleConfigByTableName(table_name);
      if (existing) {
        throw ApiError.badRequest(`表 ${table_name} 已经存在配置`);
      }

      moduleConfig = await db.GeneratedModule.create({
        table_name,
        ...moduleData,
      });
    }

    // 更新字段配置
    if (fields && Array.isArray(fields)) {
      await this._updateFieldConfigs(moduleConfig.id, fields);

      // 重新加载包含字段的配置
      const updatedConfig = await this.getModuleConfigById(moduleConfig.id);

      // 重新构建 page_config
      const configBuilderService = require('./config-builder.service');
      const pageConfig = configBuilderService.buildPageConfig(
        updatedConfig,
        updatedConfig.fields || []
      );

      // 保存新的 page_config
      await moduleConfig.update({ page_config: pageConfig });

      logger.info(`Page config rebuilt for module: ${moduleConfig.module_name}`);

      return updatedConfig;
    }

    // 重新加载包含字段的配置
    return await this.getModuleConfigById(moduleConfig.id);
  }

  /**
   * 删除模块配置
   */
  async deleteModuleConfig(id) {
    const config = await db.GeneratedModule.findByPk(id);

    if (!config) {
      throw ApiError.notFound('模块配置不存在');
    }

    const modulePath = config.module_path;
    const permissionPrefix = config.permission_prefix || modulePath;

    // 1. 删除关联的菜单
    try {
      const menu = await db.Menu.findOne({
        where: { path: `/${modulePath}` }
      });

      if (menu) {
        // 删除角色菜单关联
        await db.RoleMenu.destroy({
          where: { menu_id: menu.id }
        });

        // 删除菜单
        await menu.destroy();
        logger.info(`Menu deleted for module: ${modulePath}`);
      }
    } catch (error) {
      logger.error(`Failed to delete menu for module ${modulePath}:`, error);
      // 继续执行，不阻断流程
    }

    // 2. 删除关联的权限
    try {
      const permissions = await db.Permission.findAll({
        where: {
          resource: permissionPrefix
        }
      });

      for (const permission of permissions) {
        // 删除角色权限关联
        await db.RolePermission.destroy({
          where: { permission_id: permission.id }
        });

        // 删除权限
        await permission.destroy();
        logger.info(`Permission deleted: ${permission.code}`);
      }
    } catch (error) {
      logger.error(`Failed to delete permissions for module ${modulePath}:`, error);
      // 继续执行，不阻断流程
    }

    // 3. 删除模块配置（关联的字段配置会通过外键级联删除）
    await config.destroy();

    // 4. 清除RBAC缓存
    const { clearCache } = require('../../../config/rbac');
    clearCache();
    logger.info(`RBAC cache cleared after deleting module: ${modulePath}`);

    logger.info(`Module config deleted: ${id}`);

    return { message: '模块配置删除成功' };
  }

  /**
   * 生成字段配置
   */
  async _generateFieldConfigs(columns, moduleId, options = {}) {
    const { transaction, userId } = options;
    const fieldConfigs = [];

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const isSystem = isSystemField(col.name);
      const isReadonly = isReadonlyField(col.name);

      const fieldConfig = {
        module_id: moduleId,
        field_name: col.name,
        field_type: col.type,
        field_comment: col.comment || col.name,
        field_order: i + 1,
        is_nullable: col.nullable,
        default_value: col.defaultValue,
        max_length: col.length,

        // 搜索配置 - 系统字段默认不可搜索
        is_searchable: !isSystem && col.name !== 'id',
        search_type: getDefaultSearchType(col.type),
        search_component: getSearchComponent(col.type),

        // 列表显示配置 - 除了 id, created_at, updated_at 外都显示
        show_in_list: !['created_at', 'updated_at', 'deleted_at', 'created_by', 'updated_by'].includes(col.name),
        list_sort: i + 1,
        list_width: null,
        format_type: getFormatType(col.type, col.name),
        format_options: null,

        // 表单配置 - 系统字段不在表单中显示
        show_in_form: !isSystem,
        form_component: getFormComponent(col.type),
        form_order: i + 1,
        form_default: col.defaultValue,
        form_placeholder: `请输入${col.comment || col.name}`,
        is_required: !col.nullable && !isSystem,
        readonly: isReadonly,

        // 验证配置
        joi_type: getJoiType(col.type),
        zod_type: getZodType(col.type),
        validation_rules: null,
        created_by: userId || null,
      };

      const created = await db.GeneratedField.create(fieldConfig, { transaction });
      fieldConfigs.push(created);
    }

    return fieldConfigs;
  }

  /**
   * 更新字段配置
   */
  async _updateFieldConfigs(moduleId, fields) {
    // 获取模块配置以获取表名
    const moduleConfig = await db.GeneratedModule.findByPk(moduleId);
    if (!moduleConfig) {
      throw ApiError.notFound('模块配置不存在');
    }

    // 从数据库读取最新的表结构以确保类型准确
    const tableStructure = await dbReaderService.getTableStructure(moduleConfig.table_name);
    const columnMap = new Map(tableStructure.columns.map(col => [col.name, col]));

    // 删除现有字段配置
    await db.GeneratedField.destroy({
      where: { module_id: moduleId },
    });

    // 创建新的字段配置，确保类型从数据库读取
    const fieldConfigs = fields.map((field, index) => {
      const dbColumn = columnMap.get(field.field_name);

      const config = {
        module_id: moduleId,
        field_order: index + 1,
        list_sort: field.list_sort || index + 1,
        form_order: field.form_order || index + 1,
        ...field,
        // 强制使用数据库实际类型，防止用户手动修改导致不一致
        field_type: dbColumn ? dbColumn.type : field.field_type,
        is_nullable: dbColumn ? dbColumn.nullable : field.is_nullable,
        max_length: dbColumn ? dbColumn.length : field.max_length,
        default_value: dbColumn ? dbColumn.defaultValue : field.default_value,
      };

      // 删除旧的 GeneratedField id，让 Sequelize 生成新的
      delete config.id;

      return config;
    });

    return await db.GeneratedField.bulkCreate(fieldConfigs);
  }

  /**
   * 表名转模块名（驼峰命名）
   */
  _tableNameToModuleName(tableName) {
    return tableName
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * 根据模块路径获取模块配置
   * @param {String} modulePath - 模块路径（如 'products'）
   * @returns {Promise<Object>} 模块配置
   */
  async getModuleConfigByPath(modulePath) {
    logger.info(`Getting module config by path: ${modulePath}`);

    // 移除前导斜杠（如果有）
    const cleanPath = modulePath.replace(/^\//, '');

    const moduleConfig = await db.GeneratedModule.findOne({
      where: { module_path: cleanPath },
      include: [
        {
          model: db.GeneratedField,
          as: 'fields',
          order: [['list_sort', 'ASC']],
        },
      ],
    });

    if (!moduleConfig) {
      throw new ApiError(404, `Module not found: ${cleanPath}`);
    }

    return moduleConfig;
  }

  /**
   * 获取完整的页面配置（包含page_config）
   * @param {String} moduleId - 模块ID
   * @returns {Promise<Object>} 完整的页面配置
   */
  async getFullPageConfig(moduleId) {
    logger.info(`Getting full page config for module: ${moduleId}`);

    const moduleConfig = await db.GeneratedModule.findByPk(moduleId, {
      include: [
        {
          model: db.GeneratedField,
          as: 'fields',
          order: [['list_sort', 'ASC']],
        },
      ],
    });

    if (!moduleConfig) {
      throw new ApiError(404, 'Module not found');
    }

    // 如果已有page_config，直接返回
    if (moduleConfig.page_config) {
      return moduleConfig.page_config;
    }

    // 否则动态构建
    const configBuilderService = require('./config-builder.service');
    const pageConfig = configBuilderService.buildPageConfig(
      moduleConfig,
      moduleConfig.fields || []
    );

    return pageConfig;
  }

  /**
   * 更新页面配置
   * @param {String} moduleId - 模块ID
   * @param {Object} pageConfig - 页面配置
   * @returns {Promise<Object>} 更新后的模块配置
   */
  async updatePageConfig(moduleId, pageConfig) {
    logger.info(`Updating page config for module: ${moduleId}`);

    const moduleConfig = await db.GeneratedModule.findByPk(moduleId);

    if (!moduleConfig) {
      throw new ApiError(404, 'Module not found');
    }

    // 验证配置
    const configBuilderService = require('./config-builder.service');
    if (!configBuilderService.validatePageConfig(pageConfig)) {
      throw new ApiError(400, 'Invalid page config');
    }

    await moduleConfig.update({ page_config: pageConfig });

    logger.info(`Page config updated successfully for module: ${moduleId}`);
    return moduleConfig;
  }

  /**
   * 验证表是否有必需的时间戳字段
   * @param {string} tableName - 表名
   * @param {Array} columns - 表字段列表
   */
  _validateTimestampColumns(tableName, columns) {
    const columnNames = columns.map(col => col.name);
    const missingFields = [];

    if (!columnNames.includes('created_at')) {
      missingFields.push('created_at');
    }

    if (!columnNames.includes('updated_at')) {
      missingFields.push('updated_at');
    }

    if (missingFields.length > 0) {
      const errorMessage = `表 "${tableName}" 缺少必需的时间戳字段: ${missingFields.join(', ')}。请先在表中添加这些字段。`;
      logger.error(errorMessage);
      throw ApiError.badRequest(errorMessage);
    }

    logger.info(`✓ Table ${tableName} has required timestamp columns`);
  }
}

module.exports = new ModuleConfigService();
