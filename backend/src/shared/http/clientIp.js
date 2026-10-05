const DEFAULT_TRUST_PROXY = ['loopback', 'linklocal', 'uniquelocal'];

function parseTrustProxy(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TRUST_PROXY;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['false', 'off', 'no', '0'].includes(normalized)) return false;
  if (['true', 'on', 'yes'].includes(normalized)) return true;
  if (/^\d+$/.test(normalized)) return Number(normalized);

  return String(value)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeIpAddress(value) {
  if (!value) return 'unknown';

  let ip = String(value).split(',')[0].trim().replace(/^"|"$/g, '');

  if (ip.startsWith('[')) {
    const closingBracket = ip.indexOf(']');
    if (closingBracket > 0) ip = ip.slice(1, closingBracket);
  }

  if (ip.toLowerCase().startsWith('::ffff:')) {
    ip = ip.slice(7);
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/.test(ip)) {
    ip = ip.slice(0, ip.lastIndexOf(':'));
  }

  return ip || 'unknown';
}

function clientIpMiddleware(req, res, next) {
  req.clientIp = normalizeIpAddress(req.ip || req.socket?.remoteAddress);
  next();
}

module.exports = {
  clientIpMiddleware,
  normalizeIpAddress,
  parseTrustProxy,
};
