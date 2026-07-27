/**
 * Zabbix API 客户端
 * 模块归属：Zabbix集成模块
 * 使用场景：前端调用Zabbix实例管理相关接口
 */
import axios from '../../utils/http-client';

export const zabbixApi = {
  /**
   * 获取Zabbix实例列表
   * @param {object} params - 查询参数
   * @returns {Promise} 实例列表
   */
  getInstances: (params) => axios.get('/zabbix', { params }),

  /**
   * 获取Zabbix实例详情
   * @param {string} id - 实例ID
   * @returns {Promise} 实例详情
   */
  getInstance: (id) => axios.get(`/zabbix/${id}`),

  /**
   * 创建Zabbix实例
   * @param {object} data - 实例数据
   * @returns {Promise} 创建的实例
   */
  createInstance: (data) => axios.post('/zabbix', data),

  /**
   * 更新Zabbix实例
   * @param {string} id - 实例ID
   * @param {object} data - 更新数据
   * @returns {Promise} 更新后的实例
   */
  updateInstance: (id, data) => axios.put(`/zabbix/${id}`, data),

  /**
   * 删除Zabbix实例
   * @param {string} id - 实例ID
   * @returns {Promise}
   */
  deleteInstance: (id) => axios.delete(`/zabbix/${id}`),

  /**
   * 测试Zabbix连接
   * @param {string} id - 实例ID
   * @returns {Promise} 测试结果
   */
  testConnection: (id) => axios.post(`/zabbix/${id}/test`),

  /**
   * 手动同步Zabbix数据
   * @param {string} id - 实例ID
   * @returns {Promise} 同步结果
   */
  syncInstance: (id) => axios.post(`/zabbix/${id}/sync`),

  /**
   * 获取主机列表（同步数据）
   * @param {string} instanceId - 实例ID
   * @param {object} params - 查询参数
   * @returns {Promise} 主机列表
   */
  getHosts: (instanceId, params) => axios.get(`/zabbix/${instanceId}/hosts`, { params }),

  /**
   * 获取主机详情 + 监控项（实时）
   * @param {string} instanceId - 实例ID
   * @param {string} hostId - Zabbix主机ID
   * @returns {Promise} 主机详情
   */
  getHostDetail: (instanceId, hostId) => axios.get(`/zabbix/${instanceId}/hosts/${hostId}`),

  /**
   * 获取问题/告警列表（实时）
   * @param {string} instanceId - 实例ID
   * @param {object} params - 查询参数
   * @returns {Promise} 问题列表
   */
  getProblems: (instanceId, params) => axios.get(`/zabbix/${instanceId}/problems`, { params }),
};
