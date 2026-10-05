const geoip = require('geoip-lite');

/**
 * 从 IP 地址获取地理位置信息
 * @param {string} ip - IP 地址
 * @returns {Object} 地理位置信息对象
 */
function getLocationFromIP(ip) {
  // 处理本地 IP
  if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    return {
      ip,
      country: '中国',
      city: '本地',
      region: ''
    };
  }

  const geo = geoip.lookup(ip);
  if (!geo) {
    return {
      ip,
      country: '未知',
      city: '未知',
      region: ''
    };
  }

  return {
    ip,
    country: geo.country === 'CN' ? '中国' : geo.country,
    city: geo.city || '未知',
    region: geo.region || ''
  };
}

module.exports = { getLocationFromIP };
