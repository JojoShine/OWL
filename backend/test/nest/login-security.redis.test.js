const {createClient} = require('redis');
const {randomUUID,createHash} = require('node:crypto');
const {sm2} = require('sm-crypto-v2');
const compat = require('../../dist/nest/compatibility/shared');
const {LoginSecurityService} = require('../../dist/nest/identity/login-security.service');
const {LoginChallengeService} = require('../../dist/nest/identity/login-challenge.service');
const run = process.env.OWL_AUTH_REDIS_TEST === '1' ? describe : describe.skip;
run('authentication state against isolated Redis',()=>{
 let client, spy, service, challenges, username, prefix, available=true;
 const keys=[];
 const oldPrivate=process.env.LOGIN_SM2_PRIVATE_KEY,oldId=process.env.LOGIN_SM2_KEY_ID;
 beforeAll(async()=>{
  client=createClient({url:process.env.OWL_AUTH_REDIS_URL || 'redis://127.0.0.1:16381'});
  await client.connect();
  const original=compat.shared;
  spy=jest.spyOn(compat,'shared').mockImplementation(name=>name==='config/redis'?{redisClient:client,isRedisAvailable:()=>available}:original(name));
  await sm2.initRNGPool();
  const pair=sm2.generateKeyPairHex();process.env.LOGIN_SM2_PRIVATE_KEY=pair.privateKey;process.env.LOGIN_SM2_KEY_ID='test';
  service=new LoginSecurityService({getConfig:async()=>({login_failure_limit:5,login_lock_minutes:15})});
  challenges=new LoginChallengeService();
 });
 beforeEach(()=>{
  available=true;username=`test-${randomUUID()}`;
  prefix=`owl:login:{${createHash('sha256').update(username).digest('hex')}}`;
  keys.push(`${prefix}:failures`,`${prefix}:lock`);
 });
 afterAll(async()=>{
  if(keys.length)await client.del(keys);await client.quit();spy.mockRestore();
  if(oldPrivate===undefined)delete process.env.LOGIN_SM2_PRIVATE_KEY;else process.env.LOGIN_SM2_PRIVATE_KEY=oldPrivate;
  if(oldId===undefined)delete process.env.LOGIN_SM2_KEY_ID;else process.env.LOGIN_SM2_KEY_ID=oldId;
 });
 async function envelope(overrides={}) {
  const challenge=await challenges.issue();keys.push(`owl:login:challenge:${challenge.challengeId}`);
  const credentials={username:'alice',password:'old-weak',nonce:challenge.nonce,challengeId:challenge.challengeId,purpose:'password-login',...overrides};
  return {...challenge,ciphertext:`04${sm2.doEncrypt(JSON.stringify(credentials),challenge.publicKey,1)}`,captchaId:'captcha',captchaCode:'1'};
 }
 function body(e){return {challengeId:e.challengeId,keyId:e.keyId,ciphertext:e.ciphertext,captchaId:e.captchaId,captchaCode:e.captchaCode};}
 it('locks on fifth failure and cannot clear or extend a lock on success',async()=>{
  for(let i=0;i<4;i++)await service.recordFailure(username);
  await expect(service.recordFailure(username)).rejects.toMatchObject({status:429});
  expect(await client.ttl(`${prefix}:lock`)).toBeGreaterThanOrEqual(899);
  await client.expire(`${prefix}:lock`,60);
  await expect(service.acceptSuccess(username)).rejects.toMatchObject({status:429});
  expect(await client.ttl(`${prefix}:lock`)).toBeLessThanOrEqual(60);
 });
 it('serializes concurrent failures across instances and rejects success after locking',async()=>{
  const other=new LoginSecurityService({getConfig:async()=>({login_failure_limit:5,login_lock_minutes:15})});
  const results=await Promise.allSettled(Array.from({length:20},(_,i)=>(i%2?other:service).recordFailure(username)));
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(4);
  await expect(other.acceptSuccess(username)).rejects.toMatchObject({status:429});
 });
 it('clears successful failures and starts again after window expiration',async()=>{
  await service.recordFailure(username);await service.acceptSuccess(username);
  expect(await client.exists(`${prefix}:failures`)).toBe(0);
  await service.recordFailure(username);await client.pExpire(`${prefix}:failures`,1);
  await new Promise(r=>setTimeout(r,20));await service.recordFailure(username);
  expect(await client.get(`${prefix}:failures`)).toBe('1');
  await client.set(`${prefix}:lock`,'1',{PX:1});await new Promise(r=>setTimeout(r,20));
  await expect(service.assertUnlocked(username)).resolves.toBeUndefined();
 });
 it('consumes a challenge exactly once even under concurrency',async()=>{
  const e=await envelope();
  const results=await Promise.allSettled([challenges.consume(body(e)),challenges.consume(body(e))]);
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
  expect(results.find(r=>r.status==='fulfilled').value).toEqual({username:'alice',password:'old-weak'});
 });
 it.each([{nonce:'c'.repeat(64)},{challengeId:'d'.repeat(64)},{purpose:'reset-password'}])('consumes but rejects mismatched encrypted context %j',async override=>{
  const e=await envelope(override);
  await expect(challenges.consume(body(e))).rejects.toMatchObject({status:400});
  expect(await client.exists(`owl:login:challenge:${e.challengeId}`)).toBe(0);
 });
 it('rejects expiry, wrong key id and ciphertext tampering',async()=>{
  for(const mode of ['expired','key','tampered']){
   const e=await envelope();
   if(mode==='expired')await client.pExpire(`owl:login:challenge:${e.challengeId}`,1);
   if(mode==='key')e.keyId='wrong';
   if(mode==='tampered')e.ciphertext=e.ciphertext.slice(0,-2)+(e.ciphertext.endsWith('00')?'01':'00');
   await new Promise(r=>setTimeout(r,20));
   await expect(challenges.consume(body(e))).rejects.toMatchObject({status:400});
  }
 });
 it('fails closed on Redis or key outage and rejects plaintext',async()=>{
  available=false;await expect(service.assertUnlocked(username)).rejects.toMatchObject({status:503});
  await expect(challenges.issue()).rejects.toMatchObject({status:503});available=true;
  await expect(challenges.consume({username:'alice',password:'plain'})).rejects.toMatchObject({status:400,response:{errorCode:'AUTH_UPGRADE_REQUIRED'}});
  const saved=process.env.LOGIN_SM2_PRIVATE_KEY;process.env.LOGIN_SM2_PRIVATE_KEY='bad';
  await expect(challenges.issue()).rejects.toMatchObject({status:503});process.env.LOGIN_SM2_PRIVATE_KEY=saved;
 });
});
