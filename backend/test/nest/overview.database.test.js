jest.mock('../../dist/shared/config/redis',()=>({isRedisAvailable:()=>true,redisClient:{set:jest.fn(async()=> 'OK')}}));
const enabled=process.env.OWL_DATABASE_TEST==='1';
(enabled?describe:describe.skip)('overview and integration PostgreSQL migration',()=>{
 let db,previousEncryptionKey;
 beforeAll(async()=>{require('dotenv').config();previousEncryptionKey=process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY;process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY='31'.repeat(32);process.env.DB_NAME_TEST=process.env.DB_NAME;const {PrismaService}=require('../../dist/nest/database/prisma.service');db=new PrismaService();await db.$connect();});
 afterAll(async()=>{await db?.$disconnect();if(previousEncryptionKey===undefined)delete process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY;else process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY=previousEncryptionKey;});
 it('maps existing PostgreSQL rows without altering stored data', async () => { await require('./postgres-contract').assertRowsMatchPostgres(db, ["owl_dashboard_widgets","owl_third_party_api_call_logs"]); });
 it('persists configuration, renders watermark, groups dictionaries and audits valid/invalid signed calls with rollback',async()=>{
  const suffix=require('node:crypto').randomUUID().slice(0,8),rollback=new Error('rollback phase6');let userId;
  try{await db.$transaction(async tx=>{
   let store;store=new Proxy(tx,{get(target,key){return key==='$transaction'?work=>work(store):Reflect.get(target,key);}});
   const {SqlService}=require('../../dist/nest/dynamic/sql.service'),sql=new SqlService(store);const make=(file,name,...args)=>new (require('../../dist/nest/overview/'+file+'.service')[name])(...args);
   const watermark=make('watermark','WatermarkService',store,sql),dictionary=make('dictionary','DictionaryService',sql),widgets=make('dashboard-widget','DashboardWidgetService',store,sql),dashboard=make('dashboard','DashboardService',store),integration=make('integration','IntegrationService',store);
   const user=await tx.owl_users.create({data:{username:'overview_'+suffix,email:suffix+'@test.invalid',password:'unused',createdAt:new Date(),updatedAt:new Date(),status:'active'}});userId=user.id;
   await watermark.updateWatermarkConfig({enabled:true,lines:['{{user:username}}','{{user:department}}'],font_weight:'700',opacity:0.2},user);expect((await watermark.getRenderedWatermark({...user,department:{name:'技术部'}})).lines).toEqual([user.username,'技术部']);
   await watermark.updateWatermarkConfig({enabled:false},user);expect((await watermark.getRenderedWatermark(user)).lines).toEqual([]);
   const type='migration_'+suffix;await sql.execute('INSERT INTO owl_dictionary (id,dict_type,dict_code,dict_name,is_active,sort_order,created_at,updated_at) VALUES (:id,:type,:code,:name,true,1,NOW(),NOW()),(:other,:type,:hidden,:name,false,2,NOW(),NOW())',{id:require('node:crypto').randomUUID(),other:require('node:crypto').randomUUID(),type,code:'active',hidden:'inactive',name:'启用'});
   expect((await dictionary.getDictionaryByTypes([type]))[type]).toHaveLength(1);expect((await dictionary.getDictionaryByType(type))[0].dict_code).toBe('active');
   const widget=await widgets.create({title:'test',sql_query:"SELECT DATE '2026-10-05' AS day, 1.20::numeric AS amount",enabled:true},user.id);expect((await widgets.executeWidget(widget.id)).data).toEqual([{day:'2026-10-05',amount:'1.20'}]);await widgets.update(widget.id,{title:'updated'});expect((await widgets.getById(widget.id)).title).toBe('updated');await widgets.delete(widget.id);await expect(widgets.getById(widget.id)).rejects.toMatchObject({status:404});
   const metrics=await dashboard.getMetrics();expect(metrics.totalUsers).toBe(await tx.owl_users.count({where:{deletedAt:null}}));expect(Number.isFinite(metrics.runningDays)).toBe(true);expect(await dashboard.getStorageOverview()).toHaveLength(5);expect(await dashboard.getAccessTrend()).toHaveLength(7);
   const {ThirdPartyKeysService}=require('../../dist/nest/data-security/third-party-keys.service');const key=await new ThirdPartyKeysService(store).createKey({client_name:'migration',scopes:['integration:ping']},user.id);
   const crypto=require('../../dist/shared/security/third-party-crypto'),timestamp=String(Date.now()),nonce='test-'+suffix,request={method:'GET',originalUrl:'/api/public/integration/ping?b=2&a=1',query:{b:'2',a:'1'},rawBody:Buffer.alloc(0),clientIp:'127.0.0.1'};
   const headers={'X-API-Key':key.api_key,'X-Timestamp':timestamp,'X-Nonce':nonce,'X-Signature':crypto.createSignature(crypto.buildCanonicalRequest({...request,path:'/api/public/integration/ping',timestamp,nonce}),key.api_secret)};request.get=name=>headers[name];
   expect((await integration.ping(request)).client).toBe('migration');expect((await tx.owl_third_party_api_call_logs.findFirst({where:{third_party_key_id:key.id}})).response_code).toBe(200);expect((await tx.owl_third_party_api_keys.findUnique({where:{id:key.id}})).last_used_at).not.toBeNull();
   headers['X-Signature']='invalid';await expect(integration.ping(request)).rejects.toMatchObject({statusCode:401});expect(await tx.owl_third_party_api_call_logs.count({where:{third_party_key_id:key.id,response_code:401}})).toBe(1);
   throw rollback;
  },{timeout:30000});}catch(error){if(error!==rollback)throw error;}expect(await db.owl_users.findUnique({where:{id:userId}})).toBeNull();
 },40000);
});
