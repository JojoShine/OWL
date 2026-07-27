/**
 * Zabbix API 客户端
 * 模块归属：Zabbix集成模块
 * 使用场景：封装Zabbix JSON-RPC 2.0协议通信，支持API Token认证
 * 
 * 支持的Zabbix版本：6.x
 * 认证方式：API Token（通过Authorization头传递）
 */
const axios = require('axios');
const { logger } = require('../../../config/logger');

class ZabbixClient {
  /**
   * 创建Zabbix客户端实例
   * @param {string} url - Zabbix Server URL (如 http://192.168.1.100:8080)
   * @param {string} apiToken - Zabbix API Token
   */
  constructor(url, apiToken) {
    this.baseUrl = url.replace(/\/$/, '');
    this.apiUrl = `${this.baseUrl}/api_jsonrpc.php`;
    this.apiToken = apiToken;
    this.requestId = 0;

    this.client = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json-rpc',
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  /**
   * 发送JSON-RPC请求
   * @param {string} method - Zabbix API方法名
   * @param {object} params - 请求参数
   * @returns {Promise<any>} API响应结果
   */
  async request(method, params = {}) {
    this.requestId++;
    
    const payload = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.requestId,
    };

    try {
      const response = await this.client.post('', payload);
      
      if (response.data.error) {
        const { message, data } = response.data.error;
        logger.error(`Zabbix API错误 [${method}]: ${message}`, { data });
        throw new Error(`Zabbix API错误: ${message}`);
      }

      return response.data.result;
    } catch (error) {
      if (error.response?.data?.error) {
        const { message, data } = error.response.data.error;
        logger.error(`Zabbix API异常 [${method}]: ${message}`, { data });
        throw new Error(`Zabbix API错误: ${message}`);
      }
      logger.error(`Zabbix请求失败 [${method}]: ${error.message}`);
      throw error;
    }
  }

  /**
   * 测试连接
   * 使用简单API调用验证连接和认证是否正常
   * @returns {Promise<{success: boolean, version?: string, message: string}>}
   */
  async testConnection() {
    try {
      // 获取Zabbix版本
      const version = await this.request('apiinfo.version');
      
      return {
        success: true,
        version,
        message: `连接成功，Zabbix版本: ${version}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `连接失败: ${error.message}`,
      };
    }
  }

  // ========== 主机相关 ==========

  /**
   * 获取主机列表
   * @param {object} options - 查询选项
   * @param {string[]} options.hostids - 主机ID列表
   * @param {string[]} options.groupids - 主机组ID列表
   * @param {boolean} options.selectInterfaces - 是否包含接口信息
   * @param {boolean} options.selectGroups - 是否包含主机组信息
   * @returns {Promise<Array>} 主机列表
   */
  async getHosts(options = {}) {
    const params = {
      output: ['hostid', 'host', 'name', 'status'],
      selectInterfaces: options.selectInterfaces || false,
      selectGroups: options.selectGroups || false,
      ...options,
    };
    return this.request('host.get', params);
  }

  /**
   * 获取主机组列表
   * @returns {Promise<Array>} 主机组列表
   */
  async getHostGroups() {
    return this.request('hostgroup.get', {
      output: ['groupid', 'name'],
    });
  }

  // ========== 监控项相关 ==========

  /**
   * 获取监控项列表
   * @param {object} options - 查询选项
   * @param {string[]} options.hostids - 主机ID列表
   * @param {string[]} options.itemids - 监控项ID列表
   * @param {string[]} options.hostids - 按主机组筛选
   * @returns {Promise<Array>} 监控项列表
   */
  async getItems(options = {}) {
    const params = {
      output: ['itemid', 'name', 'key_', 'lastvalue', 'units', 'value_type'],
      sortfield: 'name',
      ...options,
    };
    return this.request('item.get', params);
  }

  /**
   * 获取监控项历史数据
   * @param {object} options - 查询选项
   * @param {string} options.itemid - 监控项ID
   * @param {string} options.time_from - 开始时间 (Unix timestamp)
   * @param {string} options.time_till - 结束时间 (Unix timestamp)
   * @param {number} options.sortorder - 排序方向 (0-升序, 1-降序)
   * @returns {Promise<Array>} 历史数据列表
   */
  async getHistory(options) {
    return this.request('history.get', options);
  }

  /**
   * 获取监控项趋势数据
   * 用于长时间范围的数据查询（超过Zabbix历史保留期）
   * @param {object} options - 查询选项
   * @returns {Promise<Array>} 趋势数据列表
   */
  async getTrend(options) {
    return this.request('trend.get', options);
  }

  // ========== 触发器相关 ==========

  /**
   * 获取触发器列表
   * @param {object} options - 查询选项
   * @param {string[]} options.hostids - 主机ID列表
   * @param {string} options.min_severity - 最小严重级别 (0-5)
   * @param {boolean} options.only_true - 只返回当前触发的
   * @returns {Promise<Array>} 触发器列表
   */
  async getTriggers(options = {}) {
    const params = {
      output: ['triggerid', 'description', 'priority', 'lastchange', 'value'],
      selectHosts: ['hostid', 'host'],
      expandDescription: true,
      sortfield: 'priority',
      sortorder: 'DESC',
      ...options,
    };
    return this.request('trigger.get', params);
  }

  // ========== 问题/告警相关 ==========

  /**
   * 获取当前问题列表
   * @param {object} options - 查询选项
   * @param {string[]} options.hostids - 主机ID列表
   * @param {string} options.severity_min - 最小严重级别
   * @returns {Promise<Array>} 问题列表
   */
  async getProblems(options = {}) {
    const params = {
      output: ['eventid', 'objectid', 'clock', 'ns', 'severity', 'name'],
      selectAcknowledges: ['userid', 'message', 'clock'],
      sortfield: ['severity', 'clock'],
      sortorder: ['DESC', 'DESC'],
      recent: true,
      ...options,
    };
    return this.request('problem.get', params);
  }

  // ========== 系统信息 ==========

  /**
   * 获取Zabbix Server信息
   * @returns {Promise<object>} 服务器信息
   */
  async getServerInfo() {
    return this.request('zabbix.getFullVersion');
  }
}

/**
 * 创建Zabbix客户端实例
 * @param {string} url - Zabbix Server URL
 * @param {string} apiToken - API Token
 * @returns {ZabbixClient} 客户端实例
 */
function createClient(url, apiToken) {
  return new ZabbixClient(url, apiToken);
}

module.exports = {
  ZabbixClient,
  createClient,
};
