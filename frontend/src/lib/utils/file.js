/**
 * 文件工具函数
 */

import { FileIcon, ImageIcon, VideoIcon, FileTextIcon, FileArchiveIcon, MusicIcon, FileCodeIcon } from 'lucide-react';
import { formatRelativeTime } from './date';

/**
 * 格式化文件大小
 * @param {number} bytes - 文件大小（字节）
 * @returns {string} - 格式化后的文件大小
 */
export function formatFileSize(bytes) {
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
 * 获取文件扩展名
 * @param {string} filename - 文件名
 * @returns {string} - 扩展名（小写，不含点）
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * 根据文件名或 MIME 类型判断是否是图片
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isImage(filename, mimeType) {
  if (mimeType && mimeType.startsWith('image/')) return true;

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'];
  const ext = getFileExtension(filename);
  return imageExtensions.includes(ext);
}

/**
 * 判断是否是视频
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isVideo(filename, mimeType) {
  if (mimeType && mimeType.startsWith('video/')) return true;

  const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
  const ext = getFileExtension(filename);
  return videoExtensions.includes(ext);
}

/**
 * 判断是否是PDF
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isPDF(filename, mimeType) {
  if (mimeType === 'application/pdf') return true;
  return getFileExtension(filename) === 'pdf';
}

/**
 * 判断是否是音频
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isAudio(filename, mimeType) {
  if (mimeType && mimeType.startsWith('audio/')) return true;

  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  const ext = getFileExtension(filename);
  return audioExtensions.includes(ext);
}

/**
 * 判断是否是文档
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isDocument(filename, mimeType) {
  if (mimeType) {
    const docMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    if (docMimeTypes.includes(mimeType)) return true;
  }

  const docExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv'];
  const ext = getFileExtension(filename);
  return docExtensions.includes(ext);
}

/**
 * 判断是否是压缩文件
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function isArchive(filename, mimeType) {
  if (mimeType) {
    const archiveMimeTypes = [
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      'application/x-tar',
      'application/gzip',
    ];
    if (archiveMimeTypes.includes(mimeType)) return true;
  }

  const archiveExtensions = ['zip', 'rar', '7z', 'tar', 'gz', 'bz2'];
  const ext = getFileExtension(filename);
  return archiveExtensions.includes(ext);
}

/**
 * 判断文件是否可以预览
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {boolean}
 */
export function canPreview(filename, mimeType) {
  return isImage(filename, mimeType) || isVideo(filename, mimeType) || isPDF(filename, mimeType);
}

/**
 * 获取文件类型图标
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {React.Component} - Lucide 图标组件
 */
export function getFileIcon(filename, mimeType) {
  if (isImage(filename, mimeType)) return ImageIcon;
  if (isVideo(filename, mimeType)) return VideoIcon;
  if (isAudio(filename, mimeType)) return MusicIcon;
  if (isDocument(filename, mimeType)) return FileTextIcon;
  if (isArchive(filename, mimeType)) return FileArchiveIcon;

  // 检查是否是代码文件
  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'xml'];
  const ext = getFileExtension(filename);
  if (codeExtensions.includes(ext)) return FileCodeIcon;

  return FileIcon;
}

/**
 * 获取文件类别
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {string} - 文件类别（image, video, document, audio, archive, code, other）
 */
export function getFileCategory(filename, mimeType) {
  if (isImage(filename, mimeType)) return 'image';
  if (isVideo(filename, mimeType)) return 'video';
  if (isAudio(filename, mimeType)) return 'audio';
  if (isDocument(filename, mimeType)) return 'document';
  if (isArchive(filename, mimeType)) return 'archive';

  const codeExtensions = ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'css', 'html', 'json', 'xml'];
  const ext = getFileExtension(filename);
  if (codeExtensions.includes(ext)) return 'code';

  return 'other';
}

/**
 * 获取文件类型标签颜色
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME 类型
 * @returns {string} - Tailwind CSS 类名
 */
export function getFileCategoryColor(filename, mimeType) {
  const category = getFileCategory(filename, mimeType);

  const colorMap = {
    image: 'bg-green-100 text-green-800 border-green-200',
    video: 'bg-purple-100 text-purple-800 border-purple-200',
    audio: 'bg-pink-100 text-pink-800 border-pink-200',
    document: 'bg-blue-100 text-blue-800 border-blue-200',
    archive: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    code: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    other: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return colorMap[category] || colorMap.other;
}

/**
 * 格式化时间（使用相对时间格式）
 * 为了向后兼容，导出 formatRelativeTime 作为 formatDate
 * @param {string|Date} date - 日期
 * @returns {string} - 格式化后的时间
 */
export const formatDate = formatRelativeTime;

/**
 * 下载文件
 * @param {Blob} blob - 文件 Blob
 * @param {string} filename - 文件名
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * 验证文件类型
 * @param {File} file - 文件对象
 * @param {string[]} allowedTypes - 允许的文件类型（扩展名）
 * @returns {boolean}
 */
export function validateFileType(file, allowedTypes) {
  if (!allowedTypes || allowedTypes.length === 0) return true;

  const ext = getFileExtension(file.name);
  return allowedTypes.includes(ext);
}

/**
 * 验证文件大小
 * @param {File} file - 文件对象
 * @param {number} maxSize - 最大文件大小（字节）
 * @returns {boolean}
 */
export function validateFileSize(file, maxSize) {
  if (!maxSize) return true;
  return file.size <= maxSize;
}
