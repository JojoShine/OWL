const Joi = require('joi');

const generatorValidation = {
  // 获取表列表
  getTables: {
    query: Joi.object({
      search: Joi.string().optional().allow(''),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  },

  // 获取表结构
  getTableStructure: {
    params: Joi.object({
      tableName: Joi.string().required(),
    }),
  },

  createBusinessTable: {
    body: Joi.object({
      table_name: Joi.string().pattern(/^[a-z][a-z0-9_]{0,58}$/).required().messages({
        'string.pattern.base': '业务表名只能使用小写字母、数字和下划线，并以字母开头',
        'any.required': '业务表名不能为空',
      }),
      table_comment: Joi.string().max(255).allow('', null).optional(),
      fields: Joi.array().items(Joi.object({
        name: Joi.string().pattern(/^[a-z][a-z0-9_]{0,62}$/).required(),
        type: Joi.string().valid(
          'string', 'text', 'integer', 'bigint', 'decimal',
          'boolean', 'date', 'datetime', 'json'
        ).required(),
        comment: Joi.string().max(255).allow('', null).optional(),
        nullable: Joi.boolean().default(true),
        unique: Joi.boolean().default(false),
        indexed: Joi.boolean().default(false),
        length: Joi.number().integer().min(1).max(2000).optional(),
        precision: Joi.number().integer().min(1).max(38).optional(),
        scale: Joi.number().integer().min(0).max(38).optional(),
        default_value: Joi.alternatives().try(
          Joi.string().allow(''),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array(),
          Joi.valid(null)
        ).optional(),
        default_current_time: Joi.boolean().default(false),
      })).min(1).max(100).required(),
    }),
  },

  // 获取模块配置列表
  getModuleConfigs: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      table_name: Joi.string().optional(),
      module_name: Joi.string().optional(),
      sort: Joi.string().optional(),
      order: Joi.string().valid('ASC', 'DESC').optional(),
    }),
  },

  // 获取模块配置详情
  getModuleConfigById: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },

  // 初始化模块配置
  initializeModuleConfig: {
    body: Joi.object({
      tableName: Joi.string().required().messages({
        'any.required': '表名不能为空',
        'string.empty': '表名不能为空',
      }),
    }),
  },

  // 保存模块配置
  saveModuleConfig: {
    body: Joi.object({
      id: Joi.string().uuid().optional(),
      table_name: Joi.string().optional(),
      module_name: Joi.string().required().messages({
        'any.required': '模块名称不能为空',
      }),
      module_path: Joi.string().required().messages({
        'any.required': '模块路径不能为空',
      }),
      description: Joi.string().optional().allow(null, ''),
      permission_prefix: Joi.string().optional().allow(null, ''),
      enable_create: Joi.boolean().default(true),
      enable_update: Joi.boolean().default(true),
      enable_delete: Joi.boolean().default(true),
      enable_batch_delete: Joi.boolean().default(true),
      enable_export: Joi.boolean().default(false),
      enable_import: Joi.boolean().default(true),
      fields: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().uuid().optional(),
            field_name: Joi.string().required(),
            field_type: Joi.string().required(),
            field_comment: Joi.string().optional().allow(null, ''),
            field_order: Joi.number().integer().optional(),
            is_nullable: Joi.boolean().default(true),
            default_value: Joi.string().optional().allow(null, ''),
            max_length: Joi.number().integer().optional().allow(null),

            // 搜索配置
            is_searchable: Joi.boolean().default(false),
            search_type: Joi.string().valid('like', 'exact', 'range').optional().allow(null),
            search_component: Joi.string().optional().allow(null),

            // 列表配置
            show_in_list: Joi.boolean().default(true),
            list_sort: Joi.number().integer().optional(),
            list_width: Joi.number().integer().optional().allow(null),
            format_type: Joi.string().optional().allow(null),
            format_options: Joi.object().optional().allow(null),

            // 表单配置
            show_in_form: Joi.boolean().default(true),
            form_component: Joi.string().optional().allow(null),
            form_order: Joi.number().integer().optional(),
            form_default: Joi.string().optional().allow(null),
            form_placeholder: Joi.string().optional().allow(null),
            is_required: Joi.boolean().default(false),
            readonly: Joi.boolean().default(false),

            // 验证配置
            joi_type: Joi.string().optional().allow(null),
            zod_type: Joi.string().optional().allow(null),
            validation_rules: Joi.object().optional().allow(null),
          })
        )
        .optional(),
    }),
  },

  // 更新模块配置
  updateModuleConfig: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      module_name: Joi.string().optional(),
      module_path: Joi.string().optional(),
      description: Joi.string().optional().allow(null, ''),
      permission_prefix: Joi.string().optional().allow(null, ''),
      enable_create: Joi.boolean().optional(),
      enable_update: Joi.boolean().optional(),
      enable_delete: Joi.boolean().optional(),
      enable_batch_delete: Joi.boolean().optional(),
      enable_export: Joi.boolean().optional(),
      enable_import: Joi.boolean().optional(),
      fields: Joi.array()
        .items(
          Joi.object({
            id: Joi.string().uuid().optional(),
            field_name: Joi.string().required(),
            field_type: Joi.string().required(),
            field_comment: Joi.string().optional().allow(null, ''),
            field_order: Joi.number().integer().optional(),
            is_nullable: Joi.boolean().optional(),
            default_value: Joi.string().optional().allow(null, ''),
            max_length: Joi.number().integer().optional().allow(null),
            is_searchable: Joi.boolean().optional(),
            search_type: Joi.string().valid('like', 'exact', 'range').optional().allow(null),
            search_component: Joi.string().optional().allow(null),
            show_in_list: Joi.boolean().optional(),
            list_sort: Joi.number().integer().optional(),
            list_width: Joi.number().integer().optional().allow(null),
            format_type: Joi.string().optional().allow(null),
            format_options: Joi.object().optional().allow(null),
            show_in_form: Joi.boolean().optional(),
            form_component: Joi.string().optional().allow(null),
            form_order: Joi.number().integer().optional(),
            form_default: Joi.string().optional().allow(null),
            form_placeholder: Joi.string().optional().allow(null),
            is_required: Joi.boolean().optional(),
            readonly: Joi.boolean().optional(),
            joi_type: Joi.string().optional().allow(null),
            zod_type: Joi.string().optional().allow(null),
            validation_rules: Joi.object().optional().allow(null),
          })
        )
        .optional(),
    }),
  },

  // 删除模块配置
  deleteModuleConfig: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },

  // 生成代码
  generateCode: {
    params: Joi.object({
      moduleId: Joi.string().uuid().required(),
    }),
    body: Joi.object({
      generateBackend: Joi.boolean().default(true),
      generateFrontend: Joi.boolean().default(true),
    }),
  },

  // 删除生成的代码
  deleteGeneratedCode: {
    params: Joi.object({
      moduleId: Joi.string().uuid().required(),
    }),
  },

  // 获取生成历史列表
  getHistoryList: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      module_id: Joi.string().uuid().optional(),
      operation_type: Joi.string().valid('create', 'update', 'delete').optional(),
      success: Joi.boolean().optional(),
      sort: Joi.string().optional(),
      order: Joi.string().valid('ASC', 'DESC').optional(),
    }),
  },

  // 获取生成历史详情
  getHistoryById: {
    params: Joi.object({
      id: Joi.string().uuid().required(),
    }),
  },

  // 获取模块的生成历史
  getModuleHistory: {
    params: Joi.object({
      moduleId: Joi.string().uuid().required(),
    }),
    query: Joi.object({
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  },

  // 获取统计信息
  getStatistics: {
    query: Joi.object({
      start_date: Joi.date().optional(),
      end_date: Joi.date().optional(),
    }),
  },

  // 清理历史记录
  cleanupHistory: {
    body: Joi.object({
      daysToKeep: Joi.number().integer().min(1).default(30),
    }),
  },

  // 验证SQL语法
  validateSql: {
    body: Joi.object({
      sql: Joi.string().required().messages({
        'any.required': 'SQL语句不能为空',
        'string.empty': 'SQL语句不能为空',
      }),
    }),
  },

  // 预览SQL查询结果
  previewSql: {
    body: Joi.object({
      sql: Joi.string().required().messages({
        'any.required': 'SQL语句不能为空',
        'string.empty': 'SQL语句不能为空',
      }),
      limit: Joi.number().integer().min(1).max(100).default(10),
    }),
  },

  // 从SQL生成字段配置
  generateFieldsFromSql: {
    body: Joi.object({
      sql: Joi.string().required().messages({
        'any.required': 'SQL语句不能为空',
        'string.empty': 'SQL语句不能为空',
      }),
    }),
  },

  // 检查表审计字段缺失
  checkAuditFields: {
    params: Joi.object({
      tableName: Joi.string().required(),
    }),
  },

  // 一键补全表审计字段
  addAuditFields: {
    params: Joi.object({
      tableName: Joi.string().required(),
    }),
  },
};

module.exports = generatorValidation;
