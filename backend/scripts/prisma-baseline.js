const HISTORY = ['001-initial-schema.js','002-add-audit-fields.js','003-separate-credential-systems.js','004-remove-zabbix.js','005-system-config-primary-key.js'];
const BASELINE = '20261005000000_baseline';
const STRUCTURE_SQL = `
SELECT 'column' AS kind, c.relname || '.' || a.attname AS name,
 json_build_array(format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid))::text AS definition
FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum
WHERE n.nspname='public' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped
 AND c.relname NOT IN ('SequelizeMeta','SequelizeData','_prisma_migrations')
UNION ALL
SELECT 'constraint', c.relname || '.' || p.conname, pg_get_constraintdef(p.oid)
FROM pg_constraint p JOIN pg_class c ON c.oid=p.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relname NOT IN ('SequelizeMeta','SequelizeData','_prisma_migrations')
UNION ALL
SELECT 'index', tablename || '.' || indexname, indexdef FROM pg_indexes
WHERE schemaname='public' AND tablename NOT IN ('SequelizeMeta','SequelizeData','_prisma_migrations')
UNION ALL
SELECT 'enum', t.typname, json_agg(e.enumlabel ORDER BY e.enumsortorder)::text
FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace
WHERE n.nspname='public' GROUP BY t.typname
ORDER BY kind,name`;
function assertBaselineCompatible(history, actual, expected) {
  const missing = HISTORY.filter(name => !history.includes(name));
  if (missing.length) throw new Error('旧库历史迁移未完成：' + missing.join(', '));
  const entries = new Map(actual.map(row => [row.kind + ':' + row.name, row.definition]));
  const expectedKeys = new Set(expected.map(row => row.kind + ':' + row.name));
  const tables = new Set(expected.filter(row => row.kind === 'column').map(row => row.name.split('.')[0]));
  const extra = actual.filter(row => row.kind !== 'enum' && tables.has(row.name.split('.')[0]) && !expectedKeys.has(row.kind + ':' + row.name));
  const differences = expected.filter(row => entries.get(row.kind + ':' + row.name) !== row.definition).concat(extra);
  if (differences.length) throw new Error('数据库结构与 Prisma 基线不一致：' + differences.slice(0, 10).map(row => row.name).join(', '));
}
module.exports = { BASELINE, STRUCTURE_SQL, assertBaselineCompatible };
