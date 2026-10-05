const { spawnSync } = require('node:child_process');
const path = require('node:path');

it('loads and constructs the Nest application without legacy models, routes or Sequelize', () => {
  const result = spawnSync(process.execPath, ['-e', `
    process.env.NODE_ENV = 'test';
    const Module = require('node:module');
    const original = Module._load;
    Module._load = function(id, parent, main) {
      const resolved = Module._resolveFilename(id, parent);
      if (resolved.startsWith(process.cwd() + '/src/') || /[/\\\\]src[/\\\\](models|routes)[/\\\\]/.test(resolved) || /[/\\\\]node_modules[/\\\\]sequelize[/\\\\]/.test(resolved)) {
        throw new Error('Forbidden runtime dependency: ' + resolved);
      }
      return original.apply(this, arguments);
    };
    (async () => {
      const { createApplication } = require('./dist/nest/bootstrap');
      const app = await createApplication();
      const { EmailTemplatesService } = require('./dist/nest/notification/templates.service');
      app.get(EmailTemplatesService).ensureAllowedPlaceholders('{{title}}', '{{content}}');
      const { SecurityEffects } = require('./dist/nest/data-security/security.effects');
      app.get(SecurityEffects).invalidate();
      await app.get(SecurityEffects).check('user', '*', 'phone', 'record');
      const { MetricsService } = require('./dist/nest/monitor/metrics.service');
      app.get(MetricsService).getApplicationMetrics();
      await app.get(MetricsService).getCacheMetrics();
      const { AuthService } = require('./dist/nest/identity/auth.service');
      const assert = require('node:assert/strict');
      await assert.rejects(() => app.get(AuthService).sendVerificationCode('invalid'), /手机号格式不正确/);
      const { redisClient } = require('./dist/shared/config/redis');
      redisClient.exists = async () => false;
      redisClient.get = async () => null;
      const { IdentityEffects } = require('./dist/nest/identity/identity.effects');
      await assert.rejects(() => app.get(IdentityEffects).verifySms('13800000000', '000000'), /验证码已过期/);
      // No listen/init: this boundary check needs no database or Redis server.
      process.exit(0);
    })().catch(error => { console.error(error); process.exit(1); });
  `], { cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', timeout: 20000 });
  expect({ status: result.status, error: result.error?.message, stderr: result.stderr }).toEqual({ status: 0, error: undefined, stderr: '' });
});

(process.env.OWL_DATABASE_TEST === '1' && process.env.OWL_STORAGE_TEST === '1' ? it : it.skip)('serves real requests and exits cleanly without loading the legacy ORM', () => {
  const result = spawnSync(process.execPath, ['test/nest/fixtures/runtime-lifecycle.cjs'], {
    cwd: path.resolve(__dirname, '../..'), encoding: 'utf8', timeout: 55000, killSignal: 'SIGKILL',
  });
  expect({ status: result.status, error: result.error?.message, stderr: result.stderr }).toEqual({ status: 0, error: undefined, stderr: '' });
  expect(result.stdout).toContain('RUNTIME_LIFECYCLE_OK');
}, 60000);
