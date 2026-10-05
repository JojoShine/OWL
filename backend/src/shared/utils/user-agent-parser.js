const UAParser = require('ua-parser-js');

/**
 * 解析 User-Agent 字符串获取设备信息
 * @param {string} userAgent - User-Agent 字符串
 * @returns {Object} 设备信息对象
 */
function parseUserAgent(userAgent) {
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    type: result.device.type || 'desktop',
    os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
    browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
    device_name: result.device.model || result.os.name || 'Unknown Device'
  };
}

module.exports = { parseUserAgent };
