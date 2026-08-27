'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Sequelize Migration: Initial Schema
 * 读取 sql/ 目录下的所有 SQL 文件并按文件名排序执行
 * 确保数据库结构的完整和依赖关系的正确性
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const platform = queryInterface.sequelize.options.dialect;
    const sqlDir = path.join(__dirname, 'postgres', 'sql');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 数据库初始化 - ${platform.toUpperCase()}`);
    console.log(`${'='.repeat(80)}`);
    if (process.env.ALLOW_DATABASE_BOOTSTRAP !== 'true') {
      throw new Error('初始结构迁移只能通过 npm run db:bootstrap 或 db:reset:dev 执行');
    }

    const existingTables = (await queryInterface.showAllTables())
      .map((table) => (typeof table === 'string' ? table : table.tableName));
    const applicationTables = existingTables.filter((table) => ![
      'SequelizeMeta', 'SequelizeData', 'owl_SequelizeMeta', 'owl_SequelizeData',
    ].includes(table));
    if (applicationTables.length > 0) {
      throw new Error(`目标数据库不是空库，拒绝执行初始结构迁移：${applicationTables.join(', ')}`);
    }

    // 读取所有 SQL 文件（按文件名排序）
    const sqlFiles = fs.readdirSync(sqlDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🏗️  第二步：建立数据库表结构`);
    console.log(`${'='.repeat(80)}`);
    console.log(`📄 找到 ${sqlFiles.length} 个 SQL 文件\n`);

    await queryInterface.sequelize.transaction(async (transaction) => {
      for (const sqlFile of sqlFiles) {
        const sqlPath = path.join(sqlDir, sqlFile);
        const sql = fs.readFileSync(sqlPath, 'utf8').trim();

        if (sql.length === 0) {
          console.log(`⏭️  跳过空文件: ${sqlFile}`);
          continue;
        }

        try {
          console.log(`⏳ 执行: ${sqlFile}`);
          await queryInterface.sequelize.query(sql, { transaction });
          console.log(`✅ 完成: ${sqlFile}`);
        } catch (error) {
          console.error(`❌ 执行失败: ${sqlFile}`);
          console.error(`   错误: ${error.message}`);
          throw error;
        }
      }
    });

    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ 数据库初始化 Migration 执行完成！`);
    console.log(`${'='.repeat(80)}\n`);
  },

  down: async (queryInterface, Sequelize) => {
    if (process.env.ALLOW_DATABASE_RESET !== 'true') {
      throw new Error('禁止直接回滚初始结构；开发环境请使用 npm run db:reset:dev');
    }
    console.log('\n⚠️  警告: 回滚初始 Migration 将删除所有表！');
    console.log('执行回滚前请确保已备份数据！\n');

    const platform = queryInterface.sequelize.options.dialect;

    try {
      // 获取所有表并删除
      const tables = await queryInterface.showAllTables();
      // 只保留 owl_ 前缀的表
      const dataTables = tables.filter(t => t.startsWith('owl_') && !t.includes('sequelize'));

      if (dataTables.length > 0) {
        // 先禁用外键约束
        if (platform === 'postgres') {
          await queryInterface.sequelize.query(`SET session_replication_role = replica;`);
        }

        // 删除所有表
        for (const table of dataTables) {
          try {
            console.log(`🗑️  删除表: ${table}`);
            await queryInterface.sequelize.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
          } catch (error) {
            console.warn(`   警告: 无法删除表 ${table} - ${error.message}`);
          }
        }

        // 重新启用外键约束
        if (platform === 'postgres') {
          await queryInterface.sequelize.query(`SET session_replication_role = DEFAULT;`);

          // 删除所有 Enum 类型
          const enums = [
            'enum_owl_departments_status',
            'enum_owl_email_logs_status',
            'enum_owl_menus_status',
            'enum_owl_menus_type',
            'enum_owl_menus_menu_type',
            'enum_owl_notifications_type',
            'enum_owl_roles_status',
            'enum_owl_users_status',
            'enum_owl_user_sessions_status',
            'enum_owl_sensitive_fields_mask_type',
          ];

          for (const enumType of enums) {
            try {
              await queryInterface.sequelize.query(`DROP TYPE IF EXISTS ${enumType} CASCADE;`);
              console.log(`🗑️  删除 Enum: ${enumType}`);
            } catch (e) {
              // 继续
            }
          }
        }
      }

      console.log('\n✅ owl 相关表和 Enum 类型已删除\n');
    } catch (error) {
      console.error(`❌ 回滚失败: ${error.message}\n`);
      throw error;
    }
  }
};
