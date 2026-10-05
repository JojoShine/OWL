const { splitSql } = require('../prisma/sql-statements');
const { assertBaselineCompatible } = require('./prisma-baseline');
it('splits SQL outside quoted strings, comments and dollar-quoted bodies', () => {
  expect(splitSql("INSERT INTO t VALUES ('a;''b'); -- ;\nDO $$ BEGIN PERFORM 1; END $$; /* ; */ SELECT 2;")).toHaveLength(3);
  expect(splitSql("SELECT E'a\\\';b'; SELECT 2;")).toHaveLength(2);
});
it('rejects incomplete migration history and schema drift but allows extra business tables', () => {
  const expected = [{ kind: 'column', name: 'owl_users.id', definition: 'uuid' }];
  const history = ['001-initial-schema.js','002-add-audit-fields.js','003-separate-credential-systems.js','004-remove-zabbix.js','005-system-config-primary-key.js'];
  expect(() => assertBaselineCompatible([], expected, expected)).toThrow();
  expect(() => assertBaselineCompatible(history, [], expected)).toThrow();
  expect(() => assertBaselineCompatible(history, [...expected, { kind: 'column', name: 'biz.id', definition: 'integer' }], expected)).not.toThrow();
});
it('does not create legacy migration metadata or change Prisma search_path in the baseline', () => {
  const sql = require('fs').readFileSync(require('path').join(__dirname,'../prisma/migrations/20261005000000_baseline/migration.sql'),'utf8');
  expect(sql).not.toMatch(/SequelizeMeta|SequelizeData|set_config\('search_path'/);
});
it('rejects extra columns and constraints on baseline tables', () => {
  const history = ['001-initial-schema.js','002-add-audit-fields.js','003-separate-credential-systems.js','004-remove-zabbix.js','005-system-config-primary-key.js'];
  const expected = [{kind:'column',name:'owl_users.id',definition:'uuid'}];
  for (const extra of [{kind:'column',name:'owl_users.required_value',definition:'NOT NULL'}, {kind:'constraint',name:'owl_users.new_check',definition:'CHECK (...)'}]) {
    expect(() => assertBaselineCompatible(history,[...expected,extra],expected)).toThrow();
  }
});
