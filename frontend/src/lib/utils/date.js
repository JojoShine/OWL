/**
 * 统一的日期工具函数
 * 提供标准化的日期格式化功能
 */

/**
 * 格式化日期为完整时间格式（包含时分秒）
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 格式化后的日期时间字符串，如 "2025/10/17 14:30:45"
 *
 * @example
 * formatDateTime(new Date()) // "2025/10/17 14:30:45"
 * formatDateTime("2025-10-17T14:30:45Z") // "2025/10/17 22:30:45"
 */
export function formatDateTime(date) {
  if (!date) return '-';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * 格式化为仅日期（不包含时间）
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 格式化后的日期字符串，如 "2025/10/17"
 *
 * @example
 * formatDateOnly(new Date()) // "2025/10/17"
 */
export function formatDateOnly(date) {
  if (!date) return '-';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '-';

  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 格式化为相对时间（刚刚、X分钟前等）
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} 相对时间字符串
 *
 * @example
 * formatRelativeTime(new Date()) // "刚刚"
 * formatRelativeTime(Date.now() - 5 * 60 * 1000) // "5分钟前"
 * formatRelativeTime(Date.now() - 2 * 60 * 60 * 1000) // "2小时前"
 * formatRelativeTime(Date.now() - 3 * 24 * 60 * 60 * 1000) // "3天前"
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diff = now - d;

  // 小于1分钟
  if (diff < 60000) {
    return '刚刚';
  }

  // 小于1小时
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}分钟前`;
  }

  // 小于24小时
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}小时前`;
  }

  // 小于7天
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}天前`;
  }

  // 超过7天，显示完整日期时间（不含秒）
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * 格式化日期（通用方法，支持自定义选项）
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @param {object} options - 格式化选项
 * @param {boolean} options.includeTime - 是否包含时间，默认 true
 * @param {boolean} options.includeSeconds - 是否包含秒，默认 true
 * @param {boolean} options.relative - 是否使用相对时间，默认 false
 * @returns {string} 格式化后的日期字符串
 *
 * @example
 * formatDate(new Date()) // "2025/10/17 14:30:45"
 * formatDate(new Date(), { includeTime: false }) // "2025/10/17"
 * formatDate(new Date(), { includeSeconds: false }) // "2025/10/17 14:30"
 * formatDate(new Date(), { relative: true }) // "刚刚"
 */
export function formatDate(date, options = {}) {
  const {
    includeTime = true,
    includeSeconds = true,
    relative = false,
  } = options;

  // 使用相对时间
  if (relative) {
    return formatRelativeTime(date);
  }

  // 仅日期
  if (!includeTime) {
    return formatDateOnly(date);
  }

  // 完整日期时间
  if (!date) return '-';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '-';

  const formatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };

  // 包含秒
  if (includeSeconds) {
    formatOptions.second = '2-digit';
  }

  return d.toLocaleString('zh-CN', formatOptions);
}

/**
 * 将日期转换为 ISO 8601 格式的日期字符串（YYYY-MM-DD）
 * 用于 input[type="date"] 的值
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} ISO 日期字符串，如 "2025-10-17"
 *
 * @example
 * toISODateString(new Date()) // "2025-10-17"
 */
export function toISODateString(date) {
  if (!date) return '';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * 将 ISO 日期字符串（YYYY-MM-DD）转换为本地日期对象
 * @param {string} isoDateString - ISO 日期字符串，如 "2025-10-17"
 * @returns {Date|null} 日期对象，如果无效则返回 null
 *
 * @example
 * fromISODateString("2025-10-17") // Date object
 */
export function fromISODateString(isoDateString) {
  if (!isoDateString) return null;

  const d = new Date(isoDateString + 'T00:00:00');

  // 检查日期是否有效
  if (isNaN(d.getTime())) return null;

  return d;
}

/**
 * 将日期转换为 datetime-local input 格式
 * 用于 input[type="datetime-local"] 的值
 * @param {Date|string|number} date - 日期对象、字符串或时间戳
 * @returns {string} datetime-local 格式字符串，如 "2026-01-12T15:34"
 *
 * @example
 * toDateTimeLocalString(new Date('2026-01-12T07:34:00.000Z')) // "2026-01-12T15:34" (UTC+8)
 * toDateTimeLocalString('2026-01-12T07:34:00.000Z') // "2026-01-12T15:34"
 */
export function toDateTimeLocalString(date) {
  if (!date) return '';

  const d = new Date(date);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 将 datetime-local 字符串转换为 Date 对象
 * @param {string} datetimeLocalString - datetime-local 格式字符串，如 "2026-01-12T15:34"
 * @returns {Date|null} 日期对象，如果无效则返回 null
 *
 * @example
 * fromDateTimeLocalString("2026-01-12T15:34") // Date object (本地时区)
 */
export function fromDateTimeLocalString(datetimeLocalString) {
  if (!datetimeLocalString) return null;

  // datetime-local 格式的字符串直接创建 Date 时会被认为是 UTC
  // 需要特殊处理以确保在本地时区中解析
  const [date, time] = datetimeLocalString.split('T');
  if (!date || !time) return null;

  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  // 创建本地时区的 Date 对象
  const d = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // 检查日期是否有效
  if (isNaN(d.getTime())) return null;

  return d;
}