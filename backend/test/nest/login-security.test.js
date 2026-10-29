const {AuthService} = require('../../dist/nest/identity/auth.service');
const bcrypt = require('bcryptjs');
it('checks the lock before issuing a token even with the correct password',async()=>{
 const row={id:'id',username:'alice',status:'active',password:await bcrypt.hash('old-weak',4)};
 const db={owl_users:{findFirst:async()=>row},$transaction:async()=>0};
 const effects={verifyCaptcha:async()=>true,generateToken:()=>{throw new Error('token must not be issued')}};
 const security={assertUnlocked:async()=>{},acceptSuccess:async()=>{throw Object.assign(new Error('locked'),{status:429})}};
 const service=new AuthService(db,{},effects,security);
 await expect(service.login({username:'alice',password:'old-weak'})).rejects.toMatchObject({status:429});
});
