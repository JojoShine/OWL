import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { live, requireRow, rolesFor } from '../identity/identity.helpers';
import { deleted, jsonValue } from './storage.helpers';
@Injectable()
export class FilePermissionsService {
 constructor(private readonly db:PrismaService){}
 async getEffectivePermissions(userId:string,type:string,id:string,seen=new Set<string>()):Promise<string[]>{
  if(!['file','folder'].includes(type)||seen.has(`${type}:${id}`))return [];
  seen.add(`${type}:${id}`);
  const model=type==='file'?this.db.owl_files:this.db.owl_folders;
  const resource:any=await (model as any).findFirst({where:{id,...live}});
  if(!resource)return [];
  const roles=await rolesFor(this.db,userId);
  const grants=await this.db.owl_file_permissions.findMany({where:{resource_type:type,resource_id:id,...live,OR:[{user_id:userId},{role_id:{in:roles.map(role=>role.id)}}]}});
  const permissions=new Set(grants.map(grant=>grant.permission));
  const parent=type==='file'?resource.folder_id:resource.parent_id;
  if(resource.inherit_permissions&&parent) for(const permission of await this.getEffectivePermissions(userId,'folder',parent,seen))permissions.add(permission);
  return [...permissions];
 }
 async checkPermission(userId:string,type:string,id:string,required='read'){
  const levels:Record<string,number>={read:1,write:2,delete:3,admin:4};
  if(!levels[required])return false;
  try{return (await this.getEffectivePermissions(userId,type,id)).some(permission=>(levels[permission]||0)>=levels[required]);}catch{return false;}
 }
 getPermissionById(id:string){return requireRow(this.db.owl_file_permissions,id,'权限');}
 async getPermissions(type:string,id:string){
  const rows=await this.db.owl_file_permissions.findMany({where:{resource_type:type,resource_id:id,...live},orderBy:{createdAt:'desc'}});
  return Promise.all(rows.map(async row=>({...row,user:row.user_id?await this.db.owl_users.findFirst({where:{id:row.user_id,...live},select:{id:true,username:true,real_name:true}}):null,role:row.role_id?await this.db.owl_roles.findFirst({where:{id:row.role_id,...live},select:{id:true,code:true,name:true}}):null})));
 }
 async addPermission(type:string,id:string,{userId,roleId,permission}:any,grantedBy:string){
  if(!['file','folder'].includes(type))throw new BadRequestException('无效的资源类型');
  if((!userId&&!roleId)||(userId&&roleId))throw new BadRequestException('必须指定用户或角色，但不能同时指定');
  if(!['read','write','delete','admin'].includes(permission))throw new BadRequestException('无效的权限类型');
  const where={resource_type:type,resource_id:id,...live,...(userId?{user_id:userId}:{role_id:roleId})};
  const existing=await this.db.owl_file_permissions.findFirst({where});
  const data={permission,granted_by:grantedBy,updatedAt:new Date()};
  return existing?this.db.owl_file_permissions.update({where:{id:existing.id},data}):this.db.owl_file_permissions.create({data:{resource_type:type,resource_id:id,user_id:userId,role_id:roleId,...data}});
 }
 async deletePermission(id:string){await this.getPermissionById(id);await this.db.owl_file_permissions.update({where:{id},data:deleted()});return true;}
 async setInheritPermissions(type:string,id:string,inherit:boolean){
  if(!['file','folder'].includes(type)||typeof inherit!=='boolean')throw new BadRequestException('无效的继承设置');
  const model:any=type==='file'?this.db.owl_files:this.db.owl_folders;
  await requireRow(model,id,'资源');
  return jsonValue(await model.update({where:{id},data:{inherit_permissions:inherit,updatedAt:new Date()}}));
 }
 async deleteResourcePermissions(type:string,id:string){return (await this.db.owl_file_permissions.updateMany({where:{resource_type:type,resource_id:id,...live},data:deleted()})).count;}
 async setDefaultPermissions(type:string,id:string,creator:string){
  await this.addPermission(type,id,{userId:creator,permission:'admin'},creator);
  const roles=await this.db.owl_roles.findMany({where:{code:{in:['super_admin','admin']},...live}});
  for(const role of roles)await this.addPermission(type,id,{roleId:role.id,permission:'admin'},creator);
 }
}
