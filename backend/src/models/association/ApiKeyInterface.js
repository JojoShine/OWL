module.exports = (sequelize, DataTypes) => sequelize.define('ApiKeyInterface', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  api_key_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  interface_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  created_by: {
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'owl_api_key_interfaces',
});
