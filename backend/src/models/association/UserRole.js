module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '用户ID',
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '角色ID',
    },
  }, {
    tableName: 'owl_user_roles',
  });

  UserRole.associate = (models) => {
    // 关联表属于用户
    UserRole.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });

    // 关联表属于角色
    UserRole.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });
  };

  return UserRole;
};
