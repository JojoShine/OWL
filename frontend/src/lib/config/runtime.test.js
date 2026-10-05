import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBasePath, getApiRoot, getBackendBaseUrl, getSocketPath } from './runtime';
import { resolveApiBaseUrl } from '../utils/create-http-client';
import { uploadApi } from '../api/system/upload.api';

afterEach(() => vi.unstubAllEnvs());
describe('static deployment endpoints', () => {
  it.each(['/', '/owl/'])('keeps root, APIs and sockets aligned for %s', (base) => {
    vi.stubEnv('BASE_URL', base);
    vi.stubEnv('VITE_API_URL', '');
    vi.stubEnv('VITE_BASE_URL', '');
    const prefix = base.replace(/\/$/, '');
    expect(getBasePath()).toBe(prefix);
    expect(getApiRoot()).toBe(`${prefix}/api`);
    expect(resolveApiBaseUrl('system')).toBe(`${prefix}/api/system`);
    expect(resolveApiBaseUrl('public')).toBe(`${prefix}/api/public`);
    expect(getSocketPath()).toBe(`${prefix}/socket.io/`);
    expect(getBackendBaseUrl()).toBe(prefix);
    expect(uploadApi.getFileStreamUrl('owl/logo.png')).toBe(`${prefix}/api/system/upload/stream?path=owl%2Flogo.png`);
  });
  it('normalizes legacy system suffix without duplicating it', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.example.test/api/system/');
    expect(resolveApiBaseUrl('public')).toBe('https://api.example.test/api/public');
    expect(uploadApi.getFileStreamUrl('a')).toBe('https://api.example.test/api/system/upload/stream?path=a');
  });
});
