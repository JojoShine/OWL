jest.mock('../../src/shared/config/logger',()=>({accessLogger:{http:jest.fn()},operationLogger:{info:jest.fn()}}));
const {operationLogger} = require('../../src/shared/config/logger');
const {operationLogMiddleware} = require('../../src/shared/http/requestLogger');
it('redacts every credential variant from operation logs',()=>{
 const req={method:'POST',originalUrl:'/api/system/auth/login',get:()=>'',body:{password:'p',oldPassword:'old',newPassword:'new',confirmPassword:'new',ciphertext:'encrypted',nonce:'once'}};
 const res={send:()=>{}};
 operationLogMiddleware(req,res,()=>{});res.send('ok');
 const logged=JSON.parse(operationLogger.info.mock.calls[0][0]);
 for(const value of Object.values(logged.body)) expect(value).toBe('***FILTERED***');
});
