const { Client } = require('pg');
const { databaseUrl } = require('../../dist/nest/database/connection');
const json = value => JSON.parse(JSON.stringify(value, (_key,item) => typeof item === 'bigint' ? item.toString() : item));
async function assertRowsMatchPostgres(db, tables) {
  const connection = new Client({ connectionString: databaseUrl() });
  await connection.connect();
  try {
    for (const table of tables) {
      const raw = (await connection.query(`SELECT * FROM "${table}" WHERE deleted_at IS NULL ORDER BY id LIMIT 100`)).rows;
      const rows = await db[table].findMany({where:{deletedAt:null},take:100,orderBy:{id:'asc'}});
      const expected = raw.map(row => Object.fromEntries(Object.entries(row).map(([key,value]) => [{created_at:'createdAt',updated_at:'updatedAt',deleted_at:'deletedAt'}[key] || key,value])));
      expect(json(rows)).toEqual(json(expected));
    }
  } finally { await connection.end(); }
}
module.exports = { assertRowsMatchPostgres, json };
