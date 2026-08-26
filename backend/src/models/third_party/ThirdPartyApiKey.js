module.exports = (sequelize, DataTypes) => {
  const ThirdPartyApiKey = sequelize.define(
    'ThirdPartyApiKey',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      api_key: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        comment: 'API密钥（公开标识）',
      },
      secret_ciphertext: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'AES-256-GCM加密后的签名密钥',
      },
      secret_iv: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      secret_auth_tag: {
        type: DataTypes.STRING(32),
        allowNull: false,
      },
      scopes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: [],
        comment: '允许访问的第三方接口权限标识',
      },
      client_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '客户端/第三方系统名称',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '密钥描述',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '密钥状态（active-激活，inactive-禁用）',
      },
      last_used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后使用时间',
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '密钥过期时间（可选，为null表示不过期）',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: '创建者ID',
      },
      remark: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '备注信息',
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
      tableName: 'owl_third_party_api_keys',
      comment: '第三方系统API密钥表',
    }
  );

  ThirdPartyApiKey.associate = (db) => {
    // 可以关联到User表（记录创建者）
    if (db.User) {
      ThirdPartyApiKey.belongsTo(db.User, {
        foreignKey: 'created_by',
        as: 'creator',
      });
    }
  };

  return ThirdPartyApiKey;
};
