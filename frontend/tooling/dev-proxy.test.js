import { expect, it, vi } from 'vitest';
import { forwardLocalOrigin } from './dev-proxy.mjs';
it('forwards same-origin local development POSTs without changing backend CORS', () => {
  const proxy = { removeHeader: vi.fn() };
  forwardLocalOrigin(proxy, { headers: { host: '127.0.0.1:4173', origin: 'http://127.0.0.1:4173' } });
  expect(proxy.removeHeader).toHaveBeenCalledWith('origin');
});
it.each(['https://foreign.example', 'http://127.0.0.1:9999', 'null', 'invalid'])('preserves an untrusted Origin %s', (origin) => {
  const proxy = { removeHeader: vi.fn() };
  forwardLocalOrigin(proxy, { headers: { host: '127.0.0.1:4173', origin } });
  expect(proxy.removeHeader).not.toHaveBeenCalled();
});
