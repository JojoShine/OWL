const {Client} = require('pg');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {databaseUrl} = require('../../scripts/database-connection');
const run = process.env.OWL_DATABASE_TEST === '1' ? it : it.skip;
run('migrates an existing config row with defaults and rejects invalid database values',async()=>{
 const client = new Client({connectionString:databaseUrl()});
 await client.connect();
 try {
  await client.query('BEGIN');
  // pg_temp shadows the real table for this connection; no application rows are modified.
  await client.query('CREATE TEMP TABLE owl_system_configs (id bigint PRIMARY KEY) ON COMMIT DROP');
  await client.query('INSERT INTO owl_system_configs (id) VALUES (1)');
  await client.query(readFileSync(join(__dirname,'../../prisma/migrations/20261029000000_auth_security/migration.sql'),'utf8'));
  const {rows}=await client.query('SELECT * FROM owl_system_configs');
  expect(rows[0]).toMatchObject({password_policy:'standard',login_failure_limit:5,login_lock_minutes:15});
  await expect(client.query('UPDATE owl_system_configs SET login_failure_limit=0')).rejects.toMatchObject({code:'23514'});
 } finally {await client.query('ROLLBACK');await client.end();}
});
