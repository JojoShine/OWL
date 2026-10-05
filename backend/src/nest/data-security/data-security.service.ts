import { BadRequestException, Injectable, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '../../generated/prisma/client';
import { live, pageRows, pick, requireRow, searchWhere } from '../identity/identity.helpers';
import { deleted } from '../storage/storage.helpers';
import { SecurityEffects } from './security.effects';
const bcrypt=require('bcryptjs');
@Injectable()
export class DataSecurityService {
 constructor(private readonly db:PrismaService,private readonly effects:SecurityEffects){}
 getSensitiveFields(query:any){
  const where:any=searchWhere(query,['field_name','table_name'],['mask_type','table_name']);
  if(query.is_active!==undefined)where.is_active=query.is_active===true||query.is_active==='true';
  return pageRows(this.db.owl_sensitive_fields,{limit:20,...query},where,['field_name','table_name','mask_type','is_active'],'created_at','DESC');
 }
 getSensitiveFieldById(id:string){return requireRow(this.db.owl_sensitive_fields,id,'敏感字段配置');}
 async createSensitiveField(body:any){
  if(await this.db.owl_sensitive_fields.findFirst({where:{table_name:body.table_name,field_name:body.field_name,...live}}))throw new BadRequestException('该表的该字段已配置为敏感字段');
  const row=await this.db.owl_sensitive_fields.create({data:{table_name:body.table_name,field_name:body.field_name,mask_type:body.mask_type||'custom',mask_rule:body.mask_rule===null?Prisma.DbNull:body.mask_rule,description:body.description,is_active:body.is_active!==false}});
  this.effects.invalidate();return row;
 }
 async updateSensitiveField(id:string,body:any){
  await this.getSensitiveFieldById(id);
  const data:any={...pick(body,['mask_type','mask_rule','description','is_active']),updatedAt:new Date()};
  if(body.table_name)data.table_name=body.table_name;
  if(data.mask_rule===null)data.mask_rule=Prisma.DbNull;
  const row=await this.db.owl_sensitive_fields.update({where:{id},data});this.effects.invalidate();return row;
 }
 async deleteSensitiveField(id:string){await this.getSensitiveFieldById(id);await this.db.owl_sensitive_fields.update({where:{id},data:deleted()});this.effects.invalidate();return true;}
 async batchImportSensitiveFields(fields:any[]){
  const result:{success:number;failed:number;errors:any[]}={success:0,failed:0,errors:[]};
  for(const field of fields){try{await this.createSensitiveField(field);result.success++;}catch(error:any){result.failed++;result.errors.push({field:`${field.table_name}.${field.field_name}`,error:error.message});}}return result;
 }
 async validatePasswordWithAttempts(id:string,password:string,info:any){
  const user=await requireRow(this.db.owl_users,id,'用户');
  if(!user.password||!await bcrypt.compare(password,user.password)){
   this.effects.audit({type:'sensitive_data_access',action:'password_verify_failed',user_id:id,username:user.username,ip_address:info.ipAddress,user_agent:info.userAgent});
   throw new UnauthorizedException('密码错误');
  }return user;
 }
 async requestPlainAccess(id:string,body:any,info:any){
  if(!this.effects.available)throw new ServiceUnavailableException('Redis服务不可用，暂时无法申请明文访问权限');
  const user=await this.validatePasswordWithAttempts(id,body.password,info);
  const ttl=Number.parseInt(process.env.PLAIN_ACCESS_EXPIRY||'600')||600;
  const data={userId:id,username:user.username,tableName:body.table_name,fieldName:body.field_name,recordId:body.record_id,reason:body.reason,grantedAt:new Date().toISOString(),expiresAt:new Date(Date.now()+ttl*1000).toISOString()};
  await this.effects.grant([`plain_access:${id}:${body.table_name}:${body.field_name}:${body.record_id}`,`plain_access:${id}:*:${body.field_name}:${body.record_id}`],ttl,data);
  this.effects.audit({type:'sensitive_data_access',action:'plain_access_granted',user_id:id,username:user.username,table_name:body.table_name,field_name:body.field_name,record_id:body.record_id,reason:body.reason,ip_address:info.ipAddress,user_agent:info.userAgent,expires_at:data.expiresAt,access_level:'record'});
  return {success:true,message:`已授权查看该记录的明文，有效期${ttl}秒`,expiresAt:data.expiresAt};
 }
 checkPlainAccessPermission(id:string,table:string,field:string,record:string){return this.effects.check(id,table,field,record);}
 async getStatistics(){
  const rows=await this.db.owl_sensitive_fields.findMany({where:live,select:{table_name:true,is_active:true}}),tables=new Map<string,number>();
  for(const row of rows)tables.set(row.table_name,(tables.get(row.table_name)||0)+1);
  return {total:rows.length,active:rows.filter(row=>row.is_active).length,inactive:rows.filter(row=>!row.is_active).length,byTable:[...tables].map(([tableName,count])=>({tableName,count})).sort((a,b)=>b.count-a.count)};
 }
}
