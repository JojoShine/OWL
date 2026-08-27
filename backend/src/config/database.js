require('dotenv').config();
const { databaseAccessLogger } = require('./logger');

// PostgreSQL 日志函数
// Sequelize logging 函数签名: (sql, timing, connection)
const pgLogging = (sql, timing) => {
  // 开发环境记录所有SQL，生产环境只记录慢查询（超过100ms）
  const shouldLog = process.env.NODE_ENV === 'development' || (typeof timing === 'number' && timing > 100);

  if (shouldLog && sql) {
    try {
      // 只处理数字类型的 timing
      const timingValue = typeof timing === 'number' ? `${timing}ms` : 'N/A';

      databaseAccessLogger.info(JSON.stringify({
        type: 'postgresql',
        action: 'query',
        sql: typeof sql === 'string' ? sql : String(sql),
        timing: timingValue,
        timestamp: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Failed to log PostgreSQL query:', error.message);
    }
  }
};

// Sequelize 全局配置
// 所有 Model 都会继承这些配置
const globalSequelizeConfig = {
  timestamps: true,        // 自动添加 created_at, updated_at
  paranoid: true,          // 自动添加 deleted_at，启用逻辑删除
  underscored: true,       // 自动转换为蛇形命名（camelCase -> snake_case）
  charset: 'utf8mb4',      // 支持 emoji 和其他 Unicode 字符
  collate: 'utf8mb4_unicode_ci',
};

const cliStorageConfig = {
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'SequelizeMeta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'SequelizeData',
};

module.exports = {
  // 全局 Sequelize 配置（导出供 models/index.js 使用）
  globalSequelizeConfig,

  development: {
    ...cliStorageConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'admin_platform',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'production' ? false : pgLogging,
    pool: {
      max: 15,
      min: 2,
      acquire: 15000,
      idle: 10000,       // 缩短到10秒，避免被数据库端断开
      evict: 5000,       // 每5秒检查并清除失效连接
    },
    dialectOptions: {
      keepAlive: true,   // 开启 TCP keepalive，防止连接被静默断开
    },
  },
  test: {
    ...cliStorageConfig,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME_TEST || 'admin_platform_test',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // 测试环境不记录日志
  },
  production: {
    ...cliStorageConfig,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: process.env.DB_LOGGING === 'true' ? pgLogging : false,
    pool: {
      max: 20,
      min: 5,
      acquire: 15000,
      idle: 10000,       // 缩短到10秒
      evict: 5000,       // 每5秒检查并清除失效连接
    },
    dialectOptions: {
      keepAlive: true,   // 开启 TCP keepalive
    },
  },
};
