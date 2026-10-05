import axios from '../../utils/http-client';

export const dictionaryApi = {
  // 获取多个字典类型
  getDictionaries: (types) => axios.get('/dictionaries', { params: { types } }),

  // 获取单个字典类型
  getDictionary: (type) => axios.get(`/dictionaries/${type}`),
};