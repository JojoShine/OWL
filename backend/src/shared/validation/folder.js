const Joi = require('joi');

/**
 * 获取文件夹列表验证
 */
const getFolders = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().allow(''),
    parent_id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('null')
    ),
    sort: Joi.string().valid('created_at', 'name', 'updated_at').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  }),
};

/**
 * 获取文件夹详情验证
 */
const getFolderById = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

/**
 * 获取文件夹内容验证
 */
const getFolderContents = {
  params: Joi.object({
    id: Joi.alternatives().try(
      Joi.string().uuid(),
      Joi.string().valid('root', 'null')
    ).required(),
  }),
  query: Joi.object({
    search: Joi.string().allow(''),
    sort: Joi.string().valid('created_at', 'name', 'size', 'updated_at').default('created_at'),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  }),
};

/**
 * 创建文件夹验证
 */
const createFolder = {
  body: Joi.object({
    name: Joi.string()
      .min(1)
      .max(255)
      .required()
      .messages({
        'string.min': '文件夹名称至少1个字符',
        'string.max': '文件夹名称最多255个字符',
        'any.required': '文件夹名称是必填项',
      }),
    parent_id: Joi.string().uuid().allow(null),
  }),
};

/**
 * 更新文件夹验证
 */
const updateFolder = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    name: Joi.string().min(1).max(255),
    parent_id: Joi.string().uuid().allow(null),
  }).min(1),
};

/**
 * 删除文件夹验证
 */
const deleteFolder = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

module.exports = {
  getFolders,
  getFolderById,
  getFolderContents,
  createFolder,
  updateFolder,
  deleteFolder,
};
