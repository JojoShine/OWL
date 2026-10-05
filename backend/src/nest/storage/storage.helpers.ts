import { NotFoundException } from '@nestjs/common';
import { live } from '../identity/identity.helpers';
export const jsonValue = (value:any):any => JSON.parse(JSON.stringify(value,(_key,item)=>typeof item==='bigint'?item.toString():item));
export function fileDto(file:any){
 const value=jsonValue(file); const parts=(value.original_name||'').split('.'); const extension=parts.length>1?parts.pop().toLowerCase():'';
 let size=Number(value.size||0),index=0; const units=['B','KB','MB','GB','TB'];
 while(size>=1024&&index<units.length-1){size/=1024;index++;}
 return {...value,formatted_size:`${size.toFixed(2)} ${units[index]}`,extension,is_image:['jpg','jpeg','png','gif','bmp','webp','svg'].includes(extension),is_video:['mp4','avi','mov','wmv','flv','webm','mkv'].includes(extension),is_pdf:extension==='pdf'};
}
export async function ownedFile(db:any,id:string,userId:string){const file=await db.owl_files.findFirst({where:{id,uploaded_by:userId,...live}});if(!file)throw new NotFoundException('文件不存在');return file;}
export async function ownedFolder(db:any,id:string,userId:string){const folder=await db.owl_folders.findFirst({where:{id,created_by:userId,...live}});if(!folder)throw new NotFoundException('文件夹不存在');return folder;}
export const deleted = ()=>({deletedAt:new Date(),updatedAt:new Date()});
