const sm2 = require('sm-crypto').sm2;
const { logger } = require('../config/logger');

/**
 * SM2 国密加密解密工具类
 * 用于二维码内容的加密和解密
 */
class SM2Crypto {
  constructor() {
    if (process.env.SM2_PUBLIC_KEY && process.env.SM2_PRIVATE_KEY) {
      this.publicKey = process.env.SM2_PUBLIC_KEY;
      this.privateKey = process.env.SM2_PRIVATE_KEY;
    } else {
      logger.warn('[SM2Crypto] SM2_PUBLIC_KEY/SM2_PRIVATE_KEY not set, generating temporary key pair');
      const tempKeys = sm2.generateKeyPairHex();
      this.publicKey = tempKeys.publicKey;
      this.privateKey = tempKeys.privateKey;
    }

    // 加密模式：1 - C1C3C2，0 - C1C2C3（默认）
    this.cipherMode = 1;
  }

  /**
   * 生成新的密钥对
   * @returns {Object} { publicKey, privateKey }
   */
  generateKeyPair() {
    const keypair = sm2.generateKeyPairHex();
    logger.info('[SM2Crypto] Generated new key pair');
    return keypair;
  }

  /**
   * 加密数据
   * @param {String|Object} data - 要加密的数据（字符串或对象）
   * @returns {String} 加密后的十六进制字符串
   */
  encrypt(data) {
    try {
      // 如果是对象，先转换为JSON字符串
      const plaintext = typeof data === 'object' ? JSON.stringify(data) : String(data);

      // SM2加密
      const encrypted = sm2.doEncrypt(plaintext, this.publicKey, this.cipherMode);

      return encrypted;
    } catch (error) {
      logger.error('[SM2Crypto] Encryption failed:', error);
      throw new Error('加密失败');
    }
  }

  /**
   * 解密数据
   * @param {String} encryptedData - 加密的十六进制字符串
   * @param {Boolean} parseJson - 是否解析为JSON对象（默认true）
   * @returns {String|Object} 解密后的数据
   */
  decrypt(encryptedData, parseJson = true) {
    try {
      // SM2解密
      const decrypted = sm2.doDecrypt(encryptedData, this.privateKey, this.cipherMode);

      // 如果需要解析为JSON
      if (parseJson) {
        try {
          return JSON.parse(decrypted);
        } catch (e) {
          // 如果解析失败，返回原始字符串
          return decrypted;
        }
      }

      return decrypted;
    } catch (error) {
      logger.error('[SM2Crypto] Decryption failed:', error);
      throw new Error('解密失败');
    }
  }

  /**
   * 验证密钥对是否匹配
   * @returns {Boolean}
   */
  verifyKeyPair() {
    try {
      const testData = 'test_data_' + Date.now();
      const encrypted = this.encrypt(testData);
      const decrypted = this.decrypt(encrypted, false);
      return testData === decrypted;
    } catch (error) {
      logger.error('[SM2Crypto] Key pair verification failed:', error);
      return false;
    }
  }
}

// 导出单例
module.exports = new SM2Crypto();
