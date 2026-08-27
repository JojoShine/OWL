#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Sequelize, QueryTypes } = require('sequelize');
const {
  METADATA_TABLES,
  assertBootstrapAllowed,
  assertResetAllowed,
  resolveRuntimeEnvironment,
  validateDatabaseConfig,
} = require('./database-safety');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const MIGRATION_LOCK_KEY = 'owl_platform_database_migration';

function loadEnvironment() {
  const environment = resolveRuntimeEnvironment(process.env);
  process.env.NODE_ENV = environment;

  const candidates = environment === 'production'
    ? ['.env.production', '.env']
    : ['.env.local', '.env'];
  const envFile = candidates.find((file) => fs.existsSync(path.join(PROJECT_ROOT, file)));
  if (envFile) {
    require('dotenv').config({ path: path.join(PROJECT_ROOT, envFile), override: false });
  }

  return environment;
}

function getDatabaseConfig(environment) {
  const databaseConfig = require('../src/config/database');
  const config = databaseConfig[environment];
  if (!config) throw new Error(`不支持的数据库环境：${environment}`);
  validateDatabaseConfig({ environment, config });
  return config;
}

function createConnection(config) {
  return new Sequelize(config.database, config.username, config.password, {
    ...config,
    logging: false,
    pool: { max: 1, min: 0, idle: 1000 },
  });
}

async function listPublicTables(sequelize) {
  const rows = await sequelize.query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name`,
    { type: QueryTypes.SELECT }
  );
  return rows.map((row) => row.table_name);
}

async function listExecutedMigrations(sequelize, tables) {
  if (!tables.includes('SequelizeMeta')) return [];
  const rows = await sequelize.query('SELECT name FROM "SequelizeMeta" ORDER BY name', {
    type: QueryTypes.SELECT,
  });
  return rows.map((row) => row.name);
}

function runSequelize(args, environment, extraEnvironment = {}) {
  const cliPath = require.resolve('sequelize-cli/lib/sequelize');
  const result = spawnSync(process.execPath, [cliPath, ...args, '--env', environment], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...extraEnvironment, NODE_ENV: environment },
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`sequelize-cli 执行失败，退出码：${result.status ?? 'unknown'}`);
  }
}

function printTarget(environment, config, command) {
  console.log('\n数据库操作预检');
  console.log(`  命令: ${command}`);
  console.log(`  环境: ${environment}`);
  console.log(`  主机: ${config.host}:${config.port}`);
  console.log(`  数据库: ${config.database}`);
  console.log(`  用户: ${config.username}\n`);
}

async function withMigrationLock(sequelize, operation) {
  await sequelize.query('SELECT pg_advisory_lock(hashtext(:key))', {
    replacements: { key: MIGRATION_LOCK_KEY },
  });
  try {
    return await operation();
  } finally {
    await sequelize.query('SELECT pg_advisory_unlock(hashtext(:key))', {
      replacements: { key: MIGRATION_LOCK_KEY },
    });
  }
}

async function bootstrap({ sequelize, environment, config }) {
  await withMigrationLock(sequelize, async () => {
    const tables = await listPublicTables(sequelize);
    assertBootstrapAllowed({
      environment,
      database: config.database,
      tables,
      confirmation: process.env.DB_BOOTSTRAP_CONFIRM,
    });
    if (tables.length > 0) {
      await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    }
    try {
      runSequelize(['db:migrate'], environment, { ALLOW_DATABASE_BOOTSTRAP: 'true' });
      runSequelize(['db:seed:all'], environment, { ALLOW_DATABASE_BOOTSTRAP: 'true' });
    } catch (error) {
      await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      throw new Error(`首次初始化失败，已恢复为空库：${error.message}`);
    }
  });
}

async function deploy({ sequelize, environment, config }) {
  await withMigrationLock(sequelize, async () => {
    const tables = await listPublicTables(sequelize);
    const applicationTables = tables.filter((table) => !METADATA_TABLES.has(table));
    if (applicationTables.length === 0) {
      throw new Error('目标数据库为空，请使用 npm run db:bootstrap 完成首次初始化');
    }

    const migrations = await listExecutedMigrations(sequelize, tables);
    if (!migrations.includes('001-initial-schema.js')) {
      throw new Error('检测到业务表但缺少 001 迁移记录，为避免误删数据已终止操作');
    }

    runSequelize(['db:migrate'], environment);
  });
  console.log(`数据库 ${config.database} 迁移完成`);
}

async function resetDevelopment({ sequelize, environment, config }) {
  assertResetAllowed({
    environment,
    database: config.database,
    confirmation: process.env.DB_RESET_CONFIRM,
  });

  await withMigrationLock(sequelize, async () => {
    await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    try {
      runSequelize(['db:migrate'], environment, { ALLOW_DATABASE_BOOTSTRAP: 'true' });
      runSequelize(['db:seed:all'], environment, { ALLOW_DATABASE_BOOTSTRAP: 'true' });
    } catch (error) {
      await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
      throw new Error(`开发数据库重置失败，已恢复为空库：${error.message}`);
    }
  });
}

async function main() {
  const command = process.argv[2];
  const supportedCommands = new Set(['bootstrap', 'deploy', 'reset-dev', 'status']);
  if (!supportedCommands.has(command)) {
    throw new Error('未知命令，可用命令：bootstrap、deploy、reset-dev、status');
  }
  const environment = loadEnvironment();
  const config = getDatabaseConfig(environment);
  printTarget(environment, config, command || 'unknown');

  if (command === 'status') {
    runSequelize(['db:migrate:status'], environment);
    return;
  }

  const sequelize = createConnection(config);
  try {
    await sequelize.authenticate();
    if (command === 'bootstrap') await bootstrap({ sequelize, environment, config });
    else if (command === 'deploy') await deploy({ sequelize, environment, config });
    else if (command === 'reset-dev') await resetDevelopment({ sequelize, environment, config });
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`\n数据库操作失败：${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  bootstrap,
  deploy,
  listExecutedMigrations,
  listPublicTables,
  loadEnvironment,
  resetDevelopment,
  runSequelize,
};
