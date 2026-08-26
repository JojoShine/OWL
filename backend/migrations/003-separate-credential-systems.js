'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query('TRUNCATE TABLE owl_api_keys CASCADE', { transaction });
      await queryInterface.sequelize.query('TRUNCATE TABLE owl_third_party_api_keys CASCADE', { transaction });

      const apiKeyColumns = await queryInterface.describeTable('owl_api_keys');
      if (apiKeyColumns.interface_id) await queryInterface.removeColumn('owl_api_keys', 'interface_id', { transaction });
      if (apiKeyColumns.app_name) await queryInterface.removeColumn('owl_api_keys', 'app_name', { transaction });
      if (apiKeyColumns.api_key) await queryInterface.removeColumn('owl_api_keys', 'api_key', { transaction });
      if (apiKeyColumns.api_secret) await queryInterface.removeColumn('owl_api_keys', 'api_secret', { transaction });
      if (!apiKeyColumns.client_name) await queryInterface.addColumn('owl_api_keys', 'client_name', {
        type: Sequelize.STRING(255), allowNull: false,
      }, { transaction });
      if (!apiKeyColumns.key_prefix) await queryInterface.addColumn('owl_api_keys', 'key_prefix', {
        type: Sequelize.STRING(24), allowNull: false,
      }, { transaction });
      if (!apiKeyColumns.key_hash) await queryInterface.addColumn('owl_api_keys', 'key_hash', {
        type: Sequelize.STRING(64), allowNull: false, unique: true,
      }, { transaction });
      if (!apiKeyColumns.description) await queryInterface.addColumn('owl_api_keys', 'description', {
        type: Sequelize.TEXT, allowNull: true,
      }, { transaction });

      const interfaceColumns = await queryInterface.describeTable('owl_api_interfaces');
      if (interfaceColumns.api_key_id) {
        await queryInterface.removeColumn('owl_api_interfaces', 'api_key_id', { transaction });
      }

      const existingTables = (await queryInterface.showAllTables())
        .map((table) => (typeof table === 'string' ? table : table.tableName));
      const hasApiKeyInterfaces = existingTables.includes('owl_api_key_interfaces');
      if (!hasApiKeyInterfaces) await queryInterface.createTable('owl_api_key_interfaces', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
        api_key_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'owl_api_keys', key: 'id' },
          onDelete: 'CASCADE',
        },
        interface_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'owl_api_interfaces', key: 'id' },
          onDelete: 'CASCADE',
        },
        created_by: { type: Sequelize.UUID, allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }, { transaction });
      if (!hasApiKeyInterfaces) await queryInterface.addConstraint('owl_api_key_interfaces', {
        fields: ['api_key_id', 'interface_id'],
        type: 'unique',
        name: 'uq_owl_api_key_interfaces_key_interface',
        transaction,
      });
      if (!hasApiKeyInterfaces) await queryInterface.addIndex('owl_api_key_interfaces', ['interface_id'], {
        name: 'idx_owl_api_key_interfaces_interface_id', transaction,
      });

      const thirdPartyColumns = await queryInterface.describeTable('owl_third_party_api_keys');
      if (thirdPartyColumns.api_secret) await queryInterface.removeColumn('owl_third_party_api_keys', 'api_secret', { transaction });
      if (!thirdPartyColumns.secret_ciphertext) await queryInterface.addColumn('owl_third_party_api_keys', 'secret_ciphertext', {
        type: Sequelize.TEXT, allowNull: false,
      }, { transaction });
      if (!thirdPartyColumns.secret_iv) await queryInterface.addColumn('owl_third_party_api_keys', 'secret_iv', {
        type: Sequelize.STRING(32), allowNull: false,
      }, { transaction });
      if (!thirdPartyColumns.secret_auth_tag) await queryInterface.addColumn('owl_third_party_api_keys', 'secret_auth_tag', {
        type: Sequelize.STRING(32), allowNull: false,
      }, { transaction });
      if (!thirdPartyColumns.scopes) await queryInterface.addColumn('owl_third_party_api_keys', 'scopes', {
        type: Sequelize.JSONB, allowNull: false, defaultValue: [],
      }, { transaction });

      const hasThirdPartyCallLogs = existingTables.includes('owl_third_party_api_call_logs');
      if (!hasThirdPartyCallLogs) await queryInterface.createTable('owl_third_party_api_call_logs', {
        id: { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
        third_party_key_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: { model: 'owl_third_party_api_keys', key: 'id' },
          onDelete: 'SET NULL',
        },
        client_name: { type: Sequelize.STRING(255), allowNull: true },
        request_method: { type: Sequelize.STRING(12), allowNull: false },
        request_path: { type: Sequelize.STRING(500), allowNull: false },
        ip_address: { type: Sequelize.STRING(45), allowNull: true },
        response_code: { type: Sequelize.INTEGER, allowNull: false },
        response_time: { type: Sequelize.INTEGER, allowNull: false },
        failure_reason: { type: Sequelize.STRING(100), allowNull: true },
        created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
        deleted_at: { type: Sequelize.DATE, allowNull: true },
      }, { transaction });
      if (!hasThirdPartyCallLogs) await queryInterface.addIndex('owl_third_party_api_call_logs', ['third_party_key_id'], {
        name: 'idx_third_party_call_logs_key_id', transaction,
      });
      if (!hasThirdPartyCallLogs) await queryInterface.addIndex('owl_third_party_api_call_logs', ['created_at'], {
        name: 'idx_third_party_call_logs_created_at', transaction,
      });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('owl_third_party_api_call_logs', { transaction });
      await queryInterface.removeColumn('owl_third_party_api_keys', 'scopes', { transaction });
      await queryInterface.removeColumn('owl_third_party_api_keys', 'secret_auth_tag', { transaction });
      await queryInterface.removeColumn('owl_third_party_api_keys', 'secret_iv', { transaction });
      await queryInterface.removeColumn('owl_third_party_api_keys', 'secret_ciphertext', { transaction });
      await queryInterface.addColumn('owl_third_party_api_keys', 'api_secret', {
        type: Sequelize.STRING(255), allowNull: false, defaultValue: '',
      }, { transaction });

      await queryInterface.dropTable('owl_api_key_interfaces', { transaction });
      await queryInterface.removeColumn('owl_api_keys', 'description', { transaction });
      await queryInterface.removeColumn('owl_api_keys', 'key_hash', { transaction });
      await queryInterface.removeColumn('owl_api_keys', 'key_prefix', { transaction });
      await queryInterface.removeColumn('owl_api_keys', 'client_name', { transaction });
      await queryInterface.addColumn('owl_api_keys', 'interface_id', { type: Sequelize.UUID }, { transaction });
      await queryInterface.addColumn('owl_api_keys', 'app_name', {
        type: Sequelize.STRING(255), allowNull: false, defaultValue: '',
      }, { transaction });
      await queryInterface.addColumn('owl_api_keys', 'api_key', {
        type: Sequelize.STRING(255), allowNull: false, defaultValue: '',
      }, { transaction });
      await queryInterface.addColumn('owl_api_keys', 'api_secret', {
        type: Sequelize.STRING(255), allowNull: false, defaultValue: '',
      }, { transaction });
      await queryInterface.addColumn('owl_api_interfaces', 'api_key_id', { type: Sequelize.UUID }, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
