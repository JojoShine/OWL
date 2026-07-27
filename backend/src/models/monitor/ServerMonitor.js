module.exports = (sequelize, DataTypes) => {
  const ServerMonitor = sequelize.define('ServerMonitor', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false,
    },
    port: {
      type: DataTypes.INTEGER,
      defaultValue: 22,
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    private_key: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    auth_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'password',
      validate: {
        isIn: [['password', 'key']],
      },
    },
    interval: {
      type: DataTypes.INTEGER,
      defaultValue: 60,
      validate: {
        min: 30,
        max: 3600,
      },
    },
    timeout: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      validate: {
        min: 5,
        max: 120,
      },
    },
    cpu_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 90.00,
    },
    memory_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 90.00,
    },
    disk_threshold: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 90.00,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    alert_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    alert_template_id: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    alert_recipients: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    alert_interval: {
      type: DataTypes.INTEGER,
      defaultValue: 1800,
      validate: {
        min: 60,
        max: 86400,
      },
    },
    last_check_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'unknown',
      validate: {
        isIn: [['online', 'offline', 'error', 'unknown']],
      },
    },
    last_metrics: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: true,
    },
    created_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    updated_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    deleted_by: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  }, {
    tableName: 'owl_server_monitors',
    indexes: [
      { fields: ['ip_address'] },
      { fields: ['enabled'] },
      { fields: ['status'] },
    ],
  });

  ServerMonitor.associate = (models) => {
    ServerMonitor.hasMany(models.ServerMonitorPort, {
      foreignKey: 'server_id',
      as: 'ports',
    });
    ServerMonitor.hasMany(models.ServerMonitorLog, {
      foreignKey: 'server_id',
      as: 'logs',
    });
    ServerMonitor.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });
    ServerMonitor.belongsTo(models.EmailTemplate, {
      foreignKey: 'alert_template_id',
      as: 'alertTemplate',
    });
  };

  return ServerMonitor;
};
