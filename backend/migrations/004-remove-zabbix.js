'use strict';

module.exports = {
  up: async (queryInterface) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.sequelize.query(`
        DELETE FROM owl_role_permissions
         WHERE permission_id IN (
           SELECT id FROM owl_permissions
            WHERE code LIKE 'zabbix:%' OR resource = 'zabbix'
         );

        DELETE FROM owl_permissions
         WHERE code LIKE 'zabbix:%' OR resource = 'zabbix';

        DELETE FROM owl_role_menus
         WHERE menu_id IN (
           SELECT id FROM owl_menus
            WHERE permission_code LIKE 'zabbix:%'
               OR LOWER(COALESCE(name, '')) LIKE '%zabbix%'
               OR LOWER(COALESCE(path, '')) LIKE '%zabbix%'
               OR LOWER(COALESCE(component, '')) LIKE '%zabbix%'
         );

        DELETE FROM owl_menus
         WHERE permission_code LIKE 'zabbix:%'
            OR LOWER(COALESCE(name, '')) LIKE '%zabbix%'
            OR LOWER(COALESCE(path, '')) LIKE '%zabbix%'
            OR LOWER(COALESCE(component, '')) LIKE '%zabbix%';

        DROP TABLE IF EXISTS owl_zabbix_hosts CASCADE;
        DROP TABLE IF EXISTS owl_zabbix_instances CASCADE;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async () => {
    throw new Error('Zabbix 功能已从项目中永久移除，此迁移不支持回滚');
  },
};
