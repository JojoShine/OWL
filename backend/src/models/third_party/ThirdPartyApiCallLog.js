module.exports = (sequelize, DataTypes) => sequelize.define('ThirdPartyApiCallLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  third_party_key_id: DataTypes.UUID,
  client_name: DataTypes.STRING(255),
  request_method: { type: DataTypes.STRING(12), allowNull: false },
  request_path: { type: DataTypes.STRING(500), allowNull: false },
  ip_address: DataTypes.STRING(45),
  response_code: { type: DataTypes.INTEGER, allowNull: false },
  response_time: { type: DataTypes.INTEGER, allowNull: false },
  failure_reason: DataTypes.STRING(100),
}, {
  tableName: 'owl_third_party_api_call_logs',
});
