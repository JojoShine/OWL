import { createApplication } from './nest/bootstrap';

async function main() {
  const app = await createApplication();
  try {
    await app.listen(Number(process.env.PORT || 3001), process.env.HOST || '127.0.0.1');
  } catch (error) {
    await app.close();
    throw error;
  }
}
main().catch((error) => { console.error('Backend startup failed:', error); process.exit(1); });
