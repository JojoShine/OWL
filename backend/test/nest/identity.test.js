const { safeUser, buildTree, grantedMenuTree, searchWhere } = require('../../dist/nest/identity/identity.helpers');
const { UsersService } = require('../../dist/nest/identity/users.service');
const bcrypt = require('bcryptjs');

describe('identity contract', () => {
  it('never exposes password hashes', () => {
    expect(safeUser({ id: 'u1', password: 'hash', username: 'alice' })).toEqual({ id: 'u1', username: 'alice' });
  });
  it('includes all visible ancestors but no unrelated or hidden branches', () => {
    const menus = [
      { id: 'root', parent_id: null, visible: true, status: 'active', sort: 0, menu_type: 'system' },
      { id: 'middle', parent_id: 'root', visible: true, status: 'active', sort: 0 },
      { id: 'leaf', parent_id: 'middle', visible: true, status: 'active', sort: 0 },
      { id: 'other', parent_id: null, visible: true, status: 'active', sort: 1 },
      { id: 'hidden', parent_id: null, visible: false, status: 'active', sort: 1 },
    ];
    const tree = grantedMenuTree(menus, ['leaf', 'hidden']);
    expect(tree.systemMenus.map(x => x.id)).toEqual(['root']);
    expect(tree.systemMenus[0].children[0].children.map(x => x.id)).toEqual(['leaf']);
    expect(tree.businessMenus).toEqual([]);
  });
  it('terminates when malformed menu data contains cycles', () => {
    expect(buildTree([{id:'a', parent_id:'b'}, {id:'b',parent_id:'a'}])).toEqual([]);
    expect(grantedMenuTree([{id:'a',parent_id:'a',visible:true,status:'active'}], ['a'])).toEqual({businessMenus:[],systemMenus:[]});
  });
  it('hashes newly assigned passwords', async () => {
    let saved;
    const store = {
      owl_users: { findFirst: async () => ({id:'u1', password:'old'}), update: async ({data}) => { saved = data.password; return { id: 'u1', ...data }; } },
    };
    const service = new UsersService(store);
    await service.resetPassword('u1','new-password');
    expect(saved).not.toBe('new-password');
    expect(await bcrypt.compare('new-password',saved)).toBe(true);
  });
});

it('ignores empty optional filters while preserving a supplied category',()=>{
  expect(searchWhere({resource:'',action:'',category:'system'},[],['resource','action','category'])).toEqual({category:'system'});
});
