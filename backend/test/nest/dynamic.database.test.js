const enabled=process.env.OWL_DATABASE_TEST==='1';
(enabled?describe:describe.skip)('dynamic modules and SQL API PostgreSQL migration',()=>{
 let db, originalPepper;
 beforeAll(async()=>{require('dotenv').config();originalPepper=process.env.API_KEY_PEPPER;process.env.API_KEY_PEPPER=require('node:crypto').randomBytes(32).toString('hex');process.env.DB_NAME_TEST=process.env.DB_NAME;const {PrismaService}=require('../../dist/nest/database/prisma.service');db=new PrismaService();await db.$connect();});
 afterAll(async()=>{await db?.$disconnect();if(originalPepper===undefined)delete process.env.API_KEY_PEPPER;else process.env.API_KEY_PEPPER=originalPepper;});
 it('preserves DATE, timestamp timezone semantics and decimal scale in the public SQL response contract',async()=>{
  const {SqlService}=require('../../dist/nest/dynamic/sql.service');const sql=new SqlService(db);
  const query="SELECT DATE '2026-10-05' AS day, TIMESTAMP '2026-10-05 12:34:56' AS local_time, TIMESTAMPTZ '2026-10-05 12:34:56+08' AS instant, 12.50::numeric AS amount, 9223372036854775806::bigint AS large, ARRAY[DATE '2026-10-05'] AS days, ARRAY[12.50::numeric] AS amounts";
  const expected=[{day:'2026-10-05',local_time:new Date('2026-10-05T12:34:56').toISOString(),instant:'2026-10-05T04:34:56.000Z',amount:'12.50',large:'9223372036854775806',days:['2026-10-05'],amounts:['12.50']}];expect(await sql.rows(query)).toEqual(expected);await db.$transaction(async tx=>expect(await sql.rows(query,{},tx)).toEqual(expected));
 });
 it('maps existing PostgreSQL rows without altering stored data', async () => { await require('./postgres-contract').assertRowsMatchPostgres(db, ["owl_api_interfaces","owl_api_keys","owl_generated_modules","owl_generated_fields","owl_generation_history"]); });
 it('preserves CRUD, configuration, SQL bindings, key ownership and publication with rollback',async()=>{
  const {randomUUID}=require('node:crypto'),suffix=randomUUID().slice(0,8),rollback=new Error('rollback phase5');let table;
  try{await db.$transaction(async tx=>{
   let store;store=new Proxy(tx,{get(target,key){return key==='$transaction'?work=>work(store):Reflect.get(target,key);}});
   const make=(file,cls,...args)=>new (require('../../dist/nest/dynamic/'+file+'.service')[cls])(...args);
   const effects={invalidateRoles:jest.fn()},sql=make('sql','SqlService',store),reader=make('db-reader','DbReaderService',sql),configs=make('module-config','ModuleConfigService',store,reader,effects),business=make('business-table','BusinessTableService',store,sql,reader,configs),crud=make('generic','GenericService',sql),builder=make('api-builder','ApiBuilderService',store,sql),keys=make('api-key','SqlApiKeysService',store),executor=make('api-executor','ApiExecutorService',store,sql),generator=make('code-generator','CodeGeneratorService',store,configs,reader,sql,effects),history=make('generation-history','GenerationHistoryService',store),parser=make('sql-parser','SqlParserService',sql);
   const user=await tx.owl_users.create({data:{username:'dynamic_'+suffix,email:suffix+'@test.invalid',password:'not-a-real-password',createdAt:new Date(),updatedAt:new Date()}});
   const result=await business.createBusinessTable({table_name:'migration_'+suffix,table_comment:"交易 ' 测试",fields:[{name:'title',type:'string',nullable:false,indexed:true},{name:'amount',type:'decimal',default_value:'2.50'},{name:'active',type:'boolean',default_value:true}]},user.id);table=result.tableName;let config=result.moduleConfig;
   expect(await reader.tableExists(table)).toBe(true);expect(config.fields.some(f=>f.field_name==='title')).toBe(true);
   config=await configs.saveModuleConfig({...config,enable_export:true,fields:config.fields});expect(config.page_config.tableName).toBe(table);
   const item=await crud.create(config,{title:"quoted ' :value",amount:12.5,active:true},user.id);expect(item.title).toBe("quoted ' :value");expect(item.created_by).toBe(user.id);
   expect((await crud.getById(config,item.id)).id).toBe(item.id);expect((await crud.list(config,{title:"quoted ' :value"})).pagination.total).toBe(1);
   expect((await crud.update(config,item.id,{title:'updated',active:false},user.id)).active).toBe(false);expect((await crud.export(config,{})).length).toBe(1);expect(await crud.downloadTemplate(config)).toBeDefined();
   const imported=await crud.importFromExcel(config,[{title:'imported',amount:3,active:true}]);expect(imported.successCount).toBe(1);expect((await crud.list(config,{})).pagination.total).toBe(2);
   const row=await builder.createInterface({name:'test',endpoint:'/custom/test/'+suffix,sql_query:'SELECT :value::text AS value',parameters:[{name:'value',type:'string',required:true}],require_auth:false},user.id);
   expect(await executor.executeInterface(row,{value:"'; DROP TABLE nobody;--"})).toEqual([{value:"'; DROP TABLE nobody;--"}]);expect((await tx.owl_api_call_logs.findFirst({where:{interface_id:row.id}})).response_code).toBe(200);
   const key=await keys.createKey({client_name:'test',interface_ids:[row.id]},user.id);expect((await keys.authenticate(key.api_key)).id).toBe(key.id);expect(JSON.stringify(await keys.listKeys(user.id))).not.toContain(key.api_key);expect((await keys.listKeys(user.id))[0]).not.toHaveProperty('key_hash');
   await expect(keys.deleteKey(key.id,randomUUID())).rejects.toMatchObject({status:404});await keys.changeStatus(key.id,'disabled',user.id);await expect(keys.authenticate(key.api_key)).rejects.toMatchObject({status:403});
   const rotated=await keys.regenerateKey(key.id,user.id);await expect(keys.authenticate(key.api_key)).rejects.toMatchObject({status:401});expect((await keys.authenticate(rotated.api_key)).id).toBe(key.id);
   expect(await sql.rows(`SELECT substring(title, 1, :length::int) AS part, COUNT(*) AS total FROM ${table} GROUP BY substring(title, 1, :length::int)`,{length:1})).toHaveLength(2);
   expect((await parser.validateSql('SELECT :value::text AS value')).valid).toBe(true);expect((await parser.executeSampleQuery('SELECT 1 AS number'))[0].number).toBe(1);expect((await parser.parseSqlFields(`SELECT title FROM "${table}"`)).fields[0].fieldName).toBe('title');
   await generator.generateCode(config.id);const menu=await tx.owl_menus.findFirst({where:{path:'/'+config.module_path,deletedAt:null}});expect(menu).not.toBeNull();
   await history.recordHistory({module_id:config.id,table_name:table,module_name:config.module_name,operation_type:'create',files_generated:[],success:true,user_id:user.id});expect((await history.getModuleHistory(config.id)).pagination.total).toBe(1);
   await generator.deleteGeneratedCode(config.id);expect(await tx.owl_menus.findFirst({where:{id:menu.id,deletedAt:null}})).toBeNull();await generator.generateCode(config.id);
   await crud.delete(config,item.id,user.id);await expect(crud.getById(config,item.id)).rejects.toMatchObject({statusCode:404});const others=(await crud.list(config,{})).data;expect((await crud.batchDelete(config,others.map(r=>r.id),user.id)).count).toBe(1);
   await configs.deleteModuleConfig(config.id);await expect(configs.getModuleConfigById(config.id)).rejects.toMatchObject({status:404});throw rollback;
  },{timeout:45000});}catch(error){if(error!==rollback)throw error;}
  expect((await db.$queryRawUnsafe('SELECT to_regclass($1)::text AS name',table))[0].name).toBeNull();
 },55000);
 it('rolls back a new business table when configuration cannot be created',async()=>{
  const name='rollback_'+require('node:crypto').randomUUID().slice(0,8);const {SqlService}=require('../../dist/nest/dynamic/sql.service'),{DbReaderService}=require('../../dist/nest/dynamic/db-reader.service'),{BusinessTableService}=require('../../dist/nest/dynamic/business-table.service');const sql=new SqlService(db),reader=new DbReaderService(sql);const service=new BusinessTableService(db,sql,reader,{initializeModuleConfig:async()=>{throw new Error('configuration failed');}});
  await expect(service.createBusinessTable({table_name:name,fields:[{name:'title',type:'text'}]})).rejects.toThrow('configuration failed');expect(await reader.tableExists('biz_'+name)).toBe(false);
 });
});
