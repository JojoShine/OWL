const db = require('../src/models');

async function run() {
  const adminRoleId = '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345';
  
  const perms = [
    { code: 'zabbix:read', name: '查看Zabbix监控', action: 'read' },
    { code: 'zabbix:create', name: '创建Zabbix实例', action: 'create' },
    { code: 'zabbix:update', name: '更新Zabbix实例', action: 'update' },
    { code: 'zabbix:delete', name: '删除Zabbix实例', action: 'delete' },
  ];

  for (const p of perms) {
    // Check if permission exists
    const [existing] = await db.sequelize.query(
      'SELECT id FROM owl_permissions WHERE code = :code',
      { replacements: { code: p.code } }
    );

    let permId;
    if (existing.length === 0) {
      // Create permission
      const [result] = await db.sequelize.query(
        `INSERT INTO owl_permissions (id, code, name, resource, action, description, created_at, updated_at) 
         VALUES (gen_random_uuid(), :code, :name, 'zabbix', :action, :desc, NOW(), NOW()) 
         RETURNING id`,
        { replacements: { code: p.code, name: p.name, action: p.action, desc: p.name } }
      );
      permId = result[0].id;
      console.log('Created permission:', p.code, permId);
    } else {
      permId = existing[0].id;
      console.log('Permission exists:', p.code, permId);
    }

    // Assign to admin role
    const [rolePerm] = await db.sequelize.query(
      'SELECT id FROM owl_role_permissions WHERE role_id = :roleId AND permission_id = :permId',
      { replacements: { roleId: adminRoleId, permId } }
    );

    if (rolePerm.length === 0) {
      await db.sequelize.query(
        'INSERT INTO owl_role_permissions (role_id, permission_id) VALUES (:roleId, :permId)',
        { replacements: { roleId: adminRoleId, permId } }
      );
      console.log('Assigned to admin:', p.code);
    } else {
      console.log('Already assigned:', p.code);
    }
  }

  console.log('Done!');
  await db.sequelize.close();
}

run().catch(e => {
  console.error('Error:', e.message);
  db.sequelize.close();
  process.exit(1);
});
