const validation = require('../../dist/shared/validation/data-security');
const { DataSecurityService } = require('../../dist/nest/data-security/data-security.service');
it('validates and applies supported sensitive-field filters before pagination',async()=>{
 const {value,error}=validation.getSensitiveFields.query.validate({search:'phone',mask_type:'phone',is_active:'false',page:2,limit:10},{stripUnknown:true});expect(error).toBeUndefined();
 const model={findMany:jest.fn(async()=>[]),count:jest.fn(async()=>11)};
 await new DataSecurityService({owl_sensitive_fields:model},{}).getSensitiveFields(value);
 expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({skip:10,take:10,where:{deletedAt:null,mask_type:'phone',is_active:false,OR:[{field_name:{contains:'phone',mode:'insensitive'}},{table_name:{contains:'phone',mode:'insensitive'}}]}}));
});
it('allows an empty sensitive-field search',async()=>{
 const {value,error}=validation.getSensitiveFields.query.validate({search:''});expect(error).toBeUndefined();
 const model={findMany:jest.fn(async()=>[]),count:jest.fn(async()=>3)};
 await new DataSecurityService({owl_sensitive_fields:model},{}).getSensitiveFields(value);
 expect(model.findMany).toHaveBeenCalledWith(expect.objectContaining({where:{deletedAt:null}}));
});
