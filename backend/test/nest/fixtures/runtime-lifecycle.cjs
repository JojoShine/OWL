// Run in a fresh process so any attempted legacy ORM import is observable.
require('dotenv').config();
process.env.DB_NAME_TEST = process.env.DB_NAME_TEST || process.env.DB_NAME;
process.env.NODE_ENV = 'test';
const Module = require('node:module');
const original = Module._load;
Module._load = function(id, parent) {
  const resolved = Module._resolveFilename(id, parent);
  if (resolved.startsWith(process.cwd() + '/src/') || /[/\\]src[/\\](models|routes)[/\\]/.test(resolved) || /[/\\]node_modules[/\\]sequelize[/\\]/.test(resolved)) {
    throw new Error('Forbidden runtime dependency: ' + resolved);
  }
  return original.apply(this, arguments);
};
(async () => {
  const { createApplication } = require('../../../dist/nest/bootstrap');
  const { PrismaService } = require('../../../dist/nest/database/prisma.service');
  const app = await createApplication();
  try {
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl(), db = app.get(PrismaService);
    const user = await db.owl_users.findFirst({ where: { username: 'admin', deletedAt: null }, select: { id: true, username: true, email: true } });
    if (!user) throw new Error('Fixture requires the initialized admin account');
    const token = require('../../../dist/shared/utils/jwt.util').generateToken(user);
    for (const path of ['/api','/health','/api/system/auth/me','/api/system/users','/api/system/roles','/api/system/menus/user-tree','/api/system/watermark/rendered','/api/system/dashboard','/api/system/dashboard-widgets/execute','/api/system/monitor/application','/api/system/monitor/cache']) {
      const response = await fetch(base + path, { headers: { authorization: 'Bearer ' + token } });
      const body = await response.json();
      if (response.status !== 200 || !body.success) throw new Error(path + ': ' + response.status);
    }
    const unknown = await fetch(base + '/api/biz/not-present');
    if (unknown.status !== 404) throw new Error('Unknown route did not return 404');
    const anonymous = await fetch(base + '/api/system/users');
    if (anonymous.status !== 401) throw new Error('Authentication boundary failed');
  } finally {
    await app.close();
  }
  console.log('RUNTIME_LIFECYCLE_OK');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
