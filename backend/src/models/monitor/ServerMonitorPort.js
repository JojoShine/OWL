module.exports = (sequelize, DataTypes) => {
  const ServerMonitorPort = sequelize.define('ServerMonitorPort', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    server_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    service_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    protocol: {
      type: DataTypes.STRING(10),
      defaultValue: 'tcp',
      validate: {
        isIn: [['tcp', 'udp']],
      },
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    last_check_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '上次检查状态: open, closed, timeout',
    },
    last_checked_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '上次检查时间',
    },
  }, {
    tableName: 'owl_server_monitor_ports',
    indexes: [
      { fields: ['server_id'] },
      { fields: ['port'] },
    ],
  });

  ServerMonitorPort.associate = (models) => {
    ServerMonitorPort.belongsTo(models.ServerMonitor, {
      foreignKey: 'server_id',
      as: 'server',
    });
  };

  return ServerMonitorPort;
};
