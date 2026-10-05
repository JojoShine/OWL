const { Test } = require('@nestjs/testing');
const { ExpressAdapter } = require('@nestjs/platform-express');
const { UnauthorizedException } = require('@nestjs/common');
const express = require('express');
const { PermissionController } = require('../../dist/nest/identity/permission.controller');
const { PermissionsService } = require('../../dist/nest/identity/permissions.service');
const { AuthService } = require('../../dist/nest/identity/auth.service');
const { IdentityGuard } = require('../../dist/nest/identity/identity.guard');
const { CompatibleExceptionFilter } = require('../../dist/nest/compatibility/exception.filter');

describe('native identity HTTP contracts', () => {
  let app, base, canRead=true;
  beforeAll(async()=>{
    const module=await Test.createTestingModule({controllers:[PermissionController],providers:[IdentityGuard,
      {provide:AuthService,useValue:{authenticate:async token=>{
        if(!token) throw new UnauthorizedException('未提供认证token');
        return {id:'u1',roles:[{code:'user',permissions:canRead?[{resource:'permission',action:'read'}]:[]}]};
      }}},
      {provide:PermissionsService,useValue:{getResources:async()=>['user'],getActions:async()=>['read'],getCategories:async()=>['system'],getPermissionById:async()=>({id:'unused'})}},
    ]}).compile();
    app=module.createNestApplication(new ExpressAdapter(express()), {bodyParser:false});
    app.useGlobalFilters(new CompatibleExceptionFilter());
    await app.listen(0,'127.0.0.1');base=await app.getUrl();
  });
  afterAll(async()=>{await app?.close();});
  it('resolves static metadata routes before the :id route',async()=>{
    for(const [path,items] of [['resources',['user']],['actions',['read']],['categories',['system']]]){
      const res=await fetch(base+'/api/system/permissions/'+path,{headers:{authorization:'Bearer test'}});
      expect(res.status).toBe(200);
      expect((await res.json()).data).toEqual(items);
    }
  });
  it('keeps missing authentication and unauthorized writes rejected',async()=>{
    expect((await fetch(base+'/api/system/permissions/resources')).status).toBe(401);
    expect((await fetch(base+'/api/system/permissions',{method:'POST',headers:{authorization:'Bearer test'}})).status).toBe(403);
  });
  it('applies changed role permissions on the next request',async()=>{
    canRead=false;
    expect((await fetch(base+'/api/system/permissions/resources',{headers:{authorization:'Bearer test'}})).status).toBe(403);
    canRead=true;
  });
});
