jest.mock('../../dist/shared/auth/captcha',()=>({}));
const {Test}=require('@nestjs/testing'),{ExpressAdapter}=require('@nestjs/platform-express'),{UnauthorizedException}=require('@nestjs/common'),express=require('express');
const {IdentityGuard}=require('../../dist/nest/identity/identity.guard'),{AuthService}=require('../../dist/nest/identity/auth.service'),{CompatibleExceptionFilter}=require('../../dist/nest/compatibility/exception.filter'),{AppModule}=require('../../dist/nest/app.module');
const classes=['Watermark','Dictionary','Dashboard','DashboardWidget'],files=['watermark','dictionary','dashboard','dashboard-widget'];
const controllers=classes.map((c,i)=>require('../../dist/nest/overview/'+files[i]+'.controller')[c+'Controller']);
describe('overview HTTP contracts',()=>{
 let app,base,watermark;
 beforeAll(async()=>{watermark={getWatermarkConfig:async()=>({enabled:true}),getRenderedWatermark:async()=>({lines:['user']}),validateConfig:()=>({valid:true}),updateWatermarkConfig:async body=>body};
 const values=[watermark,{getDictionaryByTypes:async()=>({status:[]}),getDictionaryByType:async()=>[]},{getDashboardData:async()=>({metrics:{}})},{getAll:async()=>[],executeAllEnabled:async()=>[],executeWidget:async()=>({data:[]})}];
 const providers=[IdentityGuard,{provide:AuthService,useValue:{authenticate:async token=>{if(!token)throw new UnauthorizedException();return {id:'user',roles:[{code:token==='Bearer admin'?'admin':'user',permissions:token==='Bearer admin'?[{resource:'watermark',action:'update'},{resource:'dictionary',action:'read'}]:[]}]};}}},...classes.map((c,i)=>({provide:require('../../dist/nest/overview/'+files[i]+'.service')[c+'Service'],useValue:values[i]}))];
 const module=await Test.createTestingModule({controllers:Reflect.getMetadata('controllers',AppModule).filter(c=>controllers.includes(c)),providers}).compile();app=module.createNestApplication(new ExpressAdapter(express()),{bodyParser:false});app.use(express.json());app.useGlobalFilters(new CompatibleExceptionFilter());await app.listen(0,'127.0.0.1');base=await app.getUrl();});
 afterAll(async()=>{await app?.close();});
 it('allows authenticated rendering and widget execution but protects management',async()=>{
  for(const path of ['/api/system/watermark','/api/system/dashboard','/api/system/dictionary','/api/system/dashboard-widgets'])expect((await fetch(base+path)).status).toBe(401);
  for(const path of ['/api/system/watermark','/api/system/watermark/rendered','/api/system/dashboard-widgets/execute'])expect((await fetch(base+path,{headers:{authorization:'Bearer user'}})).status).toBe(200);
  for(const path of ['/api/system/dashboard-widgets','/api/system/dictionary'])expect((await fetch(base+path,{headers:{authorization:'Bearer user'}})).status).toBe(403);
 });
 it('runs watermark validation and preserves dictionary and widget response envelopes',async()=>{
  const headers={authorization:'Bearer admin','content-type':'application/json'};
  expect((await fetch(base+'/api/system/watermark',{method:'PUT',headers,body:JSON.stringify({font_size:2})})).status).toBe(422);
  const valid=await fetch(base+'/api/system/watermark',{method:'PUT',headers,body:JSON.stringify({font_size:24,lines:['Hello']})});expect(valid.status).toBe(200);expect((await valid.json()).data.font_size).toBe(24);
  expect((await (await fetch(base+'/api/system/dictionary?types=status',{headers})).json()).data).toEqual({status:[]});
  expect((await fetch(base+'/api/system/dashboard-widgets/test/execute',{method:'POST',headers})).status).toBe(200);
 });
});
