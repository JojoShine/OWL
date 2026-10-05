import { MaskingService } from './masking.service';
import { Injectable } from '@nestjs/common';
import { shared } from '../compatibility/shared';
@Injectable()
export class SecurityEffects {
 constructor(private readonly masking: MaskingService) {}
 invalidate(){this.masking.invalidate();}
 audit(data:any){shared('config/logger').logger.info(JSON.stringify({...data,timestamp:new Date().toISOString()}));}
 get available():boolean{return shared('config/redis').isRedisAvailable();}
 async grant(keys:string[],ttl:number,value:any){
  const redis=shared('config/redis').redisClient;
  const transaction=redis.multi();for(const key of keys)transaction.setEx(key,ttl,JSON.stringify(value));await transaction.exec();
  shared('config/logger').databaseAccessLogger.info(JSON.stringify({type:'redis',action:'set',business_type:'plain_access_grant',keys,ttl,user_id:value.userId,record_id:value.recordId,timestamp:new Date().toISOString()}));
 }
 check(userId:string,table:string,field:string,record:string){return new (shared('utils/plain-access-cache'))().checkPlainAccessPermission(userId,table,field,record);}
}
