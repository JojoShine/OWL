module.exports = (sequelize, DataTypes) => {
  const ApiInterface = sequelize.define(
    'ApiInterface',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '接口名称',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '接口描述',
      },
      sql_query: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'SQL查询语句',
      },
      method: {
        type: DataTypes.ENUM('GET', 'POST', 'PUT', 'DELETE'),
        defaultValue: 'GET',
        comment: '请求方式',
      },
      endpoint: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: '接口端点路径',
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        comment: '接口版本号',
      },
      parameters: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '接口参数定义',
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
        comment: '接口状态',
      },
      require_auth: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '是否需要认证',
      },
      rate_limit: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        comment: '每分钟请求限制',
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
      tableName: 'owl_api_interfaces',
    }
  );

  ApiInterface.associate = (db) => {
    ApiInterface.belongsTo(db.User, {
      foreignKey: 'created_by',
      as: 'creator',
    });
    ApiInterface.belongsToMany(db.ApiKey, {
      through: db.ApiKeyInterface,
      foreignKey: 'interface_id',
      otherKey: 'api_key_id',
      as: 'keys',
    });
  };

  // 自定义 toJSON 方法，返回普通对象，避免 JSON.stringify 再次转换时间
  ApiInterface.prototype.toJSON = function() {
    const values = this.get({ plain: true });
    return values;
  };

  return ApiInterface;
};
