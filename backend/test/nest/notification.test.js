const {NotificationsService}=require('../../dist/nest/notification/notifications.service');
const {NotificationSettingsService}=require('../../dist/nest/notification/settings.service');
describe('native notifications',()=>{
  it('never reads another user’s notification',async()=>{
    const db={owl_notifications:{findFirst:jest.fn(async()=>null)}};
    await expect(new NotificationsService(db).getNotificationById('id','owner')).rejects.toMatchObject({status:404});
    expect(db.owl_notifications.findFirst).toHaveBeenCalledWith({where:{id:'id',user_id:'owner',deletedAt:null}});
  });
  it('honors push and category preferences',async()=>{
    const db={owl_notification_settings:{findFirst:async()=>({push_enabled:true,warning_notification:false})}};
    const settings=new NotificationSettingsService(db);
    expect(await settings.isNotificationEnabled('u','warning')).toBe(false);
    expect(await settings.isNotificationEnabled('u','info')).toBe(true);
  });
});
