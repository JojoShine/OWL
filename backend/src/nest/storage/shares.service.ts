import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { PrismaService } from '../database/prisma.service';
import { live } from '../identity/identity.helpers';
import { deleted, jsonValue, ownedFile } from './storage.helpers';
import { StorageObjects } from './storage-objects.service';
@Injectable()
export class SharesService {
 constructor(private readonly db:PrismaService,private readonly objects:StorageObjects){}
 async createShare(body:any,userId:string){
  await ownedFile(this.db,body.file_id,userId);
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code:string;
  do{code=Array.from({length:8},()=>alphabet[randomInt(alphabet.length)]).join('');}while(await this.db.owl_file_shares.findFirst({where:{share_code:code,...live}}));
  const row=await this.db.owl_file_shares.create({data:{file_id:body.file_id,created_by:userId,share_code:code,expires_at:body.expires_in_hours?new Date(Date.now()+body.expires_in_hours*3600000):null}});
  return this.getShareById(row.id,userId);
 }
 async getShareByCode(code:string){
  const share=await this.db.owl_file_shares.findFirst({where:{share_code:code,...live}});
  if(!share)throw new NotFoundException('分享不存在');
  if(share.expires_at&&share.expires_at.getTime()<Date.now())throw new BadRequestException('分享已过期');
  const file=await this.db.owl_files.findFirst({where:{id:share.file_id,...live},select:{id:true,original_name:true,mime_type:true,size:true,path:true}});
  if(!file)throw new NotFoundException('文件不存在');
  const creator=await this.db.owl_users.findFirst({where:{id:share.created_by,...live},select:{id:true,username:true,real_name:true}});
  return jsonValue({...share,file,creator});
 }
 async getShareById(id:string,userId:string){
  const share=await this.db.owl_file_shares.findFirst({where:{id,created_by:userId,...live}});
  if(!share)throw new NotFoundException('分享不存在');
  return jsonValue({...share,file:await this.db.owl_files.findFirst({where:{id:share.file_id,...live}})});
 }
 async getUserShares(userId:string){
  const shares=await this.db.owl_file_shares.findMany({where:{created_by:userId,...live},orderBy:{createdAt:'desc'}});
  return jsonValue(await Promise.all(shares.map(async row=>({...row,file:await this.db.owl_files.findFirst({where:{id:row.file_id,...live},select:{id:true,original_name:true,mime_type:true,size:true}})}))));
 }
 async downloadSharedFile(code:string){const share=await this.getShareByCode(code);return {stream:await this.objects.download(share.file.path),filename:share.file.original_name,mimeType:share.file.mime_type,size:share.file.size};}
 async deleteShare(id:string,userId:string){await this.getShareById(id,userId);await this.db.owl_file_shares.update({where:{id},data:deleted()});return {message:'分享删除成功'};}
}
