'use strict';

/**
 * Migration: 添加审计字段（created_by, updated_by, deleted_by）到所有表
 *
 * 这个 migration 为所有现有表添加审计跟踪字段，用于数据访问权限控制 (DAC)
 * created_by: 创建者ID
 * updated_by: 最后更新者ID
 * deleted_by: 删除者ID（用于软删除）
 */

// 需要添加审计字段的表列表
const TABLES_WITH_AUDIT = [
  'owl_alert_history',
  'owl_alert_rules',
  'owl_api_call_logs',
  'owl_api_interfaces',
  'owl_api_keys',
  'owl_api_monitor_logs',
  'owl_api_monitors',

  'owl_dashboard_widgets',
  'owl_departments',
  'owl_dictionary',
  'owl_email_logs',
  'owl_email_tasks',
  'owl_email_templates',
  'owl_file_permissions',
  'owl_file_shares',
  'owl_files',
  'owl_folders',
  'owl_generated_fields',
  'owl_generated_modules',
  'owl_generation_history',
  'owl_menus',
  'owl_monitor_metrics',
  'owl_notification_settings',
  'owl_notifications',
  'owl_permissions',
  'owl_role_menus',
  'owl_role_permissions',
  'owl_roles',
  'owl_sensitive_fields',
  'owl_system_configs',
  'owl_third_party_api_keys',
  'owl_user_roles',
  'owl_user_sessions',
  'owl_users',
  'owl_watermark_config',
];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const tableName of TABLES_WITH_AUDIT) {
        const columns = await queryInterface.describeTable(tableName, { transaction });
        const auditColumns = [
          ['created_by', '创建者ID'],
          ['updated_by', '最后更新者ID'],
          ['deleted_by', '删除者ID（用于软删除）'],
        ];
        for (const [columnName, comment] of auditColumns) {
          if (!columns[columnName]) {
            await queryInterface.addColumn(tableName, columnName, {
              type: Sequelize.UUID,
              allowNull: true,
              comment,
            }, { transaction });
          }
        }
        const indexName = `idx_${tableName}_created_by`;
        const indexes = await queryInterface.showIndex(tableName, { transaction });
        if (!indexes.some((index) => index.name === indexName)) {
          await queryInterface.addIndex(tableName, ['created_by'], {
            name: indexName,
            unique: false,
            transaction,
          });
        }
      }

      const userColumns = await queryInterface.describeTable('owl_users', { transaction });
      if (!userColumns.access_level) {
        await queryInterface.addColumn('owl_users', 'access_level', {
          type: Sequelize.STRING(50),
          defaultValue: 'SELF',
          allowNull: false,
          comment: '数据访问权限级别：ALL-所有数据，DEPARTMENT-本部门，DEPARTMENT_CHILDREN-本部门及下级，SELF-本人',
        }, { transaction });
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    if (process.env.ALLOW_DATABASE_RESET !== 'true') {
      throw new Error('禁止直接回滚审计字段迁移；开发环境请使用 npm run db:reset:dev');
    }

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const tableName of TABLES_WITH_AUDIT) {
        const columns = await queryInterface.describeTable(tableName, { transaction });
        for (const columnName of ['created_by', 'updated_by', 'deleted_by']) {
          if (columns[columnName]) {
            await queryInterface.removeColumn(tableName, columnName, { transaction });
          }
        }
      }

      const userColumns = await queryInterface.describeTable('owl_users', { transaction });
      if (userColumns.access_level) {
        await queryInterface.removeColumn('owl_users', 'access_level', { transaction });
      }
    });
  }
};
