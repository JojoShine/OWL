import { loadEnvironment } from './scripts/database-environment';
loadEnvironment();
import { defineConfig } from 'prisma/config';
import { databaseUrl } from './scripts/database-connection';

export default defineConfig({ schema: 'prisma/schema.prisma', migrations: { path: 'prisma/migrations', seed: 'node scripts/database-cli.js seed' }, datasource: { url: databaseUrl() } });
