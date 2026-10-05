/**
 * 阿里云配置
 * 从环境变量读取，不存储到数据库
 */
require('dotenv').config();

const aliyunConfig = {
  // 通用配置
  accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
  accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
  
  // 短信服务配置
  sms: {
    signName: process.env.ALIYUN_SMS_SIGN_NAME || 'Owl平台',
    templateCode: process.env.ALIYUN_SMS_TEMPLATE_CODE || 'SMS_000000',
    regionId: process.env.ALIYUN_REGION_ID || 'cn-hangzhou',
    // 服务类型: 'oneverify' (短信认证服务) 或 'dysmsapi' (普通短信)
    serviceType: process.env.ALIYUN_SMS_SERVICE_TYPE || 'oneverify',
  },
  
  /**
   * 验证配置是否存在
   */
  validate() {
    if (!this.accessKeyId || !this.accessKeySecret) {
      throw new Error('阿里云AccessKey未配置，请检查环境变量 ALIYUN_ACCESS_KEY_ID 和 ALIYUN_ACCESS_KEY_SECRET');
    }
    
    if (!this.sms.signName || !this.sms.templateCode) {
      console.warn('⚠️  阿里云短信配置不完整，短信功能可能不可用');
      console.warn('   请设置: ALIYUN_SMS_SIGN_NAME 和 ALIYUN_SMS_TEMPLATE_CODE');
      console.warn('   模板ID格式示例: SMS_123456789');
      console.warn('   请在阿里云控制台创建短信模板并获取正确的模板ID');
    }
  },
};

module.exports = aliyunConfig;
