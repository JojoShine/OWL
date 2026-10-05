const { v4: uuidv4 } = require('uuid');
const path = require('path');

/**
 * 生成唯一的文件名（UUID + 原扩展名）
 * @param {string} originalFilename - 原始文件名
 * @returns {string} - 唯一文件名
 */
function generateUniqueFilename(originalFilename) {
  const ext = path.extname(originalFilename);
  const uuid = uuidv4();
  return `${uuid}${ext}`;
}

/**
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} - 扩展名（小写，不含点）
 */
function getFileExtension(filename) {
  const ext = path.extname(filename);
  return ext ? ext.slice(1).toLowerCase() : '';
}

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} - 格式化后的文件大小
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * 验证 MIME 类型
 * @param {string} mimeType - MIME 类型
 * @param {string[]} allowedTypes - 允许的 MIME 类型列表
 * @returns {boolean} - 是否允许
 */
function isValidMimeType(mimeType, allowedTypes) {
  return allowedTypes.includes(mimeType);
}

/**
 * 判断是否是图片
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
function isImage(mimeType) {
  const imageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ];
  return imageTypes.includes(mimeType);
}

/**
 * 判断是否是视频
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
function isVideo(mimeType) {
  const videoTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-flv',
    'video/webm',
    'video/x-matroska',
  ];
  return videoTypes.includes(mimeType);
}

/**
 * 判断是否是PDF
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
function isPDF(mimeType) {
  return mimeType === 'application/pdf';
}

/**
 * 判断文件是否可以预览
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
function canPreview(mimeType) {
  return isImage(mimeType) || isVideo(mimeType) || isPDF(mimeType);
}

/**
 * 根据 MIME 类型获取文件类别
 * @param {string} mimeType - MIME 类型
 * @returns {string} - 文件类别（image, video, document, audio, archive, text, other）
 */
function getFileCategory(mimeType) {
  if (isImage(mimeType)) return 'image';
  if (isVideo(mimeType)) return 'video';
  if (isPDF(mimeType)) return 'document';

  if (mimeType.startsWith('audio/')) return 'audio';
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('presentation')
  ) {
    return 'document';
  }
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('tar') ||
    mimeType.includes('gzip')
  ) {
    return 'archive';
  }
  if (mimeType.startsWith('text/')) return 'text';

  return 'other';
}

/**
 * 生成文件在 Minio 中的路径
 * @param {string} userId - 用户ID
 * @param {string} filename - 文件名
 * @returns {string} - 文件路径
 */
function generateFilePath(userId, filename) {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // 路径格式: users/{userId}/{year}/{month}/{day}/{filename}
  return `users/${userId}/${year}/${month}/${day}/${filename}`;
}

/**
 * 清理文件名（移除不安全字符）
 * @param {string} filename - 原始文件名
 * @returns {string} - 清理后的文件名
 */
function sanitizeFilename(filename) {
  return filename
    .replace(/[^a-zA-Z0-9._-\u4e00-\u9fa5]/g, '_') // 保留中文字符
    .replace(/_+/g, '_') // 合并多个下划线
    .replace(/^_|_$/g, '') // 移除首尾下划线
    .substring(0, 255); // 限制长度
}

/**
 * 解析 Content-Range 头
 * @param {string} rangeHeader - Range 请求头
 * @param {number} fileSize - 文件总大小
 * @returns {object|null} - 解析后的范围对象 { start, end, contentLength }
 */
function parseRange(rangeHeader, fileSize) {
  if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
    return null;
  }

  const parts = rangeHeader.slice(6).split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

  if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
    return null;
  }

  return {
    start,
    end,
    contentLength: end - start + 1,
  };
}

/**
 * 根据文件扩展名获取 MIME 类型
 * @param {string} filename - 文件名或路径
 * @returns {string} - MIME 类型
 */
function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();

  const mimeTypes = {
    // 图片
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.bmp': 'image/bmp',
    // 文档
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.ppt': 'application/vnd.ms-powerpoint',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // 文本
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.xml': 'application/xml',
    // 视频
    '.mp4': 'video/mp4',
    '.mpeg': 'video/mpeg',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.flv': 'video/x-flv',
    '.webm': 'video/webm',
    '.mkv': 'video/x-matroska',
    // 音频
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    // 压缩
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
    '.tar': 'application/x-tar',
    '.gz': 'application/gzip',
  };

  return mimeTypes[ext] || 'application/octet-stream';
}

module.exports = {
  generateUniqueFilename,
  getFileExtension,
  formatFileSize,
  isValidMimeType,
  isImage,
  isVideo,
  isPDF,
  canPreview,
  getFileCategory,
  generateFilePath,
  sanitizeFilename,
  parseRange,
  getMimeType,
};
