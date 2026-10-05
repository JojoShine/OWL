const http=require('node:http');
const jwt=require('jsonwebtoken');
const {NotificationSocket}=require('../../dist/nest/notification/socket.service');
describe('native Socket authentication and lifecycle',()=>{
 let service,server,url,previous;
 beforeAll(async()=>{
  previous=process.env.JWT_SECRET;process.env.JWT_SECRET='isolated-socket-test-secret';
  service=new NotificationSocket({owl_users:{findFirst:async({where})=>where.id==='active'?{id:'active',username:'test'}:null}});
  server=http.createServer();service.initialize(server);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));url=`ws://127.0.0.1:${server.address().port}/socket.io/?EIO=4&transport=websocket`;
 });
 afterAll(async()=>{await service.close();if(previous===undefined)delete process.env.JWT_SECRET;else process.env.JWT_SECRET=previous;});
 async function connect(id){
  const client=new WebSocket(url);
  const outcome=await new Promise((resolve,reject)=>{
   client.onerror=reject;
   client.onmessage=event=>{
    const packet=String(event.data);
    if(packet.startsWith('0'))client.send('40'+JSON.stringify({token:jwt.sign({id},process.env.JWT_SECRET)}));
    if(packet.startsWith('44'))resolve({authorized:false});
    if(packet.startsWith('42')){const [name,data]=JSON.parse(packet.slice(2));if(name==='connected')resolve({authorized:true,data});}
   };
  });
  return {client,outcome};
 }
 it('isolates authenticated rooms, rejects disabled users, and clears connections on shutdown',async()=>{
  const active=await connect('active');expect(active.outcome.authorized).toBe(true);expect(service.isUserOnline('active')).toBe(true);
  const invalid=await connect('disabled');expect(invalid.outcome.authorized).toBe(false);invalid.client.close();
  const notification=new Promise(resolve=>{active.client.onmessage=event=>{const packet=String(event.data);if(packet.startsWith('42'))resolve(JSON.parse(packet.slice(2)));};});
  service.pushNotification('active',{id:'test-notification'});expect(await notification).toEqual(['notification',{id:'test-notification'}]);
  await service.close();expect(service.isUserOnline('active')).toBe(false);active.client.close();
 });
});
