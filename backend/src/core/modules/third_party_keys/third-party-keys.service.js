const crypto = require('crypto');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { Op } = require('sequelize');
const { encryptSecret } = require('./third-party-crypto.service');
const { THIRD_PARTY_SCOPES } = require('./third-party-scopes');

const PRIVATE_ATTRIBUTES = ['secret_ciphertext', 'secret_iv', 'secret_auth_tag'];

function generateCredentials() {
  return {
    api_key: `tpk_${crypto.randomBytes(12).toString('hex')}`,
    api_secret: crypto.randomBytes(32).toString('hex'),
  };
}

async function listKeys({ page = 1, pageSize = 10, client_name = '', status = '' }) {
  const where = {};
  if (client_name.trim()) where.client_name = { [Op.iLike]: `%${client_name.trim()}%` };
  if (status.trim()) where.status = status;

  const { count, rows } = await db.ThirdPartyApiKey.findAndCountAll({
    where,
    offset: (page - 1) * pageSize,
    limit: pageSize,
    attributes: { exclude: PRIVATE_ATTRIBUTES },
    order: [['created_at', 'DESC']],
  });
  return { rows, total: count, page, pageSize };
}

async function getKey(id) {
  const key = await db.ThirdPartyApiKey.findByPk(id, {
    attributes: { exclude: PRIVATE_ATTRIBUTES },
  });
  if (!key) throw ApiError.notFound('第三方签名密钥不存在');
  return key;
}

async function createKey(data, userId) {
  const credentials = generateCredentials();
  const encrypted = encryptSecret(credentials.api_secret);
  const key = await db.ThirdPartyApiKey.create({
    api_key: credentials.api_key,
    ...encrypted,
    client_name: data.client_name.trim(),
    description: data.description || '',
    expires_at: data.expires_at || null,
    remark: data.remark || '',
    scopes: data.scopes,
    status: 'active',
    created_by: userId,
  });
  return {
    id: key.id,
    api_key: key.api_key,
    api_secret: credentials.api_secret,
    client_name: key.client_name,
    scopes: key.scopes,
    status: key.status,
    created_at: key.created_at,
  };
}

async function updateKey(id, data, userId) {
  const key = await db.ThirdPartyApiKey.findByPk(id);
  if (!key) throw ApiError.notFound('第三方签名密钥不存在');
  await key.update({
    client_name: data.client_name?.trim() || key.client_name,
    description: data.description ?? key.description,
    remark: data.remark ?? key.remark,
    scopes: data.scopes ?? key.scopes,
    expires_at: data.expires_at === undefined ? key.expires_at : data.expires_at,
    updated_by: userId,
  });
  return getKey(id);
}

async function changeStatus(id, status, userId) {
  const key = await db.ThirdPartyApiKey.findByPk(id);
  if (!key) throw ApiError.notFound('第三方签名密钥不存在');
  await key.update({ status, updated_by: userId });
  return key;
}

async function regenerateSecret(id, userId) {
  const key = await db.ThirdPartyApiKey.findByPk(id);
  if (!key) throw ApiError.notFound('第三方签名密钥不存在');
  const apiSecret = crypto.randomBytes(32).toString('hex');
  await key.update({ ...encryptSecret(apiSecret), updated_by: userId });
  return {
    api_key: key.api_key,
    api_secret: apiSecret,
    client_name: key.client_name,
    scopes: key.scopes,
    status: key.status,
  };
}

async function deleteKey(id, userId) {
  const key = await db.ThirdPartyApiKey.findByPk(id);
  if (!key) throw ApiError.notFound('第三方签名密钥不存在');
  await key.update({ deleted_by: userId });
  await key.destroy();
}

function listScopes() {
  return THIRD_PARTY_SCOPES;
}

module.exports = {
  listKeys,
  getKey,
  createKey,
  updateKey,
  changeStatus,
  regenerateSecret,
  deleteKey,
  listScopes,
};
