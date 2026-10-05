import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { buildTree, live, pageRows } from '../identity/identity.helpers';
import { deleted, jsonValue, ownedFolder } from './storage.helpers';
import { FilePermissionsService } from './file-permissions.service';
@Injectable()
export class FoldersService {
 constructor(private readonly db:PrismaService){}
 private async relations(row:any,detail=false){
  return {...row,parent:row.parent_id?await this.db.owl_folders.findFirst({where:{id:row.parent_id,...live},select:{id:true,name:true}}):null,creator:await this.db.owl_users.findFirst({where:{id:row.created_by,...live},select:{id:true,username:true,real_name:true}}),...(detail?{children:await this.db.owl_folders.findMany({where:{parent_id:row.id,...live}})}:{})};
 }
 async getFolders(query:any,userId:string){
  const where:any={created_by:userId};if(query.search)where.name={contains:query.search,mode:'insensitive'};
  if(query.parent_id!==undefined)where.parent_id=query.parent_id==='null'?null:query.parent_id;
  const result=await pageRows(this.db.owl_folders,{limit:20,...query},where,['name'],'created_at','DESC');
  result.data=await Promise.all(result.data.map((row:any)=>this.relations(row)));return result;
 }
 async getFolderTree(userId:string){return buildTree(await this.db.owl_folders.findMany({where:{created_by:userId,...live},orderBy:{name:'asc'}}));}
 async getFolderById(id:string,userId:string){return this.relations(await ownedFolder(this.db,id,userId),true);}
 async getFolderContents(id:string,userId:string,query:any={}){
  const folderId=['root','null'].includes(id)?null:id;
  if(folderId)await ownedFolder(this.db,folderId,userId);
  const direction=query.order?.toUpperCase()==='ASC'?'asc':'desc';
  const key=['created_at','updated_at','id','name','original_name'].includes(query.sort)?query.sort:'created_at';
  const sort=key==='created_at'?'createdAt':key==='updated_at'?'updatedAt':key;
  const folders=await this.db.owl_folders.findMany({where:{created_by:userId,parent_id:folderId,...live,...(query.search?{name:{contains:query.search,mode:'insensitive'}}:{})},orderBy:{[sort==='original_name'?'name':sort]:direction}});
  const files=await this.db.owl_files.findMany({where:{uploaded_by:userId,folder_id:folderId,...live,...(query.search?{original_name:{contains:query.search,mode:'insensitive'}}:{})},orderBy:{[sort==='name'?'original_name':sort]:direction}});
  return jsonValue({folders,files,total:folders.length+files.length});
 }
 private async save(body:any,userId:string,id?:string){
  const result=await this.db.$transaction(async tx=>{
   const previous=id?await ownedFolder(tx,id,userId):null;
   const parentId=body.parent_id===undefined?previous?.parent_id||null:body.parent_id;
   if(parentId){
    let parent:any=await ownedFolder(tx,parentId,userId);const seen=new Set<string>();
    while(parent){if(parent.id===id||seen.has(parent.id))throw new BadRequestException('不能将文件夹的父级设置为自己或自己的子级');seen.add(parent.id);parent=parent.parent_id?await ownedFolder(tx,parent.parent_id,userId):null;}
   }
   const name=body.name??previous?.name;
   if(await tx.owl_folders.findFirst({where:{created_by:userId,parent_id:parentId,name,...live,...(id?{id:{not:id}}:{})}}))throw new BadRequestException('同级已存在同名文件夹');
   const data={name,parent_id:parentId,updatedAt:new Date()};
   const row=id?await tx.owl_folders.update({where:{id},data}):await tx.owl_folders.create({data:{...data,created_by:userId}});
   if(!id)await new FilePermissionsService(tx as PrismaService).setDefaultPermissions('folder',row.id,userId);
   return row;
  });
  return this.getFolderById(result.id,userId);
 }
 createFolder(body:any,userId:string){return this.save(body,userId);}
 updateFolder(id:string,body:any,userId:string){return this.save(body,userId,id);}
 async deleteFolder(id:string,userId:string){
  await this.db.$transaction(async tx=>{
   await ownedFolder(tx,id,userId);
   const children=await tx.owl_folders.count({where:{parent_id:id,created_by:userId,...live}});if(children)throw new BadRequestException(`该文件夹有 ${children} 个子文件夹，请先删除子文件夹`);
   const files=await tx.owl_files.count({where:{folder_id:id,uploaded_by:userId,...live}});if(files)throw new BadRequestException(`该文件夹有 ${files} 个文件，请先删除文件`);
   await tx.owl_file_permissions.updateMany({where:{resource_type:'folder',resource_id:id,...live},data:deleted()});
   await tx.owl_folders.update({where:{id},data:deleted()});
  });return {message:'文件夹删除成功'};
 }
}
