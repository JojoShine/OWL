const { FilePermissionsService } = require('../../dist/nest/storage/file-permissions.service');
const { SharesService } = require('../../dist/nest/storage/shares.service');
const { fileDto } = require('../../dist/nest/storage/storage.helpers');
it('serializes PostgreSQL file sizes without rounding or leaking BigInt into JSON',()=>{
 const file=fileDto({size:1024n,original_name:'photo.PNG'});
 expect(file.size).toBe('1024');expect(file.formatted_size).toBe('1.00 KB');expect(file.is_image).toBe(true);
 expect(()=>JSON.stringify(file)).not.toThrow();
 expect(fileDto({size:5n,original_name:'a.txt'}).formatted_size).toBe('5.00 B');
});
it('inherits ancestor grants and terminates cycles',async()=>{
 const db={owl_users:{findFirst:async()=>({id:'u'})},owl_user_roles:{findMany:async()=>[]},owl_roles:{findMany:async()=>[]},
 owl_file_permissions:{findMany:async({where})=>where.resource_id==='parent'?[{permission:'read'}]:[]},
 owl_folders:{findFirst:async({where})=>({id:where.id,parent_id:where.id==='child'?'parent':'child',inherit_permissions:true})}};
 const service=new FilePermissionsService(db);
 expect(await service.checkPermission('u','folder','child','read')).toBe(true);
 expect(await service.checkPermission('u','folder','child','write')).toBe(false);
});
it('rejects expired or deleted share targets before reading object storage',async()=>{
 const expired={file_id:'f',expires_at:new Date(0)};
 const service=new SharesService({owl_file_shares:{findFirst:async()=>expired}},{});
 await expect(service.getShareByCode('expired')).rejects.toMatchObject({status:400});
 const deleted=new SharesService({owl_file_shares:{findFirst:async()=>({...expired,expires_at:null})},owl_files:{findFirst:async()=>null}},{});
 await expect(deleted.downloadSharedFile('deleted')).rejects.toMatchObject({status:404});
});
