const apiKeyService = require('./api-key.service');
const { success, created } = require('../../../utils/response');

class ApiBuilderKeysController {
  async getAllKeys(req, res, next) {
    try {
      const keys = await apiKeyService.listKeys(req.user.id, { interfaceId: req.query.interface_id });
      success(res, keys, '获取接口密钥列表成功');
    } catch (error) {
      next(error);
    }
  }

  async createKey(req, res, next) {
    try {
      created(res, await apiKeyService.createKey(req.body, req.user.id), '接口密钥创建成功');
    } catch (error) {
      next(error);
    }
  }

  async updateKey(req, res, next) {
    try {
      success(res, await apiKeyService.updateKey(req.params.id, req.body, req.user.id), '接口密钥更新成功');
    } catch (error) {
      next(error);
    }
  }

  async changeStatus(req, res, next) {
    try {
      const key = await apiKeyService.changeStatus(req.params.id, req.body.status, req.user.id);
      success(res, { id: key.id, status: key.status }, '接口密钥状态已更新');
    } catch (error) {
      next(error);
    }
  }

  async regenerateKey(req, res, next) {
    try {
      success(res, await apiKeyService.regenerateKey(req.params.id, req.user.id), '接口密钥已重新生成');
    } catch (error) {
      next(error);
    }
  }

  async deleteKey(req, res, next) {
    try {
      await apiKeyService.deleteKey(req.params.id, req.user.id);
      success(res, null, '接口密钥已删除');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApiBuilderKeysController();
