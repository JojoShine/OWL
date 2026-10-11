import client from '../utils/module-client';

export const dynamicModuleApi = {
  getList: (endpoint, config) => client.get(endpoint, config),
  create: (endpoint, data) => client.post(endpoint, data),
  update: (endpoint, data) => client.put(endpoint, data),
  delete: (endpoint) => client.delete(endpoint),
  getImportTemplate: (endpoint) => client.get(endpoint),
  importRows: (endpoint, data, config) => client.post(endpoint, data, config),
};
