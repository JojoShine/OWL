const Joi = require('joi');

const serverCreateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  ip_address: Joi.string().required(),
  port: Joi.number().integer().min(1).max(65535).default(22),
  username: Joi.string().max(100).required(),
  password: Joi.string().allow('').optional(),
  private_key: Joi.string().allow('').optional(),
  auth_type: Joi.string().valid('password', 'key').default('password'),
  interval: Joi.number().integer().min(30).max(3600).default(60),
  timeout: Joi.number().integer().min(5).max(120).default(30),
  cpu_threshold: Joi.number().min(0).max(100).default(90),
  memory_threshold: Joi.number().min(0).max(100).default(90),
  disk_threshold: Joi.number().min(0).max(100).default(90),
  enabled: Joi.boolean().default(true),
  alert_enabled: Joi.boolean().default(false),
  alert_template_id: Joi.string().uuid().allow(null).optional(),
  alert_recipients: Joi.array().items(Joi.string().email()).optional(),
  alert_interval: Joi.number().integer().min(60).max(86400).default(1800),
});

const serverUpdateSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  ip_address: Joi.string().optional(),
  port: Joi.number().integer().min(1).max(65535).optional(),
  username: Joi.string().max(100).optional(),
  password: Joi.string().allow('').optional(),
  private_key: Joi.string().allow('').optional(),
  auth_type: Joi.string().valid('password', 'key').optional(),
  interval: Joi.number().integer().min(30).max(3600).optional(),
  timeout: Joi.number().integer().min(5).max(120).optional(),
  cpu_threshold: Joi.number().min(0).max(100).optional(),
  memory_threshold: Joi.number().min(0).max(100).optional(),
  disk_threshold: Joi.number().min(0).max(100).optional(),
  enabled: Joi.boolean().optional(),
  alert_enabled: Joi.boolean().optional(),
  alert_template_id: Joi.string().uuid().allow(null).optional(),
  alert_recipients: Joi.array().items(Joi.string().email()).optional(),
  alert_interval: Joi.number().integer().min(60).max(86400).optional(),
}).min(1);

module.exports = {
  serverCreateSchema,
  serverUpdateSchema,
};
