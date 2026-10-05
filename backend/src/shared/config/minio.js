const Minio = require('minio');
const { logger } = require('./logger');

// 初始化 Minio 客户端
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'common-management';

/**
 * 确保 bucket 存在，不存在则创建
 */
async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      logger.info(`Minio bucket created: ${BUCKET_NAME}`);
    } else {
      logger.info(`Minio bucket already exists: ${BUCKET_NAME}`);
    }
  } catch (error) {
    logger.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

/**
 * 上传文件到 Minio
 * @param {string} objectName - 对象名称（文件路径）
 * @param {Buffer} buffer - 文件内容
 * @param {string} contentType - 文件 MIME 类型
 * @returns {Promise<object>} - 上传结果
 */
async function uploadFile(objectName, buffer, contentType) {
  try {
    const metaData = {
      'Content-Type': contentType,
    };

    const result = await minioClient.putObject(
      BUCKET_NAME,
      objectName,
      buffer,
      buffer.length,
      metaData
    );

    logger.info(`File uploaded to Minio: ${objectName}`);
    return result;
  } catch (error) {
    logger.error(`Error uploading file to Minio: ${objectName}`, error);
    throw error;
  }
}

/**
 * 从 Minio 下载文件
 * @param {string} objectName - 对象名称（文件路径）
 * @returns {Promise<Stream>} - 文件流
 */
async function downloadFile(objectName) {
  try {
    const stream = await minioClient.getObject(BUCKET_NAME, objectName);
    logger.info(`File downloaded from Minio: ${objectName}`);
    return stream;
  } catch (error) {
    logger.error(`Error downloading file from Minio: ${objectName}`, error);
    throw error;
  }
}

/**
 * 从 Minio 删除文件
 * @param {string} objectName - 对象名称（文件路径）
 * @returns {Promise<void>}
 */
async function deleteFile(objectName) {
  try {
    await minioClient.removeObject(BUCKET_NAME, objectName);
    logger.info(`File deleted from Minio: ${objectName}`);
  } catch (error) {
    logger.error(`Error deleting file from Minio: ${objectName}`, error);
    throw error;
  }
}

/**
 * 复制 Minio 中的文件
 * @param {string} sourceObjectName - 源对象名称
 * @param {string} destObjectName - 目标对象名称
 * @returns {Promise<void>}
 */
async function copyFile(sourceObjectName, destObjectName) {
  try {
    const conditions = new Minio.CopyConditions();
    await minioClient.copyObject(
      BUCKET_NAME,
      destObjectName,
      `/${BUCKET_NAME}/${sourceObjectName}`,
      conditions
    );
    logger.info(`File copied in Minio: ${sourceObjectName} -> ${destObjectName}`);
  } catch (error) {
    logger.error(`Error copying file in Minio: ${sourceObjectName}`, error);
    throw error;
  }
}

/**
 * 获取文件信息
 * @param {string} objectName - 对象名称（文件路径）
 * @returns {Promise<object>} - 文件元数据
 */
async function getFileInfo(objectName) {
  try {
    const stat = await minioClient.statObject(BUCKET_NAME, objectName);
    return stat;
  } catch (error) {
    logger.error(`Error getting file info from Minio: ${objectName}`, error);
    throw error;
  }
}

/**
 * 生成文件的临时访问 URL（用于预览）
 * @param {string} objectName - 对象名称（文件路径）
 * @param {number} expiry - 过期时间（秒），默认24小时
 * @returns {Promise<string>} - 临时访问 URL
 */
async function getPresignedUrl(objectName, expiry = 24 * 60 * 60) {
  try {
    const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expiry);
    return url;
  } catch (error) {
    logger.error(`Error generating presigned URL for: ${objectName}`, error);
    throw error;
  }
}

/**
 * 列出 bucket 中的所有对象（用于统计）
 * @param {string} prefix - 前缀过滤
 * @returns {Promise<Array>} - 对象列表
 */
async function listObjects(prefix = '') {
  return new Promise((resolve, reject) => {
    const objects = [];
    const stream = minioClient.listObjects(BUCKET_NAME, prefix, true);

    stream.on('data', (obj) => objects.push(obj));
    stream.on('error', (error) => reject(error));
    stream.on('end', () => resolve(objects));
  });
}

module.exports = {
  minioClient,
  BUCKET_NAME,
  ensureBucketExists,
  uploadFile,
  downloadFile,
  deleteFile,
  copyFile,
  getFileInfo,
  getPresignedUrl,
  listObjects,
};
