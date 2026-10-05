jest.mock('../../dist/shared/auth/captcha',()=>({}));
const {Test}=require('@nestjs/testing'),{CompatibleExpressAdapter:ExpressAdapter}=require('../../dist/nest/compatibility/express.adapter'),{UnauthorizedException,ForbiddenException}=require('@nestjs/common'),express=require('express');
const load=(file,name)=>require('../../dist/nest/dynamic/'+file)[name];
const {IdentityGuard}=require('../../dist/nest/identity/identity.guard'),{AuthService}=require('../../dist/nest/identity/auth.service'),{CompatibleExceptionFilter}=require('../../dist/nest/compatibility/exception.filter'),{AppModule}=require('../../dist/nest/app.module');
const ApiBuilderController=load('api-builder.controller','ApiBuilderController'),ApiBuilderKeysController=load('api-builder-keys.controller','ApiBuilderKeysController'),ApiExecutorController=load('api-executor.controller','ApiExecutorController'),CustomApiController=load('api-executor.controller','CustomApiController'),GenericController=load('generic.controller','GenericController'),GeneratorController=load('generator.controller','GeneratorController');
describe('native dynamic HTTP contracts',()=>{
 let app,base,definition,configs,crud,builder,keys,executor;
 const id='c43b6717-ceef-492e-a457-cc0338e98083';
 beforeAll(async()=>{
  definition={id,endpoint:'/custom/nested/test',version:1,require_auth:false,method:'GET'};
  builder={findInterface:jest.fn(async()=>definition),getInterfaces:async()=>({items:[],pagination:{page:1,limit:10,total:0,pages:0}}),getInterfaceById:async()=>definition,createInterface:jest.fn(async body=>({...body,id})),testSql:async()=>({success:true})};
  keys={listKeys:async()=>[],authenticate:async key=>{if(key!=='valid')throw new UnauthorizedException();return {id:'key'};},authorizeInterface:jest.fn(async()=>{throw new ForbiddenException('not assigned');})};executor={executeInterface:jest.fn(async(_def,params)=>[{value:params.value}]),testInterface:async()=>[]};
  configs={getModuleConfigByPath:async()=>({id,module_path:'products',description:'产品'}),saveModuleConfig:jest.fn(async data=>data)};crud={list:async()=>({data:[],pagination:{total:0}}),export:async()=>['export'],downloadTemplate:async()=>({columns:[]}),batchDelete:async()=>({count:2})};
  const providers=[IdentityGuard,load('dynamic.guard','DynamicGuard'),{provide:AuthService,useValue:{authenticate:async token=>{if(!token)throw new UnauthorizedException();return {id,roles:[{permissions:token==='Bearer allowed'?['api-interface','api-key','generator','products'].flatMap(resource=>['read','create','update','delete'].map(action=>({resource,action}))):[]}]};}}}];
  for(const [file,name,value] of [['api-builder','ApiBuilderService',builder],['api-key','SqlApiKeysService',keys],['api-executor','ApiExecutorService',executor],['module-config','ModuleConfigService',configs],['generic','GenericService',crud],['db-reader','DbReaderService',{}],['code-generator','CodeGeneratorService',{}],['generation-history','GenerationHistoryService',{}],['business-table','BusinessTableService',{}],['sql-parser','SqlParserService',{}]])providers.push({provide:load(file+'.service',name),useValue:value});
  const controllers=Reflect.getMetadata('controllers',AppModule).filter(c=>[ApiBuilderController,ApiBuilderKeysController,ApiExecutorController,CustomApiController,GenericController,GeneratorController].includes(c));
  const module=await Test.createTestingModule({controllers,providers}).compile();app=module.createNestApplication(new ExpressAdapter(express()),{bodyParser:false});app.use(express.json());app.useGlobalFilters(new CompatibleExceptionFilter());await app.listen(0,'127.0.0.1');base=await app.getUrl();
 });
 afterAll(async()=>{await app?.close();});
 const headers={authorization:'Bearer allowed','content-type':'application/json'};
 it('requires JWT and resource permissions for management and dynamic data',async()=>{for(const path of ['/api/system/api-builder','/api/system/generator/configs','/api/modules/products']){expect((await fetch(base+path)).status).toBe(401);expect((await fetch(base+path,{headers:{authorization:'Bearer denied'}})).status).toBe(403);}});
 it('resolves static key and dynamic action routes before id routes',async()=>{
  expect((await fetch(base+'/api/system/api-builder/keys',{headers})).status).toBe(200);
  expect((await (await fetch(base+'/api/modules/products/export',{headers})).json()).data).toEqual(['export']);
  expect((await fetch(base+'/api/modules/products/download-template',{headers})).status).toBe(200);
  expect((await (await fetch(base+'/api/modules/products/batch',{method:'DELETE',headers,body:JSON.stringify({ids:[id]})})).json()).data.count).toBe(2);
 });
 it('keeps nested custom endpoints and enforces key requirements independently of internal JWT',async()=>{
  let response=await fetch(base+'/api/custom/nested/test?value=hello&version=1');expect(response.status).toBe(200);expect((await response.json()).data).toEqual([{value:'hello'}]);expect(builder.findInterface).toHaveBeenCalledWith('/custom/nested/test',1,'GET');
  expect((await fetch(base+'/api/custom/nested/test',{headers:{'x-api-key':'invalid'}})).status).toBe(401);
  definition.require_auth=true;expect((await fetch(base+'/api/custom/nested/test',{headers})).status).toBe(401);expect((await fetch(base+'/api/custom/nested/test',{headers:{'x-api-key':'valid'}})).status).toBe(403);definition.require_auth=false;
 });
 it('validates builder input and returns plain Prisma records',async()=>{
  expect((await fetch(base+'/api/system/api-builder',{method:'POST',headers,body:'{}'})).status).toBe(422);
  const response=await fetch(base+'/api/system/api-builder',{method:'POST',headers,body:JSON.stringify({name:'test',endpoint:'/custom/test',method:'GET',sql_query:'SELECT 1',version:1})});expect(response.status).toBe(201);expect((await response.json()).data.id).toBe(id);
 });
 it('returns page config fallback without requiring an uncompiled legacy file',async()=>{const response=await fetch(base+'/api/system/generator/page-config/products',{headers});expect(response.status).toBe(200);expect((await response.json()).data.modulePath).toBe('products');});
});
