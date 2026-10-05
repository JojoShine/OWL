const enabled = process.env.OWL_MIGRATION_TEST === '1';
(enabled ? describe : describe.skip)('Prisma database lifecycle', () => {
  const { spawnSync } = require('child_process');
  const { randomUUID } = require('crypto');
  const { Client } = require('pg');
  const root = require('path').resolve(__dirname, '..');
  let admin, db, name, env;
  const run = (...args) => spawnSync(process.execPath, args, { cwd: root, env, encoding: 'utf8', timeout: 45000, killSignal: 'SIGKILL' });
  const cli = command => run('scripts/database-cli.js', command);
  const ok = result => expect({status:result.status, error:result.error?.message, output: result.status ? result.stdout+result.stderr : ''}).toEqual({status:0,error:undefined,output:''});
  beforeAll(async () => {
    require('dotenv').config();
    const { databaseUrl } = require('../dist/nest/database/connection');
    name = 'owl_prisma_test_' + randomUUID().replaceAll('-','');
    admin = new Client({connectionString:databaseUrl({...process.env,NODE_ENV:'development',DB_NAME:'postgres'})});
    await admin.connect(); await admin.query('CREATE DATABASE "'+name+'"');
    env = {...process.env,NODE_ENV:'development',DB_NAME:name,DB_NAME_TEST:name,INITIAL_ADMIN_PASSWORD:randomUUID()};
    db = new Client({connectionString:databaseUrl(env)}); await db.connect();
  });
  afterAll(async () => { await db?.end(); if (admin) { if (name) await admin.query('DROP DATABASE IF EXISTS "'+name+'" WITH (FORCE)'); await admin.end(); } });
  it('bootstraps, refuses seed overwrite, rejects drift and adopts an existing database without data changes', async () => {
    ok(cli('bootstrap')); ok(cli('status')); ok(cli('deploy'));
    const before = (await db.query('SELECT id,username,password,status,created_by FROM owl_users ORDER BY id')).rows;
    expect(before).toHaveLength(3);
    const emailReaders = (await db.query(`SELECT r.code FROM owl_roles r
      JOIN owl_role_permissions rp ON rp.role_id=r.id AND rp.deleted_at IS NULL
      JOIN owl_permissions p ON p.id=rp.permission_id AND p.deleted_at IS NULL
      WHERE p.code='email:read' AND r.deleted_at IS NULL ORDER BY r.code`)).rows;
    expect(emailReaders).toEqual([{code:'admin'},{code:'super_admin'}]);
    const grantsBefore = (await db.query('SELECT * FROM owl_role_permissions ORDER BY id')).rows;
    expect(cli('bootstrap').status).not.toBe(0);
    // Use the configured Prisma seed entry point, not a helper bypass.
    expect(run('node_modules/prisma/build/index.js','db','seed').status).not.toBe(0);
    expect((await db.query('SELECT id,username,password,status,created_by FROM owl_users ORDER BY id')).rows).toEqual(before);
    await db.query('DROP TABLE _prisma_migrations');
    await db.query('CREATE TABLE "SequelizeMeta" (name varchar(255) PRIMARY KEY)');
    for (const file of ['001-initial-schema.js','002-add-audit-fields.js','003-separate-credential-systems.js','004-remove-zabbix.js','005-system-config-primary-key.js']) await db.query('INSERT INTO "SequelizeMeta" VALUES ($1)',[file]);
    await db.query('ALTER TABLE owl_users ALTER COLUMN email TYPE varchar(101)');
    expect(cli('baseline').status).not.toBe(0);
    expect((await db.query("SELECT to_regclass('public._prisma_migrations') AS name")).rows[0].name).toBeNull();
    await db.query('ALTER TABLE owl_users ALTER COLUMN email TYPE varchar(100)');
    await db.query('CREATE TABLE project_business (id integer PRIMARY KEY, value text)');
    await db.query("INSERT INTO project_business VALUES (1,'preserve')");
    ok(cli('baseline')); ok(cli('deploy')); ok(cli('deploy')); ok(cli('status'));
    expect((await db.query('SELECT id,username,password,status,created_by FROM owl_users ORDER BY id')).rows).toEqual(before);
    expect((await db.query('SELECT * FROM owl_role_permissions ORDER BY id')).rows).toEqual(grantsBefore);
    expect((await db.query('SELECT value FROM project_business')).rows).toEqual([{value:'preserve'}]);
  }, 120000);
});
