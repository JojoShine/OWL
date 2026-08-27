'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

/**
 * Sequelize Seeder: Initial Data
 * 读取 sql/ 目录下的所有 SQL 文件并按文件名排序执行
 * 确保初始数据的完整性和依赖关系的正确性
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const seederFile = path.join(__dirname, 'sql', 'seeder.sql');

    if (process.env.ALLOW_DATABASE_BOOTSTRAP !== 'true') {
      throw new Error('初始数据只能通过 npm run db:bootstrap 或 db:reset:dev 导入');
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 初始数据导入 Seeder`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n⚠️  此 Seeder 仅由首次初始化流程调用。\n`);

    // 检查文件是否存在
    if (!fs.existsSync(seederFile)) {
      console.log(`❌ Seeder 文件不存在: ${seederFile}`);
      throw new Error(`Seeder 文件不存在`);
    }

    try {
      const sql = fs.readFileSync(seederFile, 'utf8').trim()
        .replace(/^\s*BEGIN\s*;\s*/i, '')
        .replace(/\s*COMMIT\s*;\s*$/i, '');
      const isProduction = process.env.NODE_ENV === 'production';
      const generatedPassword = crypto.randomBytes(18).toString('base64url');
      const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || generatedPassword;
      if (isProduction && !process.env.INITIAL_ADMIN_PASSWORD) {
        throw new Error('生产环境首次初始化必须设置 INITIAL_ADMIN_PASSWORD');
      }
      if (adminPassword.length < 12) {
        throw new Error('INITIAL_ADMIN_PASSWORD 长度不能少于 12 位');
      }
      const [adminPasswordHash, disabledAccountHash] = await Promise.all([
        bcrypt.hash(adminPassword, 12),
        bcrypt.hash(crypto.randomBytes(24).toString('base64url'), 12),
      ]);

      console.log(`\n⏳ 导入初始数据...\n`);

      // 直接执行整个 SQL 文件
      try {
        await queryInterface.sequelize.transaction(async (transaction) => {
          await queryInterface.sequelize.query(sql, { transaction });
          const [, updateResult] = await queryInterface.sequelize.query(
            `UPDATE public."owl_users"
                SET password = :passwordHash, updated_at = NOW()
              WHERE username = 'admin'`,
            { replacements: { passwordHash: adminPasswordHash }, transaction }
          );
          if (updateResult.rowCount !== 1) {
            throw new Error('初始化管理员账号失败');
          }
          await queryInterface.sequelize.query(
            `UPDATE public."owl_users"
                SET password = :passwordHash, status = 'inactive', updated_at = NOW()
              WHERE username IN ('manager', 'user')`,
            { replacements: { passwordHash: disabledAccountHash }, transaction }
          );
        });
      } catch (err) {
        console.error('\n❌ SQL 执行错误');
        console.error('错误消息:', err.message);
        console.error('错误代码:', err.code);
        console.error('错误位置:', err.position);
        if (err.sql) {
          const startLine = Math.max(0, parseInt(err.position || 0) - 500);
          console.error('\n错误周围的 SQL 内容:');
          console.error(err.sql.substring(startLine, parseInt(err.position || 0) + 200));
        }
        throw err;
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ 初始数据导入完成！`);
      console.log(`${'='.repeat(80)}\n`);

      console.log('\n超级管理员用户名：admin');
      if (isProduction) {
        console.log('超级管理员密码已使用 INITIAL_ADMIN_PASSWORD 设置，不会输出到日志。');
      } else if (!process.env.INITIAL_ADMIN_PASSWORD) {
        console.log(`本地临时管理员密码：${adminPassword}`);
      }
    } catch (error) {
      console.error(`\n❌ 初始数据导入失败`);
      console.error(`   错误: ${error.message}\n`);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    if (process.env.ALLOW_DATABASE_RESET !== 'true') {
      throw new Error('禁止直接回滚初始数据；开发环境请使用 npm run db:reset:dev');
    }
    console.log('\n⚠️  警告: 回滚 Seeder 将删除所有初始数据！');
    console.log('这将清空所有数据表的内容。\n');

    const tables = [
      'owl_generation_history',
      'owl_generated_fields',
      'owl_api_interfaces',
      'owl_api_keys',
      'owl_email_templates',
      'owl_notification_settings',
      'owl_file_shares',
      'owl_files',
      'owl_folders',
      'owl_watermark_config',
      'owl_user_roles',
      'owl_role_menus',
      'owl_role_permissions',
      'owl_users',
      'owl_menus',
      'owl_permissions',
      'owl_roles',
      'owl_departments',
    ];

    for (const table of tables) {
      try {
        console.log(`🗑️  清空表: ${table}`);
        await queryInterface.bulkDelete(table, {}, {});
      } catch (error) {
        console.warn(`   警告: 无法清空表 ${table} - ${error.message}`);
      }
    }

    console.log('\n✅ Seeder 回滚完成！\n');
  },
};
