import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { StorageObjects } from './storage-objects.service';
@Injectable()
export class UploadsService {
 constructor(private readonly objects:StorageObjects){}
 async uploadFile(buffer:Buffer,name:string,mime:string,category:string,userId:string|null){
  if(!['logo','background','normal'].includes(category))throw new BadRequestException('无效的文件分类，支持: logo, background, normal');
  if(category==='normal'&&!userId)throw new BadRequestException('normal 类型上传需要提供用户ID');
  const filename=randomUUID()+extname(name),date=new Date();
  const path=category==='logo'?`logos/${filename}`:category==='background'?`backgrounds/${filename}`:`users/${userId}/${date.getFullYear()}/${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}/${filename}`;
  await this.objects.upload(path,buffer,mime);return `${this.objects.bucket}/${path}`;
 }
 async getFileStream(path:string){
  if(!path||typeof path!=='string')throw new BadRequestException('文件路径不能为空');
  const parts=path.split('/'),objectPath=parts.length>1?parts.slice(1).join('/'):path;
  try{return {stream:await this.objects.download(objectPath),objectPath};}catch{throw new NotFoundException('文件不存在');}
 }
}
