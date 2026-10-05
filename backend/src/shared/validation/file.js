const Joi = require('joi');

/**
 * 获取文件列表验证
 */
const getFiles = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(''),
    folder_id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('null')
    ),
    mime_type: Joi.string().allow(''),
    category: Joi.string().valid('image', 'video', 'document', 'audio', 'archive', 'text', 'other'),
    sort: Joi.string().valid('created_at', 'original_name', 'size', 'updated_at').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  }),
};

/**
 * 获取文件详情验证
 */
const getFileById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 更新文件验证
 */
const updateFile = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    original_name: Joi.string().min(1).max(255),
  }).min(1),
};

/**
 * 删除文件验证
 */
const deleteFile = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 批量删除文件验证
 */
const batchDeleteFiles = {
  body: Joi.object({
    ids: Joi.array()
      .items(Joi.string().uuid())
      .min(1)
      .required()
      .messages({
        'array.min': '至少选择一个文件',
        'any.required': '文件ID列表是必填项',
      }),
  }),
};

/**
 * 移动文件验证
 */
const moveFile = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    folder_id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('null'),
      Joi.allow(null)
    ).required(),
  }),
};

/**
 * 复制文件验证
 */
const copyFile = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    folder_id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('null')
    ).required(),
  }),
};

module.exports = {
  getFiles,
  getFileById,
  updateFile,
  deleteFile,
  batchDeleteFiles,
  moveFile,
  copyFile,
};
