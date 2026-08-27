'use strict';

const METADATA_TABLES = new Set([
  'SequelizeMeta',
  'SequelizeData',
  'owl_SequelizeMeta',
  'owl_SequelizeData',
]);

function resolveRuntimeEnvironment(environment = process.env) {
  return environment.NODE_ENV || environment.APP_ENV || 'development';
}

function validateDatabaseConfig({ environment, config }) {
  const fields = [
    ['DB_HOST', config.host],
    ['DB_PORT', config.port],
    ['DB_NAME', config.database],
    ['DB_USER', config.username],
    ['DB_PASSWORD', config.password],
  ];

  const missing = fields.filter(([, value]) => value === undefined || value === null || value === '');
  if (environment === 'production' && missing.length > 0) {
    throw new Error(`生产数据库配置不完整，缺少：${missing.map(([name]) => name).join(', ')}`);
  }

  if (!config.database || !config.username || !config.host) {
    throw new Error('数据库目标不完整，请检查 DB_HOST、DB_NAME 和 DB_USER');
  }
}

function assertBootstrapAllowed({ environment, database, tables, confirmation }) {
  const applicationTables = tables.filter((table) => !METADATA_TABLES.has(table));
  if (applicationTables.length > 0) {
    throw new Error(`数据库 ${database} 不是空库，禁止执行首次初始化；请改用 npm run db:deploy`);
  }

  if (environment === 'production' && confirmation !== database) {
    throw new Error(`生产环境首次初始化需要显式确认：DB_BOOTSTRAP_CONFIRM=${database}`);
  }
}

function assertResetAllowed({ environment, database, confirmation }) {
  if (environment === 'production') {
    throw new Error('生产环境禁止执行数据库重置');
  }
  if (confirmation !== database) {
    throw new Error(`开发数据库重置需要显式确认：DB_RESET_CONFIRM=${database}`);
  }
}

module.exports = {
  METADATA_TABLES,
  assertBootstrapAllowed,
  assertResetAllowed,
  resolveRuntimeEnvironment,
  validateDatabaseConfig,
};
