const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { splitSql } = require('./sql-statements');
const { METADATA_TABLES } = require('../scripts/database-safety');

async function seed(db, tables) {
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!password || password.length < 12) throw new Error('首次初始化必须设置至少 12 位的 INITIAL_ADMIN_PASSWORD');
  const [adminHash, disabledHash] = await Promise.all([
    bcrypt.hash(password, 12), bcrypt.hash(crypto.randomBytes(24).toString('base64url'), 12),
  ]);
  const sql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8').replace(/^\s*(BEGIN|COMMIT);\s*$/gm, '');
  await db.$transaction(async tx => {
    for (const table of tables.filter(name => !METADATA_TABLES.has(name))) {
      const rows = await tx.$queryRawUnsafe('SELECT 1 FROM public."' + table.replaceAll('"','""') + '" LIMIT 1');
      if (rows.length) throw new Error('数据库已有数据，拒绝重复 seed：' + table);
    }
    for (const statement of splitSql(sql)) await tx.$executeRawUnsafe(statement);
    const changed = await tx.owl_users.updateMany({ where: { username: 'admin' }, data: { password: adminHash, updatedAt: new Date() } });
    if (changed.count !== 1) throw new Error('初始化管理员账号失败');
    await tx.owl_users.updateMany({ where: { username: { in: ['manager','user'] } }, data: { password: disabledHash, status: 'inactive', updatedAt: new Date() } });
    const admin = await tx.owl_users.findFirstOrThrow({ where: { username: 'admin' } });
    for (const table of AUDIT_TABLES) await tx.$executeRawUnsafe('UPDATE public."' + table + '" SET created_by=$1::uuid WHERE created_by IS NULL', admin.id);
    await tx.$executeRawUnsafe('UPDATE public.owl_users SET created_by=id');
  }, { timeout: 120000 });
  console.log('Prisma 初始数据导入完成；管理员密码不会输出到日志。');
}
const AUDIT_TABLES = [
  'owl_alert_history', 'owl_alert_rules', 'owl_api_call_logs', 'owl_api_interfaces',
  'owl_api_keys', 'owl_api_monitor_logs', 'owl_api_monitors', 'owl_dashboard_widgets',
  'owl_departments', 'owl_dictionary', 'owl_email_logs', 'owl_email_templates',
  'owl_file_permissions', 'owl_file_shares', 'owl_files', 'owl_folders',
  'owl_generated_fields', 'owl_generated_modules', 'owl_generation_history', 'owl_menus',
  'owl_monitor_metrics', 'owl_notification_settings', 'owl_notifications', 'owl_permissions',
  'owl_role_menus', 'owl_role_permissions', 'owl_roles', 'owl_sensitive_fields',
  'owl_system_configs', 'owl_third_party_api_keys', 'test_generate', 'owl_user_roles',
  'owl_user_sessions', 'owl_users', 'owl_watermark_config',
];
module.exports = { seed };
