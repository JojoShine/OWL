import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { live, requireRow } from '../identity/identity.helpers';
import { shared } from '../compatibility/shared';
function publicKey(row:any){const {secret_ciphertext,secret_iv,secret_auth_tag,...result}=row;return result;}
@Injectable()
export class ThirdPartyKeysService {
 constructor(private readonly db:PrismaService){}
 async listKeys({page=1,pageSize=10,client_name='',status=''}:any){
  const where:any={...live};if(client_name.trim())where.client_name={contains:client_name.trim(),mode:'insensitive'};if(status.trim())where.status=status;
  const [total,rows]=await Promise.all([this.db.owl_third_party_api_keys.count({where}),this.db.owl_third_party_api_keys.findMany({where,skip:(page-1)*pageSize,take:pageSize,orderBy:{createdAt:'desc'}})]);
  return {rows:rows.map(publicKey),total,page,pageSize};
 }
 async getKey(id:string){return publicKey(await requireRow(this.db.owl_third_party_api_keys,id,'第三方签名密钥'));}
 async createKey(body:any,userId:string){
  const api_key=`tpk_${randomBytes(12).toString('hex')}`,api_secret=randomBytes(32).toString('hex');
  const row=await this.db.owl_third_party_api_keys.create({data:{api_key,...shared('security/third-party-crypto').encryptSecret(api_secret),client_name:body.client_name.trim(),description:body.description||'',expires_at:body.expires_at?new Date(body.expires_at):null,remark:body.remark||'',scopes:body.scopes,status:'active',created_by:userId}});
  return {id:row.id,api_key,api_secret,client_name:row.client_name,scopes:row.scopes,status:row.status,created_at:row.createdAt};
 }
 async updateKey(id:string,body:any,userId:string){
  const row=await requireRow(this.db.owl_third_party_api_keys,id,'第三方签名密钥');
  await this.db.owl_third_party_api_keys.update({where:{id},data:{client_name:body.client_name?.trim()||row.client_name,description:body.description??row.description,remark:body.remark??row.remark,scopes:body.scopes??row.scopes,expires_at:body.expires_at===undefined?row.expires_at:body.expires_at?new Date(body.expires_at):null,updated_by:userId,updatedAt:new Date()}});return this.getKey(id);
 }
 async changeStatus(id:string,status:string,userId:string){await requireRow(this.db.owl_third_party_api_keys,id,'第三方签名密钥');return publicKey(await this.db.owl_third_party_api_keys.update({where:{id},data:{status,updated_by:userId,updatedAt:new Date()}}));}
 async regenerateSecret(id:string,userId:string){
  const row=await requireRow(this.db.owl_third_party_api_keys,id,'第三方签名密钥'),api_secret=randomBytes(32).toString('hex');
  await this.db.owl_third_party_api_keys.update({where:{id},data:{...shared('security/third-party-crypto').encryptSecret(api_secret),updated_by:userId,updatedAt:new Date()}});
  return {api_key:row.api_key,api_secret,client_name:row.client_name,scopes:row.scopes,status:row.status};
 }
 async deleteKey(id:string,userId:string){await requireRow(this.db.owl_third_party_api_keys,id,'第三方签名密钥');await this.db.owl_third_party_api_keys.update({where:{id},data:{deletedAt:new Date(),updatedAt:new Date(),deleted_by:userId}});}
 listScopes(){return shared('security/third-party-scopes').THIRD_PARTY_SCOPES;}
}
