const { AuthService } = require('../../dist/nest/identity/auth.service');
const bcrypt = require('bcryptjs');
const user = { id:'u1', username:'alice', password:null, status:'active', deletedAt:null };
function setup(row=user){
 const db={owl_users:{findFirst:async()=>row}};
 const effects={verifyCaptcha:async()=>true};
 return new AuthService(db,{},effects);
}
it('rejects an invalid captcha before checking a password',async()=>{
 const service=new AuthService({}, {}, {verifyCaptcha:async()=>false});
 await expect(service.login({captchaId:'invalid',captchaCode:'0'})).rejects.toMatchObject({status:400});
});
it('rejects SMS-only accounts attempting password login without throwing a hash error',async()=>{
 await expect(setup().login({username:'alice',password:'guess'})).rejects.toMatchObject({status:401});
});
it('does not authenticate an inactive account with a correct password',async()=>{
 const password=await bcrypt.hash('correct-password',4);
 await expect(setup({...user,password,status:'inactive'}).login({username:'alice',password:'correct-password'})).rejects.toMatchObject({status:403});
});
it('rejects a deleted or missing token owner',async()=>{
 const service=new AuthService({owl_users:{findFirst:async()=>null}},{},{verifyToken:()=>({id:'u1'})});
 await expect(service.authenticate('Bearer test')).rejects.toMatchObject({status:401});
});
