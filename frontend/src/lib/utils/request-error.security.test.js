import {it,expect} from 'vitest';
import {getRequestErrorMessage,normalizeRequestError} from './request-error';
it.each(['Internal database error','数据库 SQL SELECT secret','<html>error</html>'])('does not expose unknown response text: %s',async message=>{
 const error=await normalizeRequestError({response:{status:400,data:{message}}});
 expect(error.userMessage).toBe('请求未能完成，请检查输入后重试');
 expect(getRequestErrorMessage(new Error(message),'操作失败')).toBe('操作失败');
});
it('keeps lockout information ahead of generic 429 notices',async()=>{
 const error=await normalizeRequestError({response:{status:429,headers:{},data:{errorCode:'AUTH_LOCKED',params:{retryAfterSeconds:90}}}});
 expect(error.userMessage).toContain('90 秒');
});
it('explains known field validation constraints',async()=>{
 const error=await normalizeRequestError({response:{status:422,data:{errorCode:'VALIDATION_ERROR',params:{field:'newPassword',constraint:'any.invalid'}}}});
 expect(error.userMessage).toBe('新密码不能与原密码相同');
});
