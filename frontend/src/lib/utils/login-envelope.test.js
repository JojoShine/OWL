import {it,expect} from 'vitest';
import {sm2} from 'sm-crypto-v2';
import client from './http-client';
import {authApi} from '../api/system/auth.api';
it('obtains a fresh challenge and sends only encrypted credentials',async()=>{
 const keys=sm2.generateKeyPairHex();
 const challenge={challengeId:'a'.repeat(64),nonce:'b'.repeat(64),keyId:'test',publicKey:keys.publicKey,expiresAt:Date.now()+60000};
 const requests=[];
 const original=client.defaults.adapter;
 client.defaults.adapter=async config=>{
  requests.push({url:config.url,data:config.data});
  return {status:200,config,headers:{},data:{success:true,data:config.url.endsWith('challenge')?challenge:{token:'token'}}};
 };
 try {
  await authApi.login({username:'alice',password:'secret',captchaId:'id',captchaCode:'1'});
  expect(requests.map(r=>r.url)).toEqual(['/auth/challenge','/auth/login']);
  const sent=JSON.parse(requests[1].data);
  expect(sent.username).toBeUndefined();expect(sent.password).toBeUndefined();
  expect(JSON.parse(sm2.doDecrypt(sent.ciphertext.slice(2),keys.privateKey,1))).toEqual({username:'alice',password:'secret',nonce:challenge.nonce,challengeId:challenge.challengeId,purpose:'password-login'});
 } finally {client.defaults.adapter=original;}
});
