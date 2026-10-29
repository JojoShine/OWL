const { UsersService } = require('../../dist/nest/identity/users.service');
const { SystemConfigService } = require('../../dist/nest/system-config/system-config.service');
const db = {
 owl_system_configs: { findFirst: async () => ({ password_policy: 'standard' }), update: async ({data}) => data },
 owl_users: { findFirst: async ({where}) => where.id ? {id:'id'} : null, create: async () => ({id:'id'}), update: async () => ({id:'id'}) },
 owl_user_roles: {findMany: async () => []},
 $transaction: async fn => fn(db),
};
it('rejects weak passwords before writing a new user', async () => {
 const service = new UsersService(db, new SystemConfigService(db));
 service.getUserById = async () => ({id:'id'});
 await expect(service.createUser({username:'alice',password:'123456'})).rejects.toMatchObject({status:400});
});
it('rejects weak passwords before resetting a password', async () => {
 const service = new UsersService(db, new SystemConfigService(db));
 service.getUserById = async () => ({id:'id'});
 await expect(service.resetPassword('id','123456')).rejects.toMatchObject({status:400});
});
it('rejects invalid security config enums', async () => {
 const service = new SystemConfigService(db);
 for (const body of [{password_policy:'none'},{login_failure_limit:0},{login_lock_minutes:1}]) {
  await expect(service.updateConfig(body,'id')).rejects.toMatchObject({status:400});
 }
});
it('enforces policy categories, code points and bcrypt byte limits', () => {
 const {validatePassword} = require('../../dist/nest/identity/password-policy');
 for (const [password,policy,valid] of [
  ['1234567','basic',false],['12345678','basic',true],['abcdefghij','standard',false],['abcdefgh12','standard',true],
  ['abcdefghij12','strict',false],['Abcdefghij12','strict',true],['a'.repeat(50),'basic',true],['a'.repeat(51),'basic',false],
  ['密'.repeat(24),'basic',true],['密'.repeat(24)+'a','basic',false],['','basic',false],
 ]) {
  if(valid) expect(()=>validatePassword(password,policy)).not.toThrow();
  else expect(()=>validatePassword(password,policy)).toThrow();
 }
});
it('rejects weak passwords through the edit-user path',async()=>{
 const service = new UsersService(db,new SystemConfigService(db));
 await expect(service.updateUser('id',{password:'123456'})).rejects.toMatchObject({status:400});
});
it('rejects empty passwords on the public password-registration path',()=>{
 const {register} = require('../../src/shared/validation/auth');
 expect(register.body.validate({username:'alice',email:'alice@example.com',phone:'13800138000',password:''}).error).toBeDefined();
});
