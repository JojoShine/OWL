const {bindNamed}=require('../../dist/nest/dynamic/sql.service');
describe('PostgreSQL named parameters',()=>{
 it('binds values without treating literals, comments or casts as parameters',()=>{
  const source="SELECT :value::text, ':literal', $$:body$$, \"colon:name\" -- :comment\n/* outer /* :nested */ :ignored */ WHERE id IN (:ids) AND name=:value";
  const bound=bindNamed(source,{value:"x'; DROP TABLE users;--",ids:[1,2]});
  expect(bound.values).toEqual(["x'; DROP TABLE users;--",1,2]);
  expect(bound.text).toContain('$1::text');expect(bound.text).toContain('IN ($2, $3)');expect(bound.text).toContain("':literal'");expect(bound.text).toContain('$$:body$$');
 });
 it('rejects missing parameters and binds an empty list as NULL',()=>{
  expect(()=>bindNamed('SELECT :missing',{})).toThrow();
  expect(bindNamed('SELECT 1 WHERE id IN (:ids)',{ids:[]})).toEqual({text:'SELECT 1 WHERE id IN (NULL)',values:[]});
 });
});
it('reuses named placeholders so repeated GROUP BY expressions remain identical',()=>{
 expect(bindNamed('SELECT :value, :value',{value:'same'})).toEqual({text:'SELECT $1, $1',values:['same']});
});
it('binds positional import values and skips escaped strings',()=>{
 expect(bindNamed("SELECT ?, E'escaped\\\':literal', ?",['first','second'])).toEqual({text:"SELECT $1, E'escaped\\\':literal', $2",values:['first','second']});
});
it('keeps invalid ad-hoc SQL as a client error',async()=>{
 const {ApiBuilderService}=require('../../dist/nest/dynamic/api-builder.service');
 const service=new ApiBuilderService({}, {rows:async()=>{throw new Error('syntax error');}});
 await expect(service.testSql('SELECT bad syntax')).rejects.toMatchObject({status:400});
});
