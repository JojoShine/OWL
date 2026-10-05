const {Test}=require('@nestjs/testing');
const {ExpressAdapter}=require('@nestjs/platform-express');
const {UnauthorizedException}=require('@nestjs/common');
const express=require('express');
const {FileController}=require('../../dist/nest/storage/file.controller');
const {FilePermissionController}=require('../../dist/nest/storage/file-permission.controller');
const {FilesService}=require('../../dist/nest/storage/files.service');
const {FilePermissionsService}=require('../../dist/nest/storage/file-permissions.service');
const {AuthService}=require('../../dist/nest/identity/auth.service');
const {IdentityGuard}=require('../../dist/nest/identity/identity.guard');
const {CompatibleExceptionFilter}=require('../../dist/nest/compatibility/exception.filter');
describe('native storage HTTP contracts',()=>{
  let app,base,admin=false;
  const id='b5f76a86-8b6f-4d4e-a480-7bb079a61496';
  const addPermission=jest.fn(async()=>({id}));
  beforeAll(async()=>{
    const module=await Test.createTestingModule({controllers:[FileController,FilePermissionController],providers:[IdentityGuard,
      {provide:AuthService,useValue:{authenticate:async token=>{if(!token)throw new UnauthorizedException();return {id,roles:[{code:'user',permissions:['read','update','create'].map(action=>({resource:'file',action}))}]};}}},
      {provide:FilesService,useValue:{getStorageStats:async()=>({totalSize:2048}),uploadMultipleFiles:async(files,body,userId)=>({success:files.length,name:files[0].originalname,size:files[0].size,userId})}},
      {provide:FilePermissionsService,useValue:{checkPermission:async()=>admin,addPermission}},
    ]}).compile();
    app=module.createNestApplication(new ExpressAdapter(express()),{bodyParser:false});
    app.use(express.json());app.useGlobalFilters(new CompatibleExceptionFilter());
    await app.listen(0,'127.0.0.1');base=await app.getUrl();
  });
  afterAll(async()=>{await app?.close();});
  it('resolves stats before id and rejects unauthenticated multipart uploads',async()=>{
    const stats=await fetch(base+'/api/system/files/stats',{headers:{authorization:'Bearer test'}});
    expect(stats.status).toBe(200);expect((await stats.json()).data.totalSize).toBe(2048);
    expect((await fetch(base+'/api/system/files/upload',{method:'POST'})).status).toBe(401);
  });
  it('parses multipart through the authorized native route',async()=>{
    const data=new FormData();data.append('files',new Blob(['file bytes'],{type:'text/plain'}),'test.txt');
    const response=await fetch(base+'/api/system/files/upload',{method:'POST',headers:{authorization:'Bearer test'},body:data});
    expect(response.status).toBe(201);expect((await response.json()).data).toMatchObject({success:1,name:'test.txt',size:10,userId:id});
  });
  it('requires resource admin permission and validates grant recipients',async()=>{
    const grant=body=>fetch(base+'/api/system/files/'+id+'/permissions',{method:'POST',headers:{authorization:'Bearer test','content-type':'application/json'},body:JSON.stringify(body)});
    expect((await grant({userId:id,permission:'read'})).status).toBe(403);
    expect(addPermission).not.toHaveBeenCalled();
    admin=true;
    expect((await grant({userId:id,roleId:id,permission:'read'})).status).toBe(422);
    const response=await grant({userId:id,permission:'read'});
    expect(response.status).toBe(200);expect((await response.json()).code).toBe(201);
    expect(addPermission).toHaveBeenCalledTimes(1);
  });
});
