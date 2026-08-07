module.exports = (sequelize, DataTypes) => {
  const RoleMenu = sequelize.define('RoleMenu', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    role_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '角色ID',
    },
    menu_id: {
      type: DataTypes.UUID,
      allowNull: false,
      comment: '菜单ID',
    },
  }, {
    tableName: 'owl_role_menus',
  });

  RoleMenu.associate = (models) => {
    // 关联表属于角色
    RoleMenu.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });

    // 关联表属于菜单
    RoleMenu.belongsTo(models.Menu, {
      foreignKey: 'menu_id',
      as: 'menu',
    });
  };

  return RoleMenu;
};
