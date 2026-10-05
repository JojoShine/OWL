/**
 * 示例业务模块接口
 *
 * 复制此文件，将 example 替换为你的模块名
 * 路径规范：/biz/your-module  对应后端 /api/biz/your-module
 */

import axios from '../../utils/http-client';

export const exampleApi = {
  // 获取列表（支持分页和搜索）
  getList: (params) => axios.get('/biz/example', { params }),

  // 获取详情
  getDetail: (id) => axios.get(`/biz/example/${id}`),

  // 创建
  create: (data) => axios.post('/biz/example', data),

  // 更新
  update: (id, data) => axios.put(`/biz/example/${id}`, data),

  // 删除
  delete: (id) => axios.delete(`/biz/example/${id}`),
};
