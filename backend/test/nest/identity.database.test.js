// Opt-in: existing local database; fixtures are rolled back, never reset the database.
const enabled = process.env.OWL_DATABASE_TEST === '1';
(enabled ? describe : describe.skip)('identity PostgreSQL integration', () => {
  let db;
  beforeAll(async () => {
    require('dotenv').config();
    process.env.DB_NAME_TEST = process.env.DB_NAME;
    const { PrismaService } = require('../../dist/nest/database/prisma.service');
    db = new PrismaService(); await db.$connect();
  });
  afterAll(async () => { await db?.$disconnect(); });
  it('maps existing PostgreSQL rows without altering stored data', async () => { await require('./postgres-contract').assertRowsMatchPostgres(db, ["owl_users","owl_roles","owl_permissions","owl_menus","owl_departments"]); });
  it('preserves hashes, transactional role updates, ancestry, sessions and soft deletion', async () => {
    const { randomUUID } = require('node:crypto');
    const bcrypt = require('bcryptjs');
    const { UsersService } = require('../../dist/nest/identity/users.service');
    const { RolesService } = require('../../dist/nest/identity/roles.service');
    const { PermissionsService } = require('../../dist/nest/identity/permissions.service');
    const { MenusService } = require('../../dist/nest/identity/menus.service');
    const { DepartmentsService } = require('../../dist/nest/identity/departments.service');
    const { AuthService } = require('../../dist/nest/identity/auth.service');
    const rollback = new Error('rollback verification fixtures');
    const suffix = randomUUID().slice(0,8);
    let fixtureUserId;
    try { await db.$transaction(async tx => {
      let store;
      store = new Proxy(tx, { get(target,key) { return key === '$transaction' ? work => work(store) : Reflect.get(target,key); } });
      const effects = { invalidateUser: jest.fn(), invalidateRoles: jest.fn(), verifyCaptcha: async()=>true, generateToken: user=>'test-token-'+user.id, location:()=>({city:'local',country:'test'}), kicked:jest.fn() };
      const users=new UsersService(store,effects), roles=new RolesService(store,effects), perms=new PermissionsService(store,effects), menus=new MenusService(store,effects), depts=new DepartmentsService(store,effects), auth=new AuthService(store,users,effects);
      const permission=await perms.createPermission({name:'test',code:'test:'+suffix,resource:'user',action:'read',category:'test'});
      const parent=await menus.createMenu({name:'test root',menu_type:'system',auto_generate_permission:false});
      const middle=await menus.createMenu({name:'test middle',parent_id:parent.id,auto_generate_permission:false});
      const leaf=await menus.createMenu({name:'test leaf',parent_id:middle.id,path:'/test/'+suffix,auto_generate_permission:true});
      expect(leaf.permission_code).toBeTruthy();
      const moved = await menus.updateMenu(leaf.id,{path:'/test/new-resource-'+suffix,auto_generate_permission:true});
      expect(moved.permission_code).toBe('new-resource-'+suffix+':read');
      const role=await roles.createRole({name:'test '+suffix,code:'test_'+suffix,permission_ids:[permission.id],menu_ids:[leaf.id]});
      const user=await users.createUser({username:'test_'+suffix,email:suffix+'@test.invalid',password:'example-password',role_ids:[role.id]});
      fixtureUserId=user.id;
      expect(user.password).toBeUndefined();
      expect(await bcrypt.compare('example-password',(await tx.owl_users.findUnique({where:{id:user.id}})).password)).toBe(true);
      const login=await auth.login({username:user.username,password:'example-password'}, {device_name:'test'}, '127.0.0.1');
      expect(login.user.roles[0].permissions.map(row=>row.id)).toContain(permission.id);
      expect(login.user.password).toBeUndefined();
      await auth.login({username:user.username,password:'example-password'}, {device_name:'test'}, '127.0.0.1');
      expect(await tx.owl_user_sessions.count({where:{user_id:user.id,status:'active'}})).toBe(1);
      expect(await tx.owl_user_sessions.count({where:{user_id:user.id,status:'kicked'}})).toBe(1);
      expect((await menus.getUserMenuTree(user.id)).systemMenus[0].children[0].children[0].id).toBe(leaf.id);
      await expect(roles.deleteRole(role.id)).rejects.toMatchObject({status:400});
      await expect(users.updateUser(user.id,{username:'should_not_save',role_ids:[randomUUID()]})).rejects.toMatchObject({status:400});
      expect((await users.getUserById(user.id)).username).toBe(user.username);
      expect((await users.getUserById(user.id)).roles[0].id).toBe(role.id);
      await roles.updateRole(role.id,{permission_ids:[]});
      expect((await auth.getCurrentUser({id:user.id})).roles[0].permissions).toEqual([]);
      await expect(menus.updateMenu(parent.id,{parent_id:leaf.id})).rejects.toMatchObject({status:400});
      const department=await depts.createDepartment({name:'test department',code:suffix});
      await users.updateUser(user.id,{department_id:department.id});
      expect((await depts.getDepartmentMembers(department.id,{limit:1})).members).toHaveLength(1);
      await expect(depts.deleteDepartment(department.id)).rejects.toMatchObject({status:400});
      await users.deleteUser(user.id);
      await expect(users.getUserById(user.id)).rejects.toMatchObject({status:404});
      expect((await tx.owl_users.findUnique({where:{id:user.id}})).deletedAt).toBeInstanceOf(Date);
      throw rollback;
    },{timeout:30000}); } catch(error) { if(error!==rollback) throw error; }
    expect(await db.owl_users.findUnique({where:{id:fixtureUserId}})).toBeNull();
  },40000);
});
