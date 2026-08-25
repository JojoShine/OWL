// @vitest-environment node

import { readFile } from 'node:fs/promises';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const previewModulePromise = import('./ui-preview-server.mjs').catch((loadError) => ({ loadError }));
const openServers = new Set();

async function startPreviewServer() {
  const previewModule = await previewModulePromise;
  expect(previewModule.loadError).toBeUndefined();

  if (previewModule.loadError) return null;

  const server = previewModule.createPreviewServer();
  openServers.add(server);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');

  const address = server.address();
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all([...openServers].map(async (server) => {
    if (server.listening) {
      server.close();
      await once(server, 'close');
    }
  }));
  openServers.clear();
});

describe('read-only UI preview isolation', () => {
  it('serves the fixed users sample and filters it without leaving the local server', async () => {
    const origin = await startPreviewServer();
    if (!origin) return;

    const response = await fetch(`${origin}/api/system/users?search=%E6%9D%8E%E5%9B%9B&page=1&limit=5`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4173');
    expect(body).toEqual({
      success: true,
      data: {
        items: [expect.objectContaining({ id: 2, username: 'lisi', real_name: '李四' })],
        pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      },
    });
  });

  it('rejects user writes instead of forwarding them', async () => {
    const origin = await startPreviewServer();
    if (!origin) return;

    const response = await fetch(`${origin}/api/system/users/1`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' }),
    });

    expect(response.status).toBe(409);
    expect(response.headers.get('access-control-allow-origin')).toBe('http://localhost:4173');
    expect(await response.json()).toEqual({ success: false, message: 'UI preview is read only' });
  });

  it('allows the QA environment to disable Socket connections explicitly', async () => {
    const socketContextPath = fileURLToPath(new URL('../contexts/SocketContext.jsx', import.meta.url));
    const source = await readFile(socketContextPath, 'utf8');

    expect(source).toContain("if (process.env.NEXT_PUBLIC_DISABLE_SOCKET === 'true') return null;");
  });
});
