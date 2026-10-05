const REQUIRED_PRODUCTION_VARIABLES = [
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MINIO_ENDPOINT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'CORS_ORIGIN',
];

const PORT_VARIABLES = ['PORT', 'DB_PORT', 'REDIS_PORT', 'MINIO_PORT', 'SMTP_PORT'];

function validateRuntimeConfig(env = process.env) {
  const errors = [];

  if (env.NODE_ENV === 'production') {
    const missing = REQUIRED_PRODUCTION_VARIABLES.filter((name) => !env[name]?.trim());
    if (missing.length > 0) errors.push(`缺少生产环境配置：${missing.join(', ')}`);
  }

  for (const name of PORT_VARIABLES) {
    if (!env[name]) continue;
    const value = Number(env[name]);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      errors.push(`${name} 必须是 1-65535 之间的整数`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`运行配置无效：\n- ${errors.join('\n- ')}`);
  }
}

module.exports = { validateRuntimeConfig };
