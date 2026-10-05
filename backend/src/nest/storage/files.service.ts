import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, pageRows } from '../identity/identity.helpers';
import { shared } from '../compatibility/shared';
import { FilePermissionsService } from './file-permissions.service';
import { StorageObjects } from './storage-objects.service';
import { deleted, fileDto, ownedFile, ownedFolder } from './storage.helpers';
@Injectable()
export class FilesService {
 constructor(private readonly db:PrismaService,private readonly objects:StorageObjects,private readonly permissions:FilePermissionsService){}
 private async withRelations(file:any){
  const [folder,uploader]=await Promise.all([file.folder_id?this.db.owl_folders.findFirst({where:{id:file.folder_id,...live},select:{id:true,name:true}}):null,this.db.owl_users.findFirst({where:{id:file.uploaded_by,...live},select:{id:true,username:true,real_name:true}})]);
  return fileDto({...file,folder,uploader});
 }
 async getFiles(query:any,userId:string){
  const where:any={uploaded_by:userId};
  if(query.search)where.original_name={contains:query.search,mode:'insensitive'};
  if(query.folder_id!==undefined)where.folder_id=query.folder_id==='null'?null:query.folder_id;
  if(query.mime_type)where.mime_type={contains:query.mime_type,mode:'insensitive'};
  if(query.category)where.mime_type={in:this.getCategoryMimeTypes(query.category)};
  const result=await pageRows(this.db.owl_files,{limit:20,...query,sort:query.sort==='file_size'?'size':query.sort},where,['original_name','mime_type','size'],'created_at','DESC');
  result.data=await Promise.all(result.data.map((row:any)=>this.withRelations(row)));
  return result;
 }
 async getFileById(id:string,userId:string){return this.withRelations(await ownedFile(this.db,id,userId));}
 async getPublicFile(id:string){const file=await this.db.owl_files.findFirst({where:{id,...live}});if(!file)throw new NotFoundException('文件不存在');return file;}
 private async validateFolder(id:string|null|undefined,userId:string){if(id&&id!=='null')await ownedFolder(this.db,id,userId);}
 async uploadFile(file:any,userId:string){
  const folder=file.body?.folder_id||null;
  await this.validateFolder(folder,userId);
  const util=shared('utils/file'),filename=util.generateUniqueFilename(file.originalname),path=util.generateFilePath(userId,filename);
  await this.objects.upload(path,file.buffer,file.mimetype);
  let row:any;
  try{row=await this.db.$transaction(async tx=>{
   const created=await tx.owl_files.create({data:{filename,original_name:file.originalname,mime_type:file.mimetype,size:file.size,path,bucket:this.objects.bucket,folder_id:folder==='null'?null:folder,uploaded_by:userId}});
   await new FilePermissionsService(tx as PrismaService).setDefaultPermissions('file',created.id,userId);
   return created;
  });}catch(error){await this.objects.remove(path).catch(()=>{});throw error;}
  return this.getFileById(row.id,userId);
 }
 async uploadMultipleFiles(files:any[],body:any,userId:string){
  await this.validateFolder(body.folder_id,userId);
  const uploaded:any[]=[],errors:any[]=[];
  for(const file of files){try{uploaded.push(await this.uploadFile({...file,body},userId));}catch(error:any){errors.push({filename:file.originalname,error:error.message});}}
  return {uploaded,errors,total:files.length,success:uploaded.length,failed:errors.length};
 }
 async downloadFile(id:string,userId:string){const file=await ownedFile(this.db,id,userId);return {stream:await this.objects.download(file.path),filename:file.original_name,mimeType:file.mime_type,size:file.size?.toString()};}
 async updateFile(id:string,body:any,userId:string){const file=await ownedFile(this.db,id,userId);await this.db.owl_files.update({where:{id},data:{original_name:body.original_name||file.original_name,updatedAt:new Date()}});return this.getFileById(id,userId);}
 async deleteFile(id:string,userId:string){
  const file=await ownedFile(this.db,id,userId);
  await this.objects.remove(file.path);
  await this.db.$transaction(async tx=>{
   await tx.owl_file_shares.updateMany({where:{file_id:id,...live},data:deleted()});
   await tx.owl_file_permissions.updateMany({where:{resource_type:'file',resource_id:id,...live},data:deleted()});
   await tx.owl_files.update({where:{id},data:deleted()});
  });
  return {message:'文件删除成功'};
 }
 async batchDeleteFiles(ids:string[],userId:string){
  const files=await this.db.owl_files.findMany({where:{id:{in:ids},uploaded_by:userId,...live}});
  if(!files.length)throw new NotFoundException('未找到可删除的文件');
  const removed:string[]=[],errors:any[]=[];
  for(const file of files){try{await this.deleteFile(file.id,userId);removed.push(file.id);}catch(error:any){errors.push({id:file.id,filename:file.original_name,error:error.message});}}
  return {deleted:removed,errors,total:ids.length,success:removed.length,failed:errors.length};
 }
 async moveFile(id:string,folderId:string|null,userId:string){
  await ownedFile(this.db,id,userId);await this.validateFolder(folderId,userId);
  await this.db.owl_files.update({where:{id},data:{folder_id:folderId==='null'?null:folderId,updatedAt:new Date()}});return this.getFileById(id,userId);
 }
 async copyFile(id:string,folderId:string|null,userId:string){
  const file=await ownedFile(this.db,id,userId);await this.validateFolder(folderId,userId);
  const util=shared('utils/file'),filename=util.generateUniqueFilename(file.original_name),path=util.generateFilePath(userId,filename);
  await this.objects.copy(file.path,path);
  let row:any;
  try{row=await this.db.$transaction(async tx=>{
   const created=await tx.owl_files.create({data:{filename,original_name:`${file.original_name} (副本)`,mime_type:file.mime_type,size:file.size,path,bucket:this.objects.bucket,folder_id:folderId==='null'?null:folderId,uploaded_by:userId}});
   await new FilePermissionsService(tx as PrismaService).setDefaultPermissions('file',created.id,userId);
   return created;
  });}catch(error){await this.objects.remove(path).catch(()=>{});throw error;}
  return this.getFileById(row.id,userId);
 }
 async getStorageStats(userId:string){
  const files=await this.db.owl_files.findMany({where:{uploaded_by:userId,...live},select:{mime_type:true,size:true}});
  const categoryStats:Record<string,{count:number,size:number}>={};let totalSize=0;
  for(const file of files){const category=shared('utils/file').getFileCategory(file.mime_type);const size=Number(file.size||0);totalSize+=size;(categoryStats[category]||={count:0,size:0}).count++;categoryStats[category].size+=size;}
  return {totalFiles:files.length,totalFolders:await this.db.owl_folders.count({where:{created_by:userId,...live}}),totalSize,categoryStats};
 }
  getCategoryMimeTypes(category: string) {
    const categoryMap: Record<string, string[]> = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
      video: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-flv', 'video/webm', 'video/x-matroska'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/webm'],
      archive: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/x-tar', 'application/gzip'],
      text: ['text/plain', 'text/csv', 'text/html', 'text/css', 'text/javascript'],
    };

    return categoryMap[category] || [];
  }
}
