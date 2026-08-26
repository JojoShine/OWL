const thirdPartyKeysService = require('./third-party-keys.service');
const ApiError = require('../../../utils/ApiError');
const { logger } = require('../../../config/logger');
const { success, paginated, created } = require('../../../utils/response');

/**
 * 获取密钥列表
 */
exports.getList = async (req, res, next) => {
  try {
    const { page, pageSize, client_name, status } = req.query;

    const result = await thirdPartyKeysService.listKeys({
      page: parseInt(page) || 1,
      pageSize: parseInt(pageSize) || 10,
      client_name: client_name || '',
      status: status || '',
    });

    paginated(res, result.rows, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    }, '获取密钥列表成功');
  } catch (error) {
    logger.error('Error getting API key list:', error);
    next(error);
  }
};

exports.getScopes = (req, res) => {
  success(res, thirdPartyKeysService.listScopes(), '获取权限范围成功');
};

exports.getOne = async (req, res, next) => {
  try {
    success(res, await thirdPartyKeysService.getKey(req.params.id), '获取签名密钥成功');
  } catch (error) {
    next(error);
  }
};

/**
 * 创建新密钥
 */
exports.create = async (req, res, next) => {
  try {
    const { client_name, description, expires_at, remark, scopes } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized('无法获取当前用户信息');
    }

    const key = await thirdPartyKeysService.createKey(
      {
        client_name,
        description,
        expires_at,
        remark,
        scopes,
      },
      userId
    );

    logger.info('API key created', {
      api_key: key.api_key,
      client_name: key.client_name,
      created_by: userId,
    });

    created(res, key, '密钥创建成功');
  } catch (error) {
    logger.error('Error creating API key:', error);
    next(error);
  }
};

/**
 * 更新密钥信息
 */
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { client_name, description, remark, scopes, expires_at } = req.body;

    const key = await thirdPartyKeysService.updateKey(id, {
      client_name,
      description,
      remark,
      scopes,
      expires_at,
    }, req.user.id);

    logger.info('API key updated', {
      id,
      client_name: key.client_name,
    });

    success(res, key, '密钥更新成功');
  } catch (error) {
    logger.error('Error updating API key:', error);
    next(error);
  }
};

/**
 * 修改密钥状态
 */
exports.changeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const key = await thirdPartyKeysService.changeStatus(id, status, req.user.id);

    logger.info('API key status changed', {
      id,
      status,
    });

    success(res, {
      id: key.id,
      status: key.status,
    }, `密钥${status === 'active' ? '启用' : '禁用'}成功`);
  } catch (error) {
    logger.error('Error changing API key status:', error);
    next(error);
  }
};

/**
 * 重新生成密钥
 */
exports.regenerate = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await thirdPartyKeysService.regenerateSecret(id, req.user.id);

    logger.warn('API secret regenerated', { id });

    success(res, result, '密钥重新生成成功');
  } catch (error) {
    logger.error('Error regenerating API secret:', error);
    next(error);
  }
};

/**
 * 删除密钥
 */
exports.delete = async (req, res, next) => {
  try {
    const { id } = req.params;

    await thirdPartyKeysService.deleteKey(id, req.user.id);

    logger.info('API key deleted', { id });

    success(res, null, '密钥删除成功');
  } catch (error) {
    logger.error('Error deleting API key:', error);
    next(error);
  }
};
