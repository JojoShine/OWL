module.exports = (sequelize, DataTypes) => {
  const ServerMonitorLog = sequelize.define('ServerMonitorLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    server_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    cpu_usage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    memory_usage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    memory_used_mb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    memory_total_mb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    disk_usage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    disk_used_gb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    disk_total_gb: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    load_avg_1m: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    load_avg_5m: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    load_avg_15m: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    network_rx_kbs: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    network_tx_kbs: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    check_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'success',
      validate: {
        isIn: [['success', 'failed', 'timeout']],
      },
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    checked_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'owl_server_monitor_logs',
    indexes: [
      { fields: ['server_id'] },
      { fields: ['checked_at'] },
    ],
  });

  ServerMonitorLog.associate = (models) => {
    ServerMonitorLog.belongsTo(models.ServerMonitor, {
      foreignKey: 'server_id',
      as: 'server',
    });
  };

  return ServerMonitorLog;
};
