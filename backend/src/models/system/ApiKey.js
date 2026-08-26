module.exports = (sequelize, DataTypes) => {
  const ApiKey = sequelize.define(
    'ApiKey',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '厂商或业务应用名称',
      },
      key_prefix: {
        type: DataTypes.STRING(24),
        allowNull: false,
        comment: '用于识别密钥的安全前缀',
      },
      key_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'API密钥HMAC-SHA256摘要',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '密钥用途说明',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '密钥状态',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: '密钥过期时间',
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后使用时间',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
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
        comment: '删除者ID（用于软删除）',
      },
    },
    {
      tableName: 'owl_api_keys',
    }
  );

  ApiKey.associate = (db) => {
    ApiKey.belongsToMany(db.ApiInterface, {
      through: db.ApiKeyInterface,
      foreignKey: 'api_key_id',
      otherKey: 'interface_id',
      as: 'interfaces',
    });
    ApiKey.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });
  };

  return ApiKey;
};
