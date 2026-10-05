jest.mock('../../dist/shared/auth/captcha',()=>({}));
const {Test}=require('@nestjs/testing');
const {ExpressAdapter}=require('@nestjs/platform-express');
const {UnauthorizedException}=require('@nestjs/common');
const express=require('express');
const {NotificationController}=require('../../dist/nest/notification/notification.controller');
const {SettingsController}=require('../../dist/nest/notification/settings.controller');
const {NotificationsService}=require('../../dist/nest/notification/notifications.service');
const {NotificationSettingsService}=require('../../dist/nest/notification/settings.service');
const {NotificationSocket}=require('../../dist/nest/notification/socket.service');
const {AuthService}=require('../../dist/nest/identity/auth.service');
const {IdentityGuard}=require('../../dist/nest/identity/identity.guard');
const {CompatibleExceptionFilter}=require('../../dist/nest/compatibility/exception.filter');
const {AppModule}=require('../../dist/nest/app.module');
describe('native notification HTTP contracts',()=>{
 let app,base;
 beforeAll(async()=>{
  const controllers=Reflect.getMetadata('controllers',AppModule).filter(controller=>[SettingsController,NotificationController].includes(controller));
  const module=await Test.createTestingModule({controllers,providers:[IdentityGuard,
   {provide:AuthService,useValue:{authenticate:async token=>{if(!token)throw new UnauthorizedException();return {id:'user',roles:[{code:'user',permissions:[]}]};}}},
   {provide:NotificationsService,useValue:{getUnreadCount:async()=>2}},
   {provide:NotificationSettingsService,useValue:{getUserSettings:async()=>({push_enabled:true})}},
   {provide:NotificationSocket,useValue:{}},
  ]}).compile();
  app=module.createNestApplication(new ExpressAdapter(express()),{bodyParser:false});app.use(express.json());app.useGlobalFilters(new CompatibleExceptionFilter());await app.listen(0,'127.0.0.1');base=await app.getUrl();
 });
 afterAll(async()=>{await app?.close();});
 it('matches notification settings before the notification id route',async()=>{
  const response=await fetch(base+'/api/system/notifications/settings',{headers:{authorization:'Bearer test'}});
  expect(response.status).toBe(200);expect((await response.json()).data.push_enabled).toBe(true);
 });
 it('rejects anonymous reads and non-admin broadcasts',async()=>{
  expect((await fetch(base+'/api/system/notifications/unread-count')).status).toBe(401);
  expect((await fetch(base+'/api/system/notifications/broadcast',{method:'POST',headers:{authorization:'Bearer test'}})).status).toBe(403);
 });
});
