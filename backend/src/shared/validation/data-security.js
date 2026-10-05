const Joi = require('joi');

/**
 * 敏感字段配置验证规则
 */
const sensitiveFieldSchema = Joi.object({
  table_name: Joi.string()
    .max(100)
    .required()
    .pattern(/^[a-z_]+$/)
    .messages({
      'string.pattern.base': '表名只能包含小写字母和下划线'
    }),
  
  field_name: Joi.string()
    .max(100)
    .required()
    .pattern(/^[a-z_]+$/)
    .messages({
      'string.pattern.base': '字段名只能包含小写字母和下划线'
    }),
  
  mask_type: Joi.string()
    .valid('phone', 'email', 'id_card', 'bank_card', 'name', 'address', 'custom')
    .default('custom'),
  
  mask_rule: Joi.object().optional().allow(null),
  
  description: Joi.string().max(255).optional().allow(''),
  
  is_active: Joi.boolean().default(true),
});

/**
 * 批量导入验证规则
 */
const batchImportSchema = Joi.object({
  fields: Joi.array()
    .items(sensitiveFieldSchema)
    .min(1)
    .max(100)
    .required(),
});

/**
 * 密码验证规则
 */
const passwordValidationSchema = Joi.object({
  password: Joi.string().required().min(6).messages({
    'any.required': '密码不能为空',
    'string.min': '密码至少6位'
  }),
});

/**
 * 权限检查验证规则
 */
const permissionCheckSchema = Joi.object({
  table_name: Joi.string().required().messages({
    'any.required': '表名为必填项'
  }),
  field_name: Joi.string().required().messages({
    'any.required': '字段名为必填项'
  }),
  record_id: Joi.string().uuid().required().messages({
    'string.guid': '记录ID格式不正确',
    'any.required': '记录ID为必填项'
  }),
});

/**
 * 明文访问申请验证规则
 */
const plainAccessRequestSchema = Joi.object({
  table_name: Joi.string().max(100).required().messages({
    'any.required': '表名为必填项'
  }),
  field_name: Joi.string().max(100).required().messages({
    'any.required': '字段名为必填项'
  }),
  record_id: Joi.string().uuid().required().messages({
    'string.guid': '记录ID格式不正确',
    'any.required': '记录ID为必填项'
  }),
  reason: Joi.string().max(500).required().messages({
    'any.required': '申请理由为必填项',
    'string.max': '申请理由最多500个字符'
  }),
  password: Joi.string().required().min(6).messages({
    'any.required': '密码为必填项',
    'string.min': '密码至少6位'
  }),
});

module.exports = {
  // 获取列表验证
  getSensitiveFields: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
      search: Joi.string().allow('').optional(),
      mask_type: Joi.string().valid('phone', 'email', 'id_card', 'bank_card', 'name', 'address', 'custom').optional(),
      table_name: Joi.string().optional(),
      is_active: Joi.string().valid('true', 'false').optional(),
      sort: Joi.string().valid('created_at', 'updated_at', 'table_name', 'field_name').default('created_at'),
      order: Joi.string().valid('ASC', 'DESC').default('DESC'),
    }),
  },

  // 获取详情验证
  getSensitiveFieldById: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'ID格式不正确'
      }),
    }),
  },

  // 创建验证
  createSensitiveField: {
    body: sensitiveFieldSchema,
  },

  // 更新验证
  updateSensitiveField: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'ID格式不正确'
      }),
    }),
    body: Joi.object({
      mask_type: Joi.string().valid('phone', 'email', 'id_card', 'bank_card', 'name', 'address', 'custom').optional(),
      mask_rule: Joi.object().optional().allow(null),
      description: Joi.string().max(255).optional().allow(''),
      is_active: Joi.boolean().optional(),
    }).optional(),
  },

  // 删除验证
  deleteSensitiveField: {
    params: Joi.object({
      id: Joi.string().uuid().required().messages({
        'string.guid': 'ID格式不正确'
      }),
    }),
  },

  // 批量导入验证
  batchImportSensitiveFields: {
    body: batchImportSchema,
  },

  // 密码验证
  validatePassword: {
    body: passwordValidationSchema,
  },

  // 明文访问申请验证
  requestPlainAccess: {
    body: plainAccessRequestSchema,
  },

  // 权限检查验证
  checkPlainAccessPermission: {
    query: permissionCheckSchema,
  },
};
