const Joi = require('joi');

const keyId = {
  params: Joi.object({ id: Joi.string().uuid().required() }).required(),
};

const keyPayload = Joi.object({
  client_name: Joi.string().trim().min(2).max(255).required(),
  description: Joi.string().allow('').max(500).optional(),
  expires_at: Joi.date().greater('now').optional(),
  interface_ids: Joi.array().items(Joi.string().uuid()).min(1).unique().required(),
}).required();

module.exports = {
  list: {
    query: Joi.object({ interface_id: Joi.string().uuid().optional() }),
  },
  create: { body: keyPayload },
  update: { ...keyId, body: keyPayload },
  keyId,
  changeStatus: {
    ...keyId,
    body: Joi.object({ status: Joi.string().valid('active', 'inactive').required() }).required(),
  },
};
