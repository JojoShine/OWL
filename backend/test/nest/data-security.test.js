const { ThirdPartyKeysService } = require('../../dist/nest/data-security/third-party-keys.service');
const { DataSecurityService } = require('../../dist/nest/data-security/data-security.service');
it('never returns encrypted secret fields from key details or status changes',async()=>{
 const row={id:'key',api_key:'public',status:'active',secret_ciphertext:'private',secret_iv:'iv',secret_auth_tag:'tag'};
 const db={owl_third_party_api_keys:{findFirst:async()=>row,update:async({data})=>({...row,...data})}};
 const service=new ThirdPartyKeysService(db);
 for(const result of [await service.getKey('key'),await service.changeStatus('key','inactive','u')]){
  expect(result.secret_ciphertext).toBeUndefined();expect(result.secret_iv).toBeUndefined();expect(result.secret_auth_tag).toBeUndefined();expect(result.api_key).toBe('public');
 }
});
it('rejects passwordless accounts when requesting sensitive access',async()=>{
 const service=new DataSecurityService({owl_users:{findFirst:async()=>({id:'u',password:null})}},{audit(){}});
 await expect(service.validatePasswordWithAttempts('u','guess',{})).rejects.toMatchObject({status:401});
});
