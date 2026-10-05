const {EmailTasksService}=require('../../dist/nest/notification/email-tasks.service');
const {EmailService}=require('../../dist/nest/notification/email.service');
const {NotificationSocket}=require('../../dist/nest/notification/socket.service');
const {ApiMonitorService}=require('../../dist/nest/monitor/api-monitor.service');
describe('notification runtime',()=>{
 it('records unavailable delivery as failed rather than successful',async()=>{
  const db={owl_email_logs:{create:jest.fn()}}, templates={getTemplateById:async()=>({subject:'test',content:'test'})};
  const email=new EmailService(db,templates,{available:false});
  const result=await email.sendEmailByTemplate('id',['test@example.invalid']);
  expect(result.successCount).toBe(0);expect(result.failedCount).toBe(1);
  expect(db.owl_email_logs.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:'failed'})}));
 });
 it('deduplicates task execution and drains on stop',async()=>{
  let finish;const send=new Promise(resolve=>finish=resolve);
  const db={owl_email_tasks:{findFirst:async()=>({enabled:true,template_id:'t',recipients:'test@example.invalid'}),updateMany:jest.fn()}};
  const email={sendEmailByTemplate:jest.fn(()=>send)},tasks=new EmailTasksService(db,email);
  const first=tasks.executeTask('a'),second=tasks.executeTask('a');
  await Promise.resolve();expect(email.sendEmailByTemplate).toHaveBeenCalledTimes(1);
  let stopped=false;const stop=tasks.stop().then(()=>stopped=true);await Promise.resolve();expect(stopped).toBe(false);
  finish({failedCount:0,successCount:1});await Promise.all([first,second,stop]);
  expect(db.owl_email_tasks.updateMany).toHaveBeenCalledTimes(1);
  await tasks.executeTask('a',true);expect(email.sendEmailByTemplate).toHaveBeenCalledTimes(1);
 });
 it('rejects sockets without tokens before looking up a user',async()=>{
  const next=jest.fn(),db={owl_users:{findFirst:jest.fn()}};
  await new NotificationSocket(db).authenticateSocket({handshake:{auth:{},query:{}}},next);
  expect(next.mock.calls[0][0]).toBeInstanceOf(Error);expect(db.owl_users.findFirst).not.toHaveBeenCalled();
 });
 it('rejects signed sockets without an identity before any database lookup',async()=>{
  const jwt=require('jsonwebtoken'),previous=process.env.JWT_SECRET;process.env.JWT_SECRET='isolated-test';
  const db={owl_users:{findFirst:jest.fn(async()=>({id:'first-active',username:'first'}))}},next=jest.fn();
  try{await new NotificationSocket(db).authenticateSocket({handshake:{auth:{token:jwt.sign({},process.env.JWT_SECRET)}}},next);expect(next.mock.calls[0][0]).toBeInstanceOf(Error);expect(db.owl_users.findFirst).not.toHaveBeenCalled();}
  finally{if(previous===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previous;}
 });
 it('keeps in-flight execution tracked when its schedule is replaced',async()=>{
  const service=new ApiMonitorService({},{});let finish;
  const work=new Promise(resolve=>finish=resolve);service.executionQueues.set('id',work);service.scheduledJobs.set('id',{timer:null});
  service.stopScheduledJob('id');
  expect(service.executionQueues.get('id')).toBe(work);
  let drained=false;const drain=service.drain().then(()=>drained=true);await Promise.resolve();expect(drained).toBe(false);finish();await drain;
 });
 it('does not probe queued API monitors after shutdown',async()=>{
  const service=new ApiMonitorService({},{});
  service.stopAllScheduledJobs();
  service.getMonitorById=jest.fn(async()=>({id:'a',enabled:true,interval:60}));
  service.executeMonitor=jest.fn();
  await service.queueMonitorExecution({id:'a',interval:60});
  expect(service.executeMonitor).not.toHaveBeenCalled();
 });
});

it('drains initial port probes before the database disconnects',async()=>{
 const {ServerMonitorService}=require('../../dist/nest/monitor/server-monitor.service');
 let finish;
 const db={owl_server_monitors:{findFirst:async()=>({id:'server'})},owl_server_monitor_ports:{create:async()=>({id:'port',enabled:true})}};
 const service=new ServerMonitorService(db,{});
 service._runInitialPortCheck=()=>new Promise(resolve=>finish=resolve);
 await service.addPort('server',{});
 service.stopAllMonitoring();let stopped=false;const drain=service.drain().then(()=>stopped=true);await Promise.resolve();expect(stopped).toBe(false);finish();await drain;expect(stopped).toBe(true);
});
