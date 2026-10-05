const fs = require('fs'), path = require('path'), os = require('os');
const { spawnSync } = require('child_process');
it('uses the same .env.local target in database commands and direct Prisma seed configuration', () => {
  const root = path.resolve(__dirname,'..'), temp = fs.mkdtempSync(path.join(os.tmpdir(),'owl-prisma-env-'));
  try {
    for (const directory of ['scripts']) fs.cpSync(path.join(root,directory),path.join(temp,directory),{recursive:true});
    fs.copyFileSync(path.join(root,'prisma.config.ts'),path.join(temp,'prisma.config.ts'));
    fs.cpSync(path.join(root,'prisma'),path.join(temp,'prisma'),{recursive:true});
    fs.symlinkSync(path.join(root,'node_modules'),path.join(temp,'node_modules'),'dir');
    fs.writeFileSync(path.join(temp,'.env'),'DB_NAME=wrong_target\n');
    fs.writeFileSync(path.join(temp,'.env.local'),'DB_NAME=local_target\n');
    const env = {...process.env,NODE_ENV:'development'};
    for (const name of Object.keys(env)) if (name.startsWith('DB_')) delete env[name];
    for (const script of [
      "require('./scripts/database-cli').loadEnvironment();console.log(process.env.DB_NAME)",
      "require('@prisma/config').loadConfigFromFile({configRoot:process.cwd()}).then(r=>{if(r.error)throw Error(JSON.stringify(r.error));console.log(new URL(r.config.datasource.url).pathname.slice(1))})",
    ]) {
      const result = spawnSync(process.execPath,['-e',script],{cwd:temp,env,encoding:'utf8',timeout:15000});
      expect(result.status).toBe(0); expect(result.stdout.trim()).toBe('local_target');
    }
  } finally { fs.rmSync(temp,{recursive:true,force:true}); }
});
