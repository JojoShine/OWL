import Joi from 'joi';
const id=Joi.object({id:Joi.string().uuid().required()});
export const storageSchemas={
 createShare:{body:Joi.object({file_id:Joi.string().uuid().required(),expires_in_hours:Joi.number().integer().min(1).max(720).allow(null)})},
 shareCode:{params:Joi.object({shareCode:Joi.string().required()})},
 id:{params:id},
 permission:{params:id,body:Joi.object({userId:Joi.string().uuid(),roleId:Joi.string().uuid(),permission:Joi.string().valid('read','write','delete','admin').required()}).xor('userId','roleId')},
 inherit:{params:id,body:Joi.object({inherit:Joi.boolean().required()})},
};
