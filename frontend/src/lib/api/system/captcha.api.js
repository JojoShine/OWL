import publicAxios from '../../utils/public-client';

export const captchaApi = {
  // 获取验证码
  getCaptcha: () => publicAxios.get('/captcha'),

  // 验证验证码（测试用）
  verifyCaptcha: (data) => publicAxios.post('/captcha/verify', data),
};
