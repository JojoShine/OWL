const { logger } = require('../config/logger');

/**
 * 配置构建器服务
 * 根据模块配置和字段配置构建前端页面配置（用于动态渲染）
 */
class ConfigBuilderService {
  /**
   * 构建完整的页面配置
   * @param {Object} moduleConfig - 模块配置
   * @param {Array} fields - 字段配置列表
   * @returns {Object} 页面配置
   */
  buildPageConfig(moduleConfig, fields) {
    logger.info(`Building page config for module: ${moduleConfig.module_name}`);

    const config = {
      moduleName: moduleConfig.module_name,
      modulePath: moduleConfig.module_path,
      description: moduleConfig.description || moduleConfig.module_name,
      tableName: moduleConfig.table_name,

      // API 端点配置
      api: this._buildApiConfig(moduleConfig),

      // 权限配置
      permissions: this._buildPermissions(moduleConfig),

      // 字段配置
      fields: this._buildFieldsConfig(fields),

      // 功能开关
      features: this._buildFeatures(moduleConfig),

      // 菜单配置
      menu: this._buildMenuConfig(moduleConfig),

      // 动态SQL配置（新增）
      dynamicSql: this._buildDynamicSqlConfig(moduleConfig),

      // 详情页配置（新增）
      detailConfig: this._buildDetailConfig(moduleConfig, fields),
    };

    logger.info(`Page config built successfully for module: ${moduleConfig.module_name}`);
    return config;
  }

  /**
   * 构建 API 端点配置
   * @param {Object} moduleConfig
   * @returns {Object}
   */
  _buildApiConfig(moduleConfig) {
    // 不包含 /api/ 前缀，因为 axios baseURL 已经包含了
    const basePath = `/modules/${moduleConfig.module_path}`;
    return {
      list: basePath,
      create: basePath,
      getById: `${basePath}/:id`,
      update: `${basePath}/:id`,
      delete: `${basePath}/:id`,
      batchDelete: `${basePath}/batch`,
      export: `${basePath}/export`,
      downloadTemplate: `${basePath}/download-template`,
      import: `${basePath}/import`,
    };
  }

  /**
   * 构建权限配置
   * @param {Object} moduleConfig
   * @returns {Object}
   */
  _buildPermissions(moduleConfig) {
    const resource = moduleConfig.permission_prefix || moduleConfig.module_path;
    return {
      read: `${resource}:read`,
      create: `${resource}:create`,
      update: `${resource}:update`,
      delete: `${resource}:delete`,
    };
  }

  /**
   * 构建字段配置
   * @param {Array} fields
   * @returns {Array}
   */
  _buildFieldsConfig(fields) {
    return fields
      .sort((a, b) => (a.list_sort || 0) - (b.list_sort || 0))
      .map(field => {
        // 解析 format_options JSON 字段
        const formatOptions = field.format_options || {};
        const displayName = formatOptions.displayName || {};

        // 为布尔值字段添加默认的 codeMapping
        if (field.field_type === 'boolean' && !formatOptions.codeMapping) {
          formatOptions.codeMapping = {
            type: 'enum',
            mappings: {
              'true': { label: '是', value: 'true' },
              'false': { label: '否', value: 'false' },
            },
          };
        }

        return {
          name: field.field_name,

          // ✨ 支持不同场景的自定义名称
          label: displayName.list || field.field_comment || field.field_name,
          searchLabel: displayName.search || displayName.list || field.field_comment || field.field_name,
          formLabel: displayName.form || displayName.list || field.field_comment || field.field_name,

          type: this._mapFieldType(field.field_type),

          // 搜索配置
          isSearchable: field.is_searchable || false,
          searchType: field.search_type || 'exact', // exact, like, range, in
          searchComponent: field.search_component || 'input',

          // 列表显示配置
          showInList: field.show_in_list !== false,
          listWidth: field.list_width || undefined,
          listAlign: field.list_align || 'left',
          listSort: field.list_sort || 0,

          // 格式化配置
          formatType: this._getDefaultFormatType(field.field_type, field.format_type), // date, money, enum, mask, link
          formatOptions: formatOptions,

          // ✨ 代码值映射配置(提取到顶层便于前端使用)
          codeMapping: formatOptions.codeMapping || null,

          // 表单配置
          showInForm: field.show_in_form !== false,
          formComponent: field.form_component || this._getDefaultFormComponent(field.field_type),
          formRules: field.form_rules || {},
          readonly: field.is_readonly || false,

          // 原始字段信息
          dbType: field.field_type,
          comment: field.field_comment,
        };
      });
  }

  /**
   * 映射数据库字段类型到前端类型
   * @param {String} dbType
   * @returns {String}
   */
  _mapFieldType(dbType) {
    const typeMap = {
      'character varying': 'string',
      'varchar': 'string',
      'text': 'string',
      'integer': 'number',
      'bigint': 'number',
      'numeric': 'number',
      'decimal': 'number',
      'boolean': 'boolean',
      'date': 'date',
      'timestamp': 'datetime',
      'timestamp without time zone': 'datetime',
      'timestamp with time zone': 'datetime',
      'uuid': 'string',
      'json': 'json',
      'jsonb': 'json',
    };

    const normalizedType = dbType.toLowerCase();
    return typeMap[normalizedType] || 'string';
  }

  /**
   * 根据字段类型获取默认表单组件
   * @param {String} fieldType
   * @returns {String}
   */
  _getDefaultFormComponent(fieldType) {
    const componentMap = {
      'boolean': 'select',
      'date': 'date',
      'timestamp': 'datetime',
      'timestamp without time zone': 'datetime',
      'timestamp with time zone': 'datetime',
      'text': 'textarea',
      'json': 'textarea',
      'jsonb': 'textarea',
    };

    const normalizedType = fieldType.toLowerCase();
    return componentMap[normalizedType] || 'input';
  }

  /**
   * 根据字段类型获取默认的格式化类型
   * 为时间字段自动设置为 'date' 格式，前端将使用本地时间显示
   * @param {String} fieldType - 数据库字段类型
   * @param {String} customFormatType - 用户自定义的格式化类型
   * @returns {String|undefined} 格式化类型
   */
  _getDefaultFormatType(fieldType, customFormatType) {
    // 如果用户已经明确指定了格式化类型，优先使用
    if (customFormatType) {
      return customFormatType;
    }

    // 对于日期/时间字段，自动设置为 'date' 格式
    const normalizedType = fieldType.toLowerCase();
    if (
      normalizedType === 'date' ||
      normalizedType === 'timestamp' ||
      normalizedType === 'timestamp without time zone' ||
      normalizedType === 'timestamp with time zone'
    ) {
      return 'date';
    }

    return undefined;
  }

  /**
   * 构建功能开关配置
   * @param {Object} moduleConfig
   * @returns {Object}
   */
  _buildFeatures(moduleConfig) {
    return {
      create: moduleConfig.enable_create !== false,
      update: moduleConfig.enable_update !== false,
      delete: moduleConfig.enable_delete !== false,
      batchDelete: moduleConfig.enable_batch_delete !== false,
      export: moduleConfig.enable_export === true,
      import: moduleConfig.enable_import === true,
    };
  }

  /**
   * 构建菜单配置
   * @param {Object} moduleConfig
   * @returns {Object}
   */
  _buildMenuConfig(moduleConfig) {
    return {
      name: moduleConfig.menu_name || moduleConfig.description || moduleConfig.module_name,
      icon: moduleConfig.menu_icon || 'FileText',
      sort: moduleConfig.menu_sort || 100,
      parentId: moduleConfig.menu_parent_id || null,
    };
  }

  /**
   * 构建动态SQL配置
   * @param {Object} moduleConfig
   * @returns {Object|null}
   */
  _buildDynamicSqlConfig(moduleConfig) {
    // 如果没有自定义SQL，返回null
    if (!moduleConfig.custom_sql) {
      return null;
    }

    return {
      enabled: true,
      query: moduleConfig.custom_sql,
      parameters: moduleConfig.sql_parameters || [],
      primaryKey: moduleConfig.sql_primary_key || 'id',
    };
  }

  /**
   * 构建详情页配置
   * @param {Object} moduleConfig
   * @param {Array} fields
   * @returns {Object}
   */
  _buildDetailConfig(moduleConfig, fields) {
    const detailConfig = {
      displayMode: moduleConfig.detail_display_mode || 'dialog',
      urlPattern: moduleConfig.detail_url_pattern || `/${moduleConfig.module_path}/:id`,
      fieldGroups: this._buildFieldGroups(fields),
    };

    return detailConfig;
  }

  /**
   * 构建字段分组配置
   * @param {Array} fields
   * @returns {Array}
   */
  _buildFieldGroups(fields) {
    // 按field_group分组
    const groupMap = new Map();

    fields.forEach(field => {
      // 只处理在详情页显示的字段
      if (field.show_in_detail === false) {
        return;
      }

      const groupKey = field.field_group || 'default';

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, {
          groupKey,
          groupLabel: this._getGroupLabel(groupKey),
          fields: [],
          layout: 'grid', // 默认栅格布局
          columns: 2,     // 默认2列
        });
      }

      // 添加字段到分组
      groupMap.get(groupKey).fields.push({
        fieldName: field.field_name,
        label: field.detail_label || field.field_comment || field.field_name,
        sort: field.detail_sort || 0,
        component: field.detail_component,
      });
    });

    // 转换为数组并对每个分组的字段排序
    const groups = Array.from(groupMap.values()).map(group => {
      group.fields.sort((a, b) => a.sort - b.sort);
      return group;
    });

    // 如果只有default分组，给它一个更友好的名称
    if (groups.length === 1 && groups[0].groupKey === 'default') {
      groups[0].groupLabel = '基本信息';
    }

    return groups;
  }

  /**
   * 获取分组标签（中文名称）
   * @param {String} groupKey
   * @returns {String}
   */
  _getGroupLabel(groupKey) {
    const labelMap = {
      default: '基本信息',
      basic: '基本信息',
      detail: '详细信息',
      contact: '联系信息',
      address: '地址信息',
      family: '家庭信息',
      education: '教育信息',
      work: '工作信息',
      finance: '财务信息',
      system: '系统信息',
      other: '其他信息',
    };

    return labelMap[groupKey] || groupKey;
  }

  /**
   * 验证页面配置
   * @param {Object} config
   * @returns {Boolean}
   */
  validatePageConfig(config) {
    const required = ['moduleName', 'modulePath', 'api', 'permissions', 'fields'];

    for (const field of required) {
      if (!config[field]) {
        logger.error(`Missing required field in page config: ${field}`);
        return false;
      }
    }

    if (!Array.isArray(config.fields) || config.fields.length === 0) {
      logger.error('Page config must have at least one field');
      return false;
    }

    return true;
  }
}

module.exports = new ConfigBuilderService();
