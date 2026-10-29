const {publicError} = require('../../src/shared/utils/business-errors');
it('hides internal messages, including Chinese technical errors',()=>{
 for(const message of ['Internal error','数据库 SQL SELECT secret','<html>error</html>']) {
  expect(publicError({statusCode:400,message}).message).toBe('请求参数不正确，请检查后重试');
 }
 expect(publicError({statusCode:500,message:'用户不存在'}).message).toBe('服务器出错，请稍后重试');
});
it('preserves explicitly catalogued business messages',()=>{
 expect(publicError({statusCode:400,message:'手机号已被注册'})).toMatchObject({message:'手机号已被注册'});
});
it('maps known field constraints without exposing arbitrary Joi text',()=>{
 const result=publicError({statusCode:422,errorCode:'VALIDATION_ERROR',errors:[{path:['body','newPassword'],type:'any.invalid',message:'technical internal details',context:{value:'secret'}}]});
 expect(result).toMatchObject({errorCode:'VALIDATION_ERROR',params:{field:'newPassword',constraint:'any.invalid'}});
 expect(JSON.stringify(result)).not.toContain('secret');
 expect(result.message).toBe('新密码不能与原密码相同');
});
