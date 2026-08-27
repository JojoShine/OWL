'use strict';

/**
 * Seeder: 为初始数据添加审计字段
 *
 * 这个 seeder 为所有初始数据的 created_by 字段赋值（使用超级管理员 ID）
 */

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

module.exports = {
  up: async (queryInterface, Sequelize) => {
    if (process.env.ALLOW_DATABASE_BOOTSTRAP !== 'true') {
      throw new Error('初始审计数据只能通过 npm run db:bootstrap 或 db:reset:dev 导入');
    }
    console.log('================================================================================');
    console.log('📦 初始化审计字段 - Seeder');
    console.log('================================================================================');
    console.log('');

    // 超级管理员 ID
    const ADMIN_ID = '99e2337b-8676-4414-b71e-d5aff2008616';

    try {
      // 为所有初始数据的 created_by 赋值（使用超级管理员）
      console.log('⏳ 为所有表添加 created_by 字段（使用超级管理员 ID）...');

      await queryInterface.sequelize.transaction(async (transaction) => {
        for (const tableName of AUDIT_TABLES) {
          await queryInterface.sequelize.query(
            `UPDATE public."${tableName}" SET created_by = :adminId WHERE created_by IS NULL`,
            { replacements: { adminId: ADMIN_ID }, transaction }
          );
          console.log(`   ✅ 更新表: ${tableName}`);
        }

        // 为初始用户配置 created_by（使用各自的 ID）
        console.log('');
        console.log('⏳ 为初始用户配置 created_by...');

        const users = await queryInterface.sequelize.query(
          `SELECT id, username FROM public."owl_users" LIMIT 3`,
          { transaction }
        );

        for (const user of users[0]) {
          await queryInterface.sequelize.query(
            `UPDATE public."owl_users" SET created_by = :userId WHERE id = :userId`,
            { replacements: { userId: user.id }, transaction }
          );
          console.log(`   ✅ ${user.username}: created_by = '${user.id}'`);
        }
      });

      console.log('');
      console.log('================================================================================');
      console.log('✅ 审计字段初始化完成！');
      console.log('================================================================================');

    } catch (error) {
      console.error('❌ 错误:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    if (process.env.ALLOW_DATABASE_RESET !== 'true') {
      throw new Error('禁止直接回滚初始审计数据；开发环境请使用 npm run db:reset:dev');
    }
    console.log('================================================================================');
    console.log('🔄 回滚审计字段初始化 - Seeder');
    console.log('================================================================================');
    console.log('');

    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        for (const tableName of AUDIT_TABLES) {
          await queryInterface.sequelize.query(
            `UPDATE public."${tableName}" SET created_by = NULL`,
            { transaction }
          );
          console.log(`   ✅ 回滚表: ${tableName}`);
        }
      });

      console.log('');
      console.log('================================================================================');
      console.log('✅ 审计字段回滚完成！');
      console.log('================================================================================');

    } catch (error) {
      console.error('❌ 错误:', error.message);
      throw error;
    }
  }
};
