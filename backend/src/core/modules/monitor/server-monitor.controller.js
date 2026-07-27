const serverMonitorService = require('./server-monitor.service');
const ApiError = require('../../../utils/ApiError');

/**
 * 服务器监控控制器
 */
class ServerMonitorController {
  /**
   * 获取所有服务器列表
   */
  async getAllServers(req, res) {
    try {
      const { page, limit, enabled, status } = req.query;
      const result = await serverMonitorService.getAllServers({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        enabled: enabled === 'true' ? true : enabled === 'false' ? false : undefined,
        status,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 获取单个服务器详情
   */
  async getServerById(req, res) {
    try {
      const { id } = req.params;
      const server = await serverMonitorService.getServerById(id);

      if (!server) {
        throw new ApiError(404, '服务器不存在');
      }

      res.json({
        success: true,
        data: server,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 创建服务器监控配置
   */
  async createServer(req, res) {
    try {
      const server = await serverMonitorService.createServer(req.body, req.user.id);

      // 如果启用，立即执行一次检测，然后启动定时监控
      if (server.enabled) {
        serverMonitorService.checkServer(server.id).catch(console.error);
        serverMonitorService.startMonitoring(server.id);
      }

      res.status(201).json({
        success: true,
        data: server,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 更新服务器监控配置
   */
  async updateServer(req, res) {
    try {
      const { id } = req.params;
      const server = await serverMonitorService.updateServer(id, req.body, req.user.id);

      // 重新启动定时任务
      if (server.enabled) {
        serverMonitorService.startMonitoring(server.id);
      } else {
        serverMonitorService.stopMonitoring(server.id);
      }

      res.json({
        success: true,
        data: server,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 删除服务器监控配置
   */
  async deleteServer(req, res) {
    try {
      const { id } = req.params;
      await serverMonitorService.deleteServer(id, req.user.id);

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 测试SSH连接
   */
  async testConnection(req, res) {
    try {
      const { id } = req.params;
      const result = await serverMonitorService.testConnection(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw new ApiError(500, error.message || 'SSH连接失败');
    }
  }

  /**
   * 获取服务器监控日志
   */
  async getServerLogs(req, res) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;
      const result = await serverMonitorService.getServerLogs(id, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 10,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 启动/停止服务器监控
   */
  async toggleMonitoring(req, res) {
    try {
      const { id } = req.params;
      const server = await serverMonitorService.toggleMonitoring(id);

      res.json({
        success: true,
        data: server,
        message: server.enabled ? '已启动监控' : '已停止监控',
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 手动触发检查
   */
  async triggerCheck(req, res) {
    try {
      const { id } = req.params;
      await serverMonitorService.checkServer(id);

      res.json({
        success: true,
        message: '检查完成',
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 添加服务端口
   */
  async addPort(req, res) {
    try {
      const { id } = req.params;
      const port = await serverMonitorService.addPort(id, req.body);

      res.status(201).json({
        success: true,
        data: port,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 更新服务端口
   */
  async updatePort(req, res) {
    try {
      const { portId } = req.params;
      const port = await serverMonitorService.updatePort(portId, req.body);

      res.json({
        success: true,
        data: port,
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }

  /**
   * 删除服务端口
   */
  async deletePort(req, res) {
    try {
      const { portId } = req.params;
      await serverMonitorService.deletePort(portId);

      res.json({
        success: true,
        message: '删除成功',
      });
    } catch (error) {
      throw new ApiError(500, error.message);
    }
  }
}

module.exports = new ServerMonitorController();
