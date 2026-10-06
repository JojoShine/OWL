import axios from '../../utils/http-client';

export const smsAuthApi = {
  // 发送短信验证码
  sendCode: (phone) => axios.post('auth/sms/send-code', { phone }),

  // 短信验证码登录
  login: (data) => axios.post('auth/sms/login', data, { inlineError: true }),

  // 短信验证码注册
  register: (data) => axios.post('auth/sms/register', data),
};
