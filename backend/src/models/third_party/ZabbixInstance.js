/**
 * ZabbixInstance Model
 * 模块归属：Zabbix集成模块
 * 使用场景：存储Zabbix实例连接配置信息
 */
module.exports = (sequelize, DataTypes) => {
  const ZabbixInstance = sequelize.define(
    'ZabbixInstance',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '实例名称（用于标识）',
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
        comment: 'Zabbix Server URL',
      },
      api_token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Zabbix API Token',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '实例状态：active-启用，inactive-禁用',
      },
      sync_interval: {
        type: DataTypes.INTEGER,
        defaultValue: 60,
        comment: '同步间隔（秒）',
      },
      last_sync_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后同步时间',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '实例描述',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '创建者ID',
      },
      updated_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '最后更新者ID',
      },
      deleted_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '删除者ID',
      },
    },
    {
      tableName: 'owl_zabbix_instances',
      comment: 'Zabbix实例配置表',
    }
  );

  ZabbixInstance.associate = (db) => {
    if (db.User) {
      ZabbixInstance.belongsTo(db.User, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  };

  return ZabbixInstance;
};
