module.exports = (sequelize, DataTypes) => sequelize.define('ApiCallLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  interface_id: { type: DataTypes.UUID, allowNull: false },
  api_key_id: DataTypes.UUID,
  request_method: DataTypes.STRING(20),
  response_code: DataTypes.INTEGER,
  response_time: DataTypes.INTEGER,
  error_message: DataTypes.STRING(500),
  ip_address: DataTypes.STRING(45),
}, {
  tableName: 'owl_api_call_logs',
});
