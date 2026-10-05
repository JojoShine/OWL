const { databaseUrl } = require('../../dist/nest/database/connection');
const { parse } = require('pg-connection-string');
it('preserves DB credentials containing URL escape sequences and delimiters', () => {
  for (const password of ['test%40value', 'test%25value', 'a@b:c/d?#%', '中文密码']) {
    const value = parse(databaseUrl({ DB_USER: 'user%40name', DB_PASSWORD: password, DB_NAME: 'db space%20' }));
    expect(value.user).toBe('user%40name');
    expect(value.password).toBe(password);
    expect(value.database).toBe('db space%20');
  }
});
