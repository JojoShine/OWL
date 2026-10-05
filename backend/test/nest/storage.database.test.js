const enabled = process.env.OWL_DATABASE_TEST === '1';
(enabled ? describe : describe.skip)('storage and security PostgreSQL integration', () => {
  let db;
  beforeAll(async () => {
    require('dotenv').config();
    process.env.DB_NAME_TEST = process.env.DB_NAME;
    const { PrismaService } = require('../../dist/nest/database/prisma.service');
    db = new PrismaService(); await db.$connect();
  });
  afterAll(async () => { await db?.$disconnect(); });
  it('maps existing PostgreSQL rows without altering stored data', async () => { await require('./postgres-contract').assertRowsMatchPostgres(db, ["owl_files","owl_folders","owl_file_shares","owl_file_permissions","owl_sensitive_fields","owl_third_party_api_keys"]); });
  it('preserves ownership, inherited permissions, shares and encrypted secrets through rollback', async () => {
    const { randomUUID, randomBytes } = require('node:crypto');
    const { Readable } = require('node:stream');
    const { UsersService } = require('../../dist/nest/identity/users.service');
    const { FilesService } = require('../../dist/nest/storage/files.service');
    const { FoldersService } = require('../../dist/nest/storage/folders.service');
    const { SharesService } = require('../../dist/nest/storage/shares.service');
    const { FilePermissionsService } = require('../../dist/nest/storage/file-permissions.service');
    const { DataSecurityService } = require('../../dist/nest/data-security/data-security.service');
    const { ThirdPartyKeysService } = require('../../dist/nest/data-security/third-party-keys.service');
    const crypto = require('../../dist/shared/security/third-party-crypto');
    const previousKey = process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY;
    process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY = randomBytes(32).toString('hex');
    const rollback = new Error('rollback storage fixtures'), suffix=randomUUID().slice(0,8);
    let fixture;
    const contents=new Map();
    const objects={bucket:'test',upload:async(path,buffer)=>contents.set(path,buffer),copy:async(from,to)=>contents.set(to,contents.get(from)),download:async(path)=>Readable.from(contents.get(path)),remove:async(path)=>contents.delete(path)};
    try {
      try { await db.$transaction(async tx => {
        let store; store=new Proxy(tx,{get(target,key){return key==='$transaction'?work=>work(store):Reflect.get(target,key);}});
        const users=new UsersService(store,{invalidateUser(){},invalidateRoles(){}});
        const owner=await users.createUser({username:'storage_'+suffix,email:suffix+'@test.invalid',password:'example-password'});
        const stranger=await users.createUser({username:'other_'+suffix,email:'other_'+suffix+'@test.invalid',password:'example-password'});
        fixture=owner.id;
        const acl=new FilePermissionsService(store), folders=new FoldersService(store), files=new FilesService(store,objects,acl), shares=new SharesService(store,objects);
        const parent=await folders.createFolder({name:'parent'},owner.id), child=await folders.createFolder({name:'child',parent_id:parent.id},owner.id);
        await expect(folders.updateFolder(parent.id,{parent_id:child.id},owner.id)).rejects.toMatchObject({status:400});
        await expect(folders.createFolder({name:'child',parent_id:parent.id},owner.id)).rejects.toMatchObject({status:400});
        await expect(folders.getFolderById(parent.id,stranger.id)).rejects.toMatchObject({status:404});
        const buffer=Buffer.alloc(2048,7), file=await files.uploadFile({originalname:'test.txt',mimetype:'text/plain',buffer,size:buffer.length,body:{folder_id:child.id}},owner.id);
        expect(file.size).toBe('2048'); expect(file.formatted_size).toBe('2.00 KB');
        expect(await acl.checkPermission(owner.id,'file',file.id,'admin')).toBe(true);
        await acl.addPermission('folder',parent.id,{userId:stranger.id,permission:'read'},owner.id);
        expect(await acl.checkPermission(stranger.id,'file',file.id,'read')).toBe(true);
        expect(await acl.checkPermission(stranger.id,'file',file.id,'write')).toBe(false);
        await acl.setInheritPermissions('file',file.id,false);
        expect(await acl.checkPermission(stranger.id,'file',file.id,'read')).toBe(false);
        await expect(files.getFileById(file.id,stranger.id)).rejects.toMatchObject({status:404});
        await expect(files.deleteFile(file.id,stranger.id)).rejects.toMatchObject({status:404});
        await expect(shares.createShare({file_id:file.id},stranger.id)).rejects.toMatchObject({status:404});
        const foreign=await folders.createFolder({name:'foreign'},stranger.id);
        await expect(files.moveFile(file.id,foreign.id,owner.id)).rejects.toMatchObject({status:404});
        await expect(folders.deleteFolder(child.id,owner.id)).rejects.toMatchObject({status:400});
        const copy=await files.copyFile(file.id,null,owner.id);
        expect(contents.get(copy.path)).toEqual(buffer);
        expect(await acl.checkPermission(owner.id,'file',copy.id,'admin')).toBe(true);
        expect((await files.getStorageStats(owner.id)).totalSize).toBe(4096);
        const share=await shares.createShare({file_id:file.id,expires_in_hours:1},owner.id);
        expect((await shares.getShareByCode(share.share_code)).file.id).toBe(file.id);
        await tx.owl_file_shares.update({where:{id:share.id},data:{expires_at:new Date(0)}});
        await expect(shares.getShareByCode(share.share_code)).rejects.toMatchObject({status:400});
        await files.deleteFile(file.id,owner.id);
        expect(contents.has(file.path)).toBe(false);
        await expect(shares.getShareByCode(share.share_code)).rejects.toMatchObject({status:404});
        expect(await acl.checkPermission(owner.id,'file',file.id,'admin')).toBe(false);
        await folders.deleteFolder(child.id,owner.id);
        const effects={invalidate:jest.fn(),audit:jest.fn(),available:true,grant:jest.fn()};
        const security=new DataSecurityService(store,effects);
        const field=await security.createSensitiveField({table_name:'test_'+suffix,field_name:'phone',mask_type:'phone',is_active:false});
        expect((await security.getSensitiveFields({table_name:'test_'+suffix,is_active:false})).data.map(row=>row.id)).toContain(field.id);
        expect((await security.updateSensitiveField(field.id,{mask_rule:null,is_active:true})).mask_rule).toBeNull();
        await expect(security.requestPlainAccess(owner.id,{password:'wrong'},{})).rejects.toMatchObject({status:401});
        await security.requestPlainAccess(owner.id,{password:'example-password',table_name:'test',field_name:'phone',record_id:owner.id,reason:'test'},{});
        expect(effects.grant.mock.calls[0][0]).toEqual([`plain_access:${owner.id}:test:phone:${owner.id}`,`plain_access:${owner.id}:*:phone:${owner.id}`]);
        effects.available=false;
        await expect(security.requestPlainAccess(owner.id,{},{})).rejects.toMatchObject({status:503});
        const keys=new ThirdPartyKeysService(store), key=await keys.createKey({client_name:'test '+suffix,scopes:['data:read']},owner.id);
        expect(crypto.decryptSecret(await tx.owl_third_party_api_keys.findUnique({where:{id:key.id}}))).toBe(key.api_secret);
        for(const result of [await keys.getKey(key.id),(await keys.listKeys({client_name:suffix})).rows[0],await keys.changeStatus(key.id,'disabled',owner.id)]){
          for(const name of ['api_secret','secret_ciphertext','secret_iv','secret_auth_tag'])expect(result).not.toHaveProperty(name);
        }
        const rotated=await keys.regenerateSecret(key.id,owner.id);
        expect(rotated.api_secret).not.toBe(key.api_secret);
        expect(crypto.decryptSecret(await tx.owl_third_party_api_keys.findUnique({where:{id:key.id}}))).toBe(rotated.api_secret);
        await keys.deleteKey(key.id,owner.id);
        await expect(keys.getKey(key.id)).rejects.toMatchObject({status:404});
        throw rollback;
      },{timeout:30000}); } catch(error){if(error!==rollback)throw error;}
      expect(await db.owl_users.findUnique({where:{id:fixture}})).toBeNull();
    } finally {
      if(previousKey===undefined)delete process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY;else process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY=previousKey;
    }
  },40000);
});
