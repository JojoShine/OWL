const { Sequelize } = require('sequelize');
const config = require('../config/database');
const { logger, databaseAccessLogger } = require('../config/logger');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 处理 logging 配置
let loggingConfig = false;
if (dbConfig.logging) {
  // 如果配置的是函数，直接使用（如 pgLogging）
  if (typeof dbConfig.logging === 'function') {
    loggingConfig = dbConfig.logging;
  } else {
    // 否则使用默认的 debug 日志
    loggingConfig = (msg) => logger.debug(msg);
  }
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: loggingConfig,
    pool: dbConfig.pool,
    timezone: '+08:00', // 设置时区为中国标准时间（UTC+8）
    define: config.globalSequelizeConfig, // 应用全局 Model 配置
    benchmark: true, // 启用基准测试，提供查询执行时间
    logQueryParameters: true, // 记录查询参数
  }
);

const db = {};

// ========== System Models ==========
// 用户、角色、权限、菜单等系统模型
db.User = require('./system/User')(sequelize, Sequelize.DataTypes);
db.Role = require('./system/Role')(sequelize, Sequelize.DataTypes);
db.Permission = require('./system/Permission')(sequelize, Sequelize.DataTypes);
db.Menu = require('./system/Menu')(sequelize, Sequelize.DataTypes);
db.Department = require('./system/Department')(sequelize, Sequelize.DataTypes);
db.Folder = require('./system/Folder')(sequelize, Sequelize.DataTypes);
db.File = require('./system/File')(sequelize, Sequelize.DataTypes);
db.FileShare = require('./system/FileShare')(sequelize, Sequelize.DataTypes);
db.FilePermission = require('./system/FilePermission')(sequelize, Sequelize.DataTypes);
db.Dictionary = require('./system/Dictionary')(sequelize, Sequelize.DataTypes);
db.ApiInterface = require('./system/ApiInterface')(sequelize, Sequelize.DataTypes);
db.ApiKey = require('./system/ApiKey')(sequelize, Sequelize.DataTypes);
db.ApiCallLog = require('./system/ApiCallLog')(sequelize, Sequelize.DataTypes);
db.WatermarkConfig = require('./system/WatermarkConfig')(sequelize, Sequelize.DataTypes);
db.SystemConfig = require('./system/SystemConfig')(sequelize, Sequelize.DataTypes);
db.DashboardWidget = require('./system/DashboardWidget')(sequelize, Sequelize.DataTypes);
db.SensitiveField = require('./system/SensitiveField')(sequelize, Sequelize.DataTypes);

// ========== Monitor Models ==========
// 监控告警相关模型
db.MonitorMetric = require('./monitor/MonitorMetric')(sequelize, Sequelize.DataTypes);
db.ApiMonitor = require('./monitor/ApiMonitor')(sequelize, Sequelize.DataTypes);
db.ApiMonitorLog = require('./monitor/ApiMonitorLog')(sequelize, Sequelize.DataTypes);
db.AlertRule = require('./monitor/AlertRule')(sequelize, Sequelize.DataTypes);
db.AlertHistory = require('./monitor/AlertHistory')(sequelize, Sequelize.DataTypes);
db.ServerMonitor = require('./monitor/ServerMonitor')(sequelize, Sequelize.DataTypes);
db.ServerMonitorPort = require('./monitor/ServerMonitorPort')(sequelize, Sequelize.DataTypes);
db.ServerMonitorLog = require('./monitor/ServerMonitorLog')(sequelize, Sequelize.DataTypes);

// ========== Notification Models ==========
// 邮件、通知相关模型
db.Notification = require('./notification/Notification')(sequelize, Sequelize.DataTypes);
db.EmailLog = require('./notification/EmailLog')(sequelize, Sequelize.DataTypes);
db.NotificationSettings = require('./notification/NotificationSettings')(sequelize, Sequelize.DataTypes);
db.EmailTemplate = require('./notification/EmailTemplate')(sequelize, Sequelize.DataTypes);
db.EmailTask = require('./notification/EmailTask')(sequelize, Sequelize.DataTypes);
db.EmailTask = require('./notification/EmailTask')(sequelize, Sequelize.DataTypes);

// ========== Generator Models ==========
// 代码生成器相关模型
db.GeneratedModule = require('./generator/GeneratedModule')(sequelize, Sequelize.DataTypes);
db.GeneratedField = require('./generator/GeneratedField')(sequelize, Sequelize.DataTypes);
db.GenerationHistory = require('./generator/GenerationHistory')(sequelize, Sequelize.DataTypes);

// ========== Association Models ==========
// 中间关联表
db.UserRole = require('./association/UserRole')(sequelize, Sequelize.DataTypes);
db.RolePermission = require('./association/RolePermission')(sequelize, Sequelize.DataTypes);
db.RoleMenu = require('./association/RoleMenu')(sequelize, Sequelize.DataTypes);
db.ApiKeyInterface = require('./association/ApiKeyInterface')(sequelize, Sequelize.DataTypes);

// ========== Third Party Models ==========
// 第三方对接相关模型
db.ThirdPartyApiKey = require('./third_party/ThirdPartyApiKey')(sequelize, Sequelize.DataTypes);
db.ThirdPartyApiCallLog = require('./third_party/ThirdPartyApiCallLog')(sequelize, Sequelize.DataTypes);
db.ZabbixInstance = require('./third_party/ZabbixInstance')(sequelize, Sequelize.DataTypes);
db.ZabbixHost = require('./third_party/ZabbixHost')(sequelize, Sequelize.DataTypes);

// 动态生成的模型会在代码生成时自动注册到这里
// (使用原生SQL时无需在此注册)

// 设置模型关联
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// 应用审计字段 Hook
const auditHooksManager = require('../utils/hooks/audit-fields.hook')(sequelize);
auditHooksManager.setupAllAuditHooks(db);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
