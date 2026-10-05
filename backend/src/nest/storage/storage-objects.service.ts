import { Injectable } from '@nestjs/common';
import { shared } from '../compatibility/shared';
@Injectable()
export class StorageObjects {
 get bucket():string{return shared('config/minio').BUCKET_NAME;}
 upload(path:string,buffer:Buffer,mime:string){return shared('config/minio').uploadFile(path,buffer,mime);}
 download(path:string){return shared('config/minio').downloadFile(path);}
 remove(path:string){return shared('config/minio').deleteFile(path);}
 copy(from:string,to:string){return shared('config/minio').copyFile(from,to);}
}
