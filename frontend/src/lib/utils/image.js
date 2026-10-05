import { getBackendBaseUrl } from '@/lib/config/runtime';
import { uploadApi } from '@/lib/api/system/upload.api';

/**
 * 获取文件完整 URL
 * 支持三种格式：
 * 1. 完整 URL: http://... 直接返回
 * 2. Minio 路径: owl/logos/... 或 owl-platform/logos/... 使用流接口获取
 * 3. 本地路径: /uploads/... 使用旧的本地路径（兼容模式）
 */
export const getFileUrl = (path) => {
  if (!path) return '';

  // 已是完整 URL，直接返回
  if (path.startsWith('http')) {
    return path;
  }

  // Minio 路径格式检查：包含 / 且不以 /uploads 开头
  // 例如：owl/logos/uuid.jpg 或 owl-platform/logos/uuid.jpg
  if (path.includes('/') && !path.startsWith('/uploads')) {
    // 使用新的流接口获取
    return uploadApi.getFileStreamUrl(path);
  }

  // 旧的本地路径格式（兼容模式）
  // 例如：/uploads/xxx.jpg
  const baseUrl = getBackendBaseUrl();
  return `${baseUrl}${path}`;
};
