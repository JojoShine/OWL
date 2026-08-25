import { describe, expect, it } from 'vitest';

const previewAuthModulePromise = import('./ui-preview-auth').catch((loadError) => ({ loadError }));

function createStorage(initialEntries = {}) {
  const entries = new Map(Object.entries(initialEntries));

  return {
    getItem(key) {
      return entries.has(key) ? entries.get(key) : null;
    },
    setItem(key, value) {
      entries.set(key, String(value));
    },
    removeItem(key) {
      entries.delete(key);
    },
  };
}

async function getSyncUiPreviewAuth() {
  const previewAuthModule = await previewAuthModulePromise;
  expect(previewAuthModule.loadError).toBeUndefined();
  return previewAuthModule.syncUiPreviewAuth;
}

describe('syncUiPreviewAuth', () => {
  it('writes the exact fixed identity only for an explicit local development preview', async () => {
    const syncUiPreviewAuth = await getSyncUiPreviewAuth();
    const storage = createStorage();

    expect(syncUiPreviewAuth({
      storage,
      nodeEnv: 'development',
      previewEnabled: 'true',
      hostname: 'localhost',
    })).toBe(true);
    expect(storage.getItem('__platform_id')).toBe('ui-preview');
    expect(storage.getItem('ui-preview__token')).toBe('preview-only');
    expect(JSON.parse(storage.getItem('ui-preview__user'))).toEqual({
      id: 'preview',
      username: 'preview',
      real_name: 'UI Preview',
      email: 'preview@example.invalid',
      roles: [{ code: 'super_admin' }],
    });
  });

  it('removes only the reserved preview namespace when the flag is disabled', async () => {
    const syncUiPreviewAuth = await getSyncUiPreviewAuth();
    const storage = createStorage({
      'tenant-a__token': 'real-token',
      'tenant-a__user': '{"id":"real"}',
    });

    syncUiPreviewAuth({
      storage,
      nodeEnv: 'development',
      previewEnabled: 'true',
      hostname: '127.0.0.1',
    });
    expect(syncUiPreviewAuth({
      storage,
      nodeEnv: 'development',
      previewEnabled: 'false',
      hostname: '127.0.0.1',
    })).toBe(false);

    expect(storage.getItem('__platform_id')).toBeNull();
    expect(storage.getItem('ui-preview__token')).toBeNull();
    expect(storage.getItem('ui-preview__user')).toBeNull();
    expect(storage.getItem('tenant-a__token')).toBe('real-token');
    expect(storage.getItem('tenant-a__user')).toBe('{"id":"real"}');
  });

  it('does not restore preview auth in production and removes a reserved stale identity', async () => {
    const syncUiPreviewAuth = await getSyncUiPreviewAuth();
    const storage = createStorage({
      __platform_id: 'ui-preview',
      'ui-preview__token': 'preview-only',
      'ui-preview__user': '{"roles":[{"code":"super_admin"}]}',
    });

    expect(syncUiPreviewAuth({
      storage,
      nodeEnv: 'production',
      previewEnabled: 'true',
      hostname: 'localhost',
    })).toBe(false);
    expect(storage.getItem('__platform_id')).toBeNull();
    expect(storage.getItem('ui-preview__token')).toBeNull();
    expect(storage.getItem('ui-preview__user')).toBeNull();
  });

  it('does not bootstrap on a non-loopback host or clear a non-preview namespace', async () => {
    const syncUiPreviewAuth = await getSyncUiPreviewAuth();
    const storage = createStorage({
      __platform_id: 'tenant-a',
      'tenant-a__token': 'real-token',
      'tenant-a__user': '{"id":"real"}',
    });

    expect(syncUiPreviewAuth({
      storage,
      nodeEnv: 'development',
      previewEnabled: 'true',
      hostname: 'admin.example.com',
    })).toBe(false);
    expect(storage.getItem('__platform_id')).toBe('tenant-a');
    expect(storage.getItem('tenant-a__token')).toBe('real-token');
    expect(storage.getItem('tenant-a__user')).toBe('{"id":"real"}');
    expect(storage.getItem('ui-preview__token')).toBeNull();
  });
});
