const crypto = require('crypto');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const { redisClient, isRedisAvailable } = require('../../../config/redis');

function getPepper() {
  if (!process.env.API_KEY_PEPPER) throw ApiError.internal('SQL API 密钥安全配置缺失');
  return process.env.API_KEY_PEPPER;
}

function digestKey(apiKey) {
  return crypto.createHmac('sha256', getPepper()).update(apiKey).digest('hex');
}

function generateKey() {
  return `oak_${crypto.randomBytes(32).toString('hex')}`;
}

function displayPrefix(apiKey) {
  return `${apiKey.slice(0, 12)}…${apiKey.slice(-4)}`;
}

async function validateInterfaces(interfaceIds, transaction) {
  const uniqueIds = [...new Set(interfaceIds || [])];
  if (!uniqueIds.length) throw ApiError.badRequest('请至少授权一个 SQL 接口');
  const count = await db.ApiInterface.count({ where: { id: uniqueIds }, transaction });
  if (count !== uniqueIds.length) throw ApiError.badRequest('授权接口中包含无效记录');
  return uniqueIds;
}

async function replaceAssignments(apiKeyId, interfaceIds, userId, transaction) {
  await db.ApiKeyInterface.destroy({ where: { api_key_id: apiKeyId }, transaction, force: true });
  await db.ApiKeyInterface.bulkCreate(
    interfaceIds.map((interfaceId) => ({
      api_key_id: apiKeyId,
      interface_id: interfaceId,
      created_by: userId,
    })),
    { transaction }
  );
}

async function listKeys(userId, { interfaceId } = {}) {
  const include = [{
    model: db.ApiInterface,
    as: 'interfaces',
    attributes: ['id', 'name', 'endpoint', 'method', 'version'],
    through: { attributes: [] },
    ...(interfaceId ? { where: { id: interfaceId }, required: true } : {}),
  }];
  return db.ApiKey.findAll({
    where: { created_by: userId },
    attributes: { exclude: ['key_hash'] },
    include,
    order: [['created_at', 'DESC']],
  });
}

async function createKey(data, userId) {
  const transaction = await db.sequelize.transaction();
  try {
    const interfaceIds = await validateInterfaces(data.interface_ids, transaction);
    const rawKey = generateKey();
    const expiresAt = data.expires_at
      ? new Date(data.expires_at)
      : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const key = await db.ApiKey.create({
      client_name: data.client_name.trim(),
      description: data.description || '',
      key_prefix: displayPrefix(rawKey),
      key_hash: digestKey(rawKey),
      status: 'active',
      expires_at: expiresAt,
      created_by: userId,
    }, { transaction });
    await replaceAssignments(key.id, interfaceIds, userId, transaction);
    await transaction.commit();
    return {
      id: key.id,
      client_name: key.client_name,
      api_key: rawKey,
      key_prefix: key.key_prefix,
      expires_at: key.expires_at,
      interface_ids: interfaceIds,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function updateKey(id, data, userId) {
  const transaction = await db.sequelize.transaction();
  try {
    const key = await db.ApiKey.findOne({ where: { id, created_by: userId }, transaction });
    if (!key) throw ApiError.notFound('接口密钥不存在');
    const interfaceIds = await validateInterfaces(data.interface_ids, transaction);
    await key.update({
      client_name: data.client_name.trim(),
      description: data.description || '',
      expires_at: data.expires_at ? new Date(data.expires_at) : key.expires_at,
      updated_by: userId,
    }, { transaction });
    await replaceAssignments(id, interfaceIds, userId, transaction);
    await transaction.commit();
    return key;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function changeStatus(id, status, userId) {
  const key = await db.ApiKey.findOne({ where: { id, created_by: userId } });
  if (!key) throw ApiError.notFound('接口密钥不存在');
  await key.update({ status, updated_by: userId });
  return key;
}

async function regenerateKey(id, userId) {
  const key = await db.ApiKey.findOne({ where: { id, created_by: userId } });
  if (!key) throw ApiError.notFound('接口密钥不存在');
  const rawKey = generateKey();
  await key.update({
    key_prefix: displayPrefix(rawKey),
    key_hash: digestKey(rawKey),
    expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    status: 'active',
    updated_by: userId,
  });
  return { id: key.id, client_name: key.client_name, api_key: rawKey, key_prefix: key.key_prefix };
}

async function deleteKey(id, userId) {
  const key = await db.ApiKey.findOne({ where: { id, created_by: userId } });
  if (!key) throw ApiError.notFound('接口密钥不存在');
  await key.update({ deleted_by: userId });
  await key.destroy();
}

async function authenticate(rawKey) {
  const key = await db.ApiKey.findOne({ where: { key_hash: digestKey(rawKey) } });
  if (!key) throw ApiError.unauthorized('接口密钥无效');
  if (key.status !== 'active' || new Date(key.expires_at) <= new Date()) {
    throw ApiError.forbidden('接口密钥不可用');
  }
  return key;
}

async function authorizeInterface(key, interface_) {
  const assignment = await db.ApiKeyInterface.findOne({
    where: { api_key_id: key.id, interface_id: interface_.id },
  });
  if (!assignment) throw ApiError.forbidden('接口密钥未获得当前接口授权');
  if (!isRedisAvailable()) throw ApiError.serviceUnavailable('接口限流服务暂不可用');

  const minute = Math.floor(Date.now() / 60000);
  const rateKey = `sql-api:rate:${key.id}:${interface_.id}:${minute}`;
  const count = await redisClient.incr(rateKey);
  if (count === 1) await redisClient.expire(rateKey, 60);
  if (count > interface_.rate_limit) throw ApiError.tooManyRequests('接口调用频率超限');

  key.update({ last_used_at: new Date() }).catch(() => {});
}

module.exports = {
  listKeys,
  createKey,
  updateKey,
  changeStatus,
  regenerateKey,
  deleteKey,
  authenticate,
  authorizeInterface,
  digestKey,
};
