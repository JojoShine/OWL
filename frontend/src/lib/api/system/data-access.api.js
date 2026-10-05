import axios from '../../utils/http-client';

export const dataAccessApi = {
  // 申请明文访问权限
  requestPlainAccess: (data) => axios.post('/data-security/request-plain-access', data),

  // 检查明文访问权限
  checkPlainAccessPermission: (params) => axios.get('/data-security/check-permission', { params }),
};
