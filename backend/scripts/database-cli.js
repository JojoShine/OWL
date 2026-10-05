#!/usr/bin/env node
'use strict';
const path = require('path');
const { spawn } = require('child_process');
const { Client } = require('pg');
const { assertBootstrapAllowed, assertResetAllowed, validateDatabaseConfig } = require('./database-safety');
const { BASELINE, STRUCTURE_SQL, assertBaselineCompatible } = require('./prisma-baseline');
const { seed } = require('../prisma/seed');
const { loadEnvironment } = require('./database-environment');
const ROOT = path.resolve(__dirname, '..');

function runPrisma(args) {
  return new Promise((resolve,reject) => {
    const child = spawn(process.execPath, [require.resolve('prisma/build/index.js'), ...args], { cwd: ROOT, env: process.env, stdio: 'inherit' });
    child.once('error',reject);
    child.once('exit',code => code === 0 ? resolve() : reject(new Error('Prisma CLI 执行失败，退出码：' + code)));
  });
}
async function listPublicTables(db) {
  return (await db.$queryRawUnsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).map(row => row.table_name);
}
async function baseline(db, tables) {
  if (tables.includes('_prisma_migrations')) {
    const rows = await db.$queryRawUnsafe('SELECT migration_name FROM public._prisma_migrations');
    if (rows.length) throw new Error('已有 Prisma 迁移记录，请使用 db:status / db:deploy');
  }
  const history = tables.includes('SequelizeMeta') ? (await db.$queryRawUnsafe('SELECT name FROM public."SequelizeMeta"')).map(row => row.name) : [];
  assertBaselineCompatible(history, await db.$queryRawUnsafe(STRUCTURE_SQL), require('../prisma/baseline-structure.json'));
  await runPrisma(['migrate','resolve','--applied',BASELINE]);
  console.log('已有库已登记 Prisma 基线；业务数据、账号和授权未修改。');
}
async function main() {
  const command = process.argv[2];
  if (!['bootstrap','deploy','baseline','seed','reset-dev','status'].includes(command)) throw new Error('可用命令：bootstrap、deploy、baseline、seed、reset-dev、status');
  const environment = loadEnvironment();
  const config = {
    host: process.env.DB_HOST || (environment === 'production' ? '' : 'localhost'),
    port: process.env.DB_PORT || (environment === 'production' ? '' : 5432),
    database: environment === 'test' ? process.env.DB_NAME_TEST || 'admin_platform_test' : process.env.DB_NAME || (environment === 'production' ? '' : 'admin_platform'),
    username: process.env.DB_USER || (environment === 'production' ? '' : 'postgres'),
    password: process.env.DB_PASSWORD || (environment === 'production' ? '' : 'postgres'),
  };
  validateDatabaseConfig({environment,config});
  console.log(`数据库操作：${command}；环境：${environment}；目标：${config.host}:${config.port}/${config.database}`);
  if (command === 'status') return runPrisma(['migrate','status']);
  const { PrismaService } = require('../dist/nest/database/prisma.service');
  const { databaseUrl } = require('../dist/nest/database/connection');
  const db = new PrismaService();
  // Dedicated session holds the lock across Prisma CLI subprocesses and seed transactions.
  const lock = new Client({connectionString:databaseUrl()});
  try {
    await lock.connect();
    await lock.query("SELECT pg_advisory_lock(hashtext('owl_platform_database_migration'))");
    let tables = await listPublicTables(db);
    if (command === 'baseline') return await baseline(db,tables);
    if (command === 'deploy') {
      if (!tables.includes('_prisma_migrations')) throw new Error('尚未由 Prisma 管理：空库使用 db:bootstrap，已有库先使用 db:baseline');
      return await runPrisma(['migrate','deploy']);
    }
    if (command === 'bootstrap') assertBootstrapAllowed({environment,database:config.database,tables,confirmation:process.env.DB_BOOTSTRAP_CONFIRM});
    if (command === 'reset-dev') assertResetAllowed({environment,database:config.database,confirmation:process.env.DB_RESET_CONFIRM});
    if (command === 'seed' && !tables.includes('_prisma_migrations')) throw new Error('请先执行 Prisma 迁移');
    if (!process.env.INITIAL_ADMIN_PASSWORD || process.env.INITIAL_ADMIN_PASSWORD.length < 12) throw new Error('首次初始化必须设置至少 12 位的 INITIAL_ADMIN_PASSWORD');
    if (command === 'reset-dev') {
      await db.$executeRawUnsafe('DROP SCHEMA public CASCADE');
      await db.$executeRawUnsafe('CREATE SCHEMA public');
    }
    if (command !== 'seed') await runPrisma(['migrate','deploy']);
    tables = await listPublicTables(db);
    await seed(db,tables);
  } finally {
    await db.$disconnect();
    await lock.end(); // Session end releases the advisory lock even on errors.
  }
}
if (require.main === module) main().catch(error => { console.error('数据库操作失败：' + error.message); process.exitCode=1; });
module.exports = { loadEnvironment, runPrisma, listPublicTables, baseline };
