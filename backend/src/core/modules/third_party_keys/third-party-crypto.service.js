const crypto = require('crypto');
const ApiError = require('../../../utils/ApiError');

function getEncryptionKey() {
  const configured = process.env.THIRD_PARTY_SECRET_ENCRYPTION_KEY;
  if (!configured) throw ApiError.internal('第三方密钥加密配置缺失');

  const key = /^[a-f\d]{64}$/i.test(configured)
    ? Buffer.from(configured, 'hex')
    : Buffer.from(configured, 'base64');
  if (key.length !== 32) throw ApiError.internal('第三方密钥加密配置无效');
  return key;
}

function encryptSecret(secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
  return {
    secret_ciphertext: ciphertext.toString('base64'),
    secret_iv: iv.toString('hex'),
    secret_auth_tag: cipher.getAuthTag().toString('hex'),
  };
}

function decryptSecret(record) {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(record.secret_iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(record.secret_auth_tag, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(record.secret_ciphertext, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

function canonicalizeQuery(query = {}) {
  return Object.entries(query)
    .flatMap(([key, value]) => (Array.isArray(value) ? value.map((item) => [key, item]) : [[key, value]]))
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [encodeURIComponent(key), encodeURIComponent(String(value))])
    .sort(([keyA, valueA], [keyB, valueB]) => keyA.localeCompare(keyB) || valueA.localeCompare(valueB))
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
}

function buildCanonicalRequest({ method, path, query, timestamp, nonce, rawBody }) {
  const queryString = canonicalizeQuery(query);
  const pathAndQuery = queryString ? `${path}?${queryString}` : path;
  const bodyHash = crypto.createHash('sha256').update(rawBody || Buffer.alloc(0)).digest('hex');
  return [method.toUpperCase(), pathAndQuery, String(timestamp), String(nonce), bodyHash].join('\n');
}

function createSignature(canonicalRequest, secret) {
  return crypto.createHmac('sha256', secret).update(canonicalRequest).digest('hex');
}

function signaturesMatch(provided, expected) {
  if (!/^[a-f\d]{64}$/i.test(provided || '')) return false;
  return crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
}

module.exports = {
  encryptSecret,
  decryptSecret,
  canonicalizeQuery,
  buildCanonicalRequest,
  createSignature,
  signaturesMatch,
};
