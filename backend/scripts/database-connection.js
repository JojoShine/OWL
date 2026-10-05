function databaseUrl(env = process.env) {
  const url = new URL('postgresql://localhost');
  url.hostname = env.DB_HOST || 'localhost';
  url.port = env.DB_PORT || '5432';
  url.username = encodeURIComponent(env.DB_USER || 'postgres');
  url.password = encodeURIComponent(env.DB_PASSWORD || 'postgres');
  const database = env.NODE_ENV === 'test' ? env.DB_NAME_TEST || 'admin_platform_test' : env.DB_NAME || 'admin_platform';
  url.pathname = `/${encodeURIComponent(database)}`;
  return url.toString();
}

module.exports = { databaseUrl };
