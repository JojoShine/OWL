import {it,expect} from 'vitest';
import {validatePassword} from './password-policy';
it.each([
 ['1234567','basic',false],['12345678','basic',true],['abcdefghij','standard',false],['abcdefgh12','standard',true],
 ['abcdefghij12','strict',false],['Abcdefghij12','strict',true],['a'.repeat(50),'basic',true],['a'.repeat(51),'basic',false],
 ['密'.repeat(24),'basic',true],['密'.repeat(24)+'a','basic',false],['','basic',false],['validPassword1',null,false],
])('validates password policy boundary %s %s', (password,policy,valid)=>{
 expect(validatePassword(password,policy).length===0).toBe(valid);
});
