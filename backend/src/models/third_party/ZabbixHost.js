/**
 * ZabbixHost Model
 * 模块归属：Zabbix集成模块
 * 使用场景：存储从Zabbix同步过来的主机信息
 */
module.exports = (sequelize, DataTypes) => {
  const ZabbixHost = sequelize.define(
    'ZabbixHost',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      instance_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: '所属Zabbix实例ID',
      },
      zabbix_hostid: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'Zabbix中的主机ID',
      },
      host: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '主机技术名称',
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '主机可见名称',
      },
      status: {
        type: DataTypes.STRING(20),
        defaultValue: 'available',
        comment: '主机状态',
      },
      ip_address: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '主机IP地址',
      },
      groups: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
        allowNull: true,
        defaultValue: [],
        comment: '所属主机组列表',
      },
      last_sync_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        comment: '最后同步时间',
      },
    },
    {
      tableName: 'owl_zabbix_hosts',
      comment: 'Zabbix同步主机表',
      updatedAt: false, // 不需要自动更新 updatedAt
    }
  );

  ZabbixHost.associate = (db) => {
    if (db.ZabbixInstance) {
      ZabbixHost.belongsTo(db.ZabbixInstance, {
        foreignKey: 'instance_id',
        as: 'instance',
      });
    }
  };

  return ZabbixHost;
};
