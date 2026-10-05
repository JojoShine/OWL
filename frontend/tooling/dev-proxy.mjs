// Same-origin requests already passed through the loopback Vite server.
// Preserve foreign Origin headers so the backend can still reject them.
export function forwardLocalOrigin(proxyRequest, request) {
  if (!request.headers.origin) return;
  try {
    const origin = new URL(request.headers.origin);
    if (origin.host === request.headers.host && ['127.0.0.1', 'localhost', '[::1]'].includes(origin.hostname)) {
      proxyRequest.removeHeader('origin');
    }
  } catch { /* Leave malformed origins for the backend to reject. */ }
}
