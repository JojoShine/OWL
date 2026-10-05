const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// 允许的文件类型（MIME类型）
const ALLOWED_MIME_TYPES = [
  // 图片
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
  // SVG需要额外验证，暂时移除
  // 'image/svg+xml',
  // 文档
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本（移除危险类型）
  'text/plain',
  'text/csv',
  // 移除 HTML/CSS/JS - 安全风险
  // 'text/html',
  // 'text/css',
  // 'text/javascript',
  'application/json',
  'application/xml',
  // 压缩文件
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  // 视频
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-flv',
  'video/webm',
  'video/x-matroska',
  // 音频
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
];

// 禁止的文件扩展名（额外的安全检查）
const FORBIDDEN_EXTENSIONS = [
  'html', 'htm', 'js', 'jsx', 'ts', 'tsx',
  'exe', 'bat', 'cmd', 'sh', 'bash',
  'php', 'asp', 'aspx', 'jsp',
  'svg', // SVG可能包含XSS
];

// 文件大小限制（默认 100MB）
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024;

// 配置 multer 使用内存存储（文件直接上传到 Minio，不保存到磁盘）
const storage = multer.memoryStorage();

// 文件过滤器
const fileFilter = (req, file, cb) => {
  // 修复文件名编码问题：Multer 默认使用 latin1 解析，需要转换为 UTF-8
  if (file.originalname) {
    file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  }

  // 检查文件名
  if (!file.originalname || file.originalname.length === 0) {
    return cb(ApiError.badRequest('无效的文件名'), false);
  }

  // 检查文件扩展名（禁止危险扩展名）
  const ext = path.extname(file.originalname).toLowerCase().slice(1);
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return cb(
      ApiError.badRequest(
        `禁止上传此类型文件: .${ext}。出于安全考虑，不允许上传可执行代码文件。`
      ),
      false
    );
  }

  // 检查文件类型
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      ApiError.badRequest(
        `不支持的文件类型: ${file.mimetype}。请上传支持的文件格式。`
      ),
      false
    );
  }

  cb(null, true);
};

// 创建 multer 实例
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // 单次最多上传10个文件
  },
  fileFilter: fileFilter,
});

// 单文件上传中间件
const uploadSingle = (fieldName = 'file') => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);

    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer 错误处理
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `文件大小超过限制。最大允许: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(ApiError.badRequest('上传文件数量超过限制'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ApiError.badRequest(`意外的字段名: ${err.field}`));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        // 其他错误
        return next(err);
      }

      // 检查是否有文件上传
      if (!req.file) {
        return next(ApiError.badRequest('请选择要上传的文件'));
      }

      next();
    });
  };
};

// 多文件上传中间件
const uploadMultiple = (fieldName = 'files', maxCount = 10) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);

    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer 错误处理
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            ApiError.badRequest(
              `文件大小超过限制。最大允许: ${MAX_FILE_SIZE / 1024 / 1024}MB`
            )
          );
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(
            ApiError.badRequest(`上传文件数量超过限制。最多允许: ${maxCount}个文件`)
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ApiError.badRequest(`意外的字段名: ${err.field}`));
        }
        return next(ApiError.badRequest(err.message));
      } else if (err) {
        // 其他错误
        return next(err);
      }

      // 检查是否有文件上传
      if (!req.files || req.files.length === 0) {
        return next(ApiError.badRequest('请选择要上传的文件'));
      }

      next();
    });
  };
};

// 验证文件扩展名
const validateFileExtension = (filename, allowedExtensions) => {
  const ext = path.extname(filename).toLowerCase().slice(1);
  return allowedExtensions.includes(ext);
};

// 获取安全的文件名（移除特殊字符）
const getSafeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // 替换特殊字符为下划线
    .replace(/_+/g, '_') // 合并多个下划线
    .replace(/^_|_$/g, ''); // 移除首尾下划线
};

module.exports = {
  upload,
  uploadSingle,
  uploadMultiple,
  validateFileExtension,
  getSafeFilename,
  ALLOWED_MIME_TYPES,
  FORBIDDEN_EXTENSIONS,
  MAX_FILE_SIZE,
};
