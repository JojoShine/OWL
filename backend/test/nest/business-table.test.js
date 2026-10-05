const {BusinessTableService}=require('../../dist/nest/dynamic/business-table.service');
const fields=[{name:'customer_name',type:'string',nullable:false}];
function fixture(){const tx={},sql={execute:jest.fn(async()=>0)},reader={tableExists:jest.fn(async()=>false)},configs={initializeModuleConfig:jest.fn(async()=>({id:'module-1'}))},db={$transaction:work=>work(tx)};return {tx,sql,reader,configs,service:new BusinessTableService(db,sql,reader,configs)};}
it('normalizes the business prefix and creates configuration in the same transaction',async()=>{
 const {tx,sql,reader,configs,service}=fixture();const result=await service.createBusinessTable({table_name:'customer',fields:[{...fields[0],unique:true}]},'user-1');
 expect(result.tableName).toBe('biz_customer');expect(reader.tableExists).toHaveBeenCalledWith('biz_customer',{transaction:tx});
 expect(sql.execute).toHaveBeenCalledWith(expect.stringContaining('"customer_name" varchar(255) NOT NULL UNIQUE'),{},tx);
 expect(configs.initializeModuleConfig).toHaveBeenCalledWith('biz_customer',{transaction:tx,userId:'user-1'});
});
it.each([[{table_name:'biz_customer',fields},'biz_ 后面的名称'],[{table_name:'customer',fields:[{name:'created_at',type:'string'}]},'系统字段'],[{table_name:'customer',fields:[{name:'payload',type:'sql'}]},'字段类型'],[{table_name:'customer',fields:[...fields,...fields]},'重复']])('rejects unsafe definitions before executing DDL',async(definition,message)=>{
 const {service,sql}=fixture();await expect(service.createBusinessTable(definition,'u')).rejects.toThrow(message);expect(sql.execute).not.toHaveBeenCalled();
});
it('rejects existing business tables without writing',async()=>{
 const {service,reader,sql}=fixture();reader.tableExists.mockResolvedValue(true);await expect(service.createBusinessTable({table_name:'customer',fields},'u')).rejects.toMatchObject({statusCode:409});expect(sql.execute).not.toHaveBeenCalled();
});
