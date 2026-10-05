/**
 * 阿里云短信服务
 * 用于发送短信验证码
 * 支持两种模式：
 * 1. 普通短信服务 (Dysmsapi) - endpoint: dysmsapi.aliyuncs.com
 * 2. 短信认证服务 (OneVerify) - endpoint: dypnsapi.aliyuncs.com
 */
const Core = require('@alicloud/pop-core');
const config = require('../config/aliyun');
const { logger } = require('../config/logger');

class AliyunSMSService {
  constructor() {
    // 验证配置
    try {
      config.validate();
    } catch (error) {
      logger.warn('阿里云短信服务初始化失败:', error.message);
      this.client = null;
      return;
    }

    // 根据配置选择endpoint
    // 短信认证服务使用 dypnsapi，普通短信使用 dysmsapi
    const isOneVerify = config.sms.serviceType === 'oneverify';
    const endpoint = isOneVerify 
      ? 'https://dypnsapi.aliyuncs.com' 
      : 'https://dysmsapi.aliyuncs.com';
    const apiVersion = isOneVerify ? '2017-05-25' : '2017-05-25';

    this.client = new Core({
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      endpoint: endpoint,
      apiVersion: apiVersion,
    });
    
    this.signName = config.sms.signName;
    this.templateCode = config.sms.templateCode;
    this.isOneVerify = isOneVerify;
  }

  /**
   * 发送短信验证码
   * @param {string} phoneNumber - 手机号
   * @param {string} code - 6位验证码（仅普通短信服务需要）
   * @returns {Promise<{success: boolean, bizId: string}>}
   */
  async sendVerificationCode(phoneNumber, code) {
    if (!this.client) {
      throw new Error('阿里云短信服务未初始化，请检查配置');
    }

    try {
      let params;
      let action;

      if (this.isOneVerify) {
        // 号码认证服务 (OneVerify)
        // 使用 SendSmsVerifyCode 接口发送短信验证码
        action = 'SendSmsVerifyCode';
        params = {
          PhoneNumber: phoneNumber,
          SignName: this.signName,
          TemplateCode: this.templateCode,
          // 模板变量：需要传递 code 和 min（注意：min必须是字符串）
          TemplateParam: JSON.stringify({ 
            code: code,
            min: '5'  // 必须是字符串格式
          }),
        };
      } else {
        // 普通短信服务 (Dysmsapi)
        action = 'SendSms';
        params = {
          PhoneNumbers: phoneNumber,
          SignName: this.signName,
          TemplateCode: this.templateCode,
          TemplateParam: JSON.stringify({ 
            code: code,
            min: 5  // 验证码有效期5分钟
          }),
        };
      }

      logger.info('准备调用阿里云API:', { 
        action, 
        isOneVerify: this.isOneVerify,
        phoneNumber,
        signName: this.signName,
        templateCode: this.templateCode,
        endpoint: this.client.endpoint,
        templateParam: params.TemplateParam
      });

      const response = await this.client.request(
        action,
        params,
        { method: 'POST' }
      );

      logger.info('阿里云API响应:', { 
        action, 
        isOneVerify: this.isOneVerify,
        phoneNumber,
        responseCode: response.Code,
        responseMessage: response.Message 
      });

      if (response.Code === 'OK') {
        logger.info(`短信验证码发送成功: ${phoneNumber}, BizId: ${response.BizId}`);
        return {
          success: true,
          bizId: response.BizId,
        };
      } else {
        logger.error(`短信发送失败: ${response.Message}`, { 
          phoneNumber, 
          errorCode: response.Code 
        });
        throw new Error(`短信发送失败: ${response.Message}`);
      }
    } catch (error) {
      logger.error('阿里云短信服务异常:', error);
      throw error;
    }
  }

  /**
   * 验证短信验证码（仅短信认证服务使用）
   * @param {string} phoneNumber - 手机号
   * @param {string} code - 用户输入的验证码
   * @returns {Promise<boolean>}
   */
  async verifyCode(phoneNumber, code) {
    if (!this.isOneVerify) {
      throw new Error('此方法仅适用于短信认证服务');
    }

    if (!this.client) {
      throw new Error('阿里云短信服务未初始化');
    }

    try {
      const params = {
        PhoneNumber: phoneNumber,
        Code: code,
      };

      const response = await this.client.request(
        'CheckSmsVerifyCode',
        params,
        { method: 'POST' }
      );

      if (response.Code === 'OK') {
        logger.info(`验证码验证成功: ${phoneNumber}`);
        return true;
      } else {
        logger.warn(`验证码验证失败: ${phoneNumber}, ${response.Message}`);
        return false;
      }
    } catch (error) {
      logger.error('验证码验证失败:', error);
      throw error;
    }
  }

  /**
   * 查询短信发送状态(可选功能)
   * @param {string} bizId - 发送返回的BizId
   * @param {string} phoneNumber - 手机号
   */
  async querySendStatus(bizId, phoneNumber) {
    if (!this.client) {
      throw new Error('阿里云短信服务未初始化');
    }

    try {
      const params = {
        PhoneNumber: phoneNumber,
        SendDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        PageSize: 10,
        CurrentPage: 1,
        BizId: bizId,
      };

      const response = await this.client.request(
        'QuerySendDetails',
        params,
        { method: 'POST' }
      );

      return response;
    } catch (error) {
      logger.error('查询短信状态失败:', error);
      throw error;
    }
  }
}

module.exports = new AliyunSMSService();
