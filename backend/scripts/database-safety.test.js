const {
  assertBootstrapAllowed,
  assertResetAllowed,
  resolveRuntimeEnvironment,
  validateDatabaseConfig,
} = require('./database-safety');

describe('database command safety', () => {
  test('uses APP_ENV when NODE_ENV is not explicitly set', () => {
    expect(resolveRuntimeEnvironment({ APP_ENV: 'production' })).toBe('production');
  });

  test('rejects an incomplete production database target', () => {
    expect(() => validateDatabaseConfig({
      environment: 'production',
      config: { database: 'owl_prod', username: 'owl' },
    })).toThrow('DB_HOST');
  });

  test('does not bootstrap a database that already contains application tables', () => {
    expect(() => assertBootstrapAllowed({
      environment: 'development',
      database: 'owl_dev',
      tables: ['SequelizeMeta', 'owl_users'],
      confirmation: '',
    })).toThrow('不是空库');
  });

  test('requires the production database name as bootstrap confirmation', () => {
    expect(() => assertBootstrapAllowed({
      environment: 'production',
      database: 'owl_prod',
      tables: [],
      confirmation: '',
    })).toThrow('DB_BOOTSTRAP_CONFIRM=owl_prod');
  });

  test('never permits reset in production', () => {
    expect(() => assertResetAllowed({
      environment: 'production',
      database: 'owl_prod',
      confirmation: 'owl_prod',
    })).toThrow('生产环境');
  });

  test('requires an exact database-name confirmation for development reset', () => {
    expect(() => assertResetAllowed({
      environment: 'development',
      database: 'owl_dev',
      confirmation: 'wrong_database',
    })).toThrow('DB_RESET_CONFIRM=owl_dev');
  });
});
