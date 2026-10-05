import { afterEach, expect, it, vi } from 'vitest';
import { getFullApiUrl } from './api-url';
afterEach(() => vi.unstubAllEnvs());
it('provides an absolute URL for copied API commands under a subpath', () => {
  vi.stubEnv('BASE_URL', '/owl/');
  vi.stubEnv('VITE_API_URL', '');
  expect(getFullApiUrl('/orders')).toBe(`${window.location.origin}/owl/api/custom/orders`);
});
it('preserves a configured remote API origin and existing custom prefix', () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example.test/api/system');
  expect(getFullApiUrl('/custom/orders')).toBe('https://api.example.test/api/custom/orders');
});
