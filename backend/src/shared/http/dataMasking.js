const { logger, operationLogger } = require('../config/logger');
const { maskValue } = require('../utils/mask.util');
const { createAsyncTtlCache } = require('./dataMasking.cache');

function createDataMasking({ loadFields, plainAccessService = new (require('../utils/plain-access-cache'))() }) {
const sensitiveFieldCache = createAsyncTtlCache(loadFields, {
  ttlMs: Number(process.env.SENSITIVE_FIELD_CACHE_TTL_MS) || 60_000,
});

/**
 * 数据脱敏中间件
 * 自动拦截响应数据，对敏感字段进行脱敏处理
 * 支持基于用户权限的明文返回（记录级别）
 */
const dataMaskingMiddleware = () => {
  return async (req, res, next) => {
    // 保存原始的 json 方法
    const originalJson = res.json;

    // 重写 json 方法
    res.json = function(data) {
      // 检查是否为成功响应且包含数据
      if (data && data.success && data.data) {
        handleDataMasking(req, res, data, originalJson);
      } else {
        // 其他情况直接返回
        originalJson.call(this, data);
      }
    };

    next();
  };
};

/**
 * 将 Sequelize Model 实例转换为纯 JSON 对象
 */
function toPlainObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // 检测 Sequelize Model 实例
  if (typeof obj.toJSON === 'function') {
    return obj.toJSON();
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return obj.map(item => toPlainObject(item));
  }
  
  // 处理普通对象
  const plainObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      plainObj[key] = toPlainObject(obj[key]);
    }
  }
  return plainObj;
}

/**
 * 处理数据脱敏（支持多种响应格式）
 */
async function handleDataMasking(req, res, responseData, originalJson) {
  try {
    const userId = req.user?.id;
    
    // 如果没有用户信息，直接返回（公开接口）
    if (!userId) {
      originalJson.call(res, responseData);
      return;
    }

    // 获取所有敏感字段配置（基于字段名全局匹配）
    const sensitiveFields = await getAllSensitiveFields();
    
    if (sensitiveFields.length === 0) {
      // 没有敏感字段，直接返回
      originalJson.call(res, responseData);
      return;
    }

    let dataToMask = responseData.data;
    let maskedData;
    let matchedFields = [];

    // 先将 Sequelize Model 实例转换为纯 JSON 对象，以便后续判断结构
    const plainData = toPlainObject(dataToMask);

    // 处理不同的响应格式
    if (Array.isArray(plainData)) {
      // 格式1: data 直接是数组
      const result = await maskDataWithTracking(plainData, sensitiveFields, userId);
      maskedData = result.maskedData;
      matchedFields = result.matchedFields;
    } else if (plainData && plainData.items) {
      // 格式2: data.items 是数组（paginated 和 list 响应）
      const result = await maskDataWithTracking(plainData.items, sensitiveFields, userId);
      maskedData = {
        ...plainData,
        items: result.maskedData
      };
      matchedFields = result.matchedFields;
    } else if (plainData && typeof plainData === 'object') {
      // 格式3: data 是单个对象
      const result = await maskDataWithTracking(plainData, sensitiveFields, userId);
      maskedData = result.maskedData;
      matchedFields = result.matchedFields;
    } else {
      // 其他格式，直接返回
      originalJson.call(res, responseData);
      return;
    }

    // 仅当有实际匹配的字段时才记录日志
    if (matchedFields.length > 0) {
      logAccess(req, userId, matchedFields, req.path);
    }

    // 返回脱敏后的数据
    responseData.data = maskedData;
    originalJson.call(res, responseData);

  } catch (error) {
    // 如果脱敏过程出错，记录错误但返回原始数据（避免影响业务）
    logger.error('数据脱敏失败:', error);
    originalJson.call(res, responseData);
  }
}

/**
 * 获取所有启用的敏感字段配置（基于字段名全局匹配）
 */
async function getAllSensitiveFields() {
  return sensitiveFieldCache.get();
}

/**
 * 对数据进行脱敏处理，并跟踪实际匹配的字段（去重）
 */
async function maskDataWithTracking(data, sensitiveFields, userId) {
  const matchedFieldsMap = new Map(); // 使用 Map 去重
  
  if (!data) return { maskedData: data, matchedFields: [] };

  const items = Array.isArray(data) ? data : [data];
  const permissionEntries = [];
  items.forEach((item) => {
    const recordId = item?.id || item?.uuid || item?._id;
    if (!recordId) return;
    sensitiveFields.forEach(({ field_name: fieldName }) => {
      if (Object.prototype.hasOwnProperty.call(item, fieldName) && item[fieldName] != null) {
        permissionEntries.push({ fieldName, recordId });
      }
    });
  });
  const plainAccessSet = await plainAccessService.checkPlainAccessPermissions(
    userId,
    '*',
    permissionEntries
  );

  // 处理数组
  if (Array.isArray(data)) {
    const maskedItems = await Promise.all(
      data.map(async (item) => {
        const { maskedObj, matched } = await maskObjectWithTracking(item, sensitiveFields, plainAccessSet);
        // 合并匹配字段，去重
        matched.forEach(field => {
          const key = `${field.field_name}_${field.mask_type}`;
          if (!matchedFieldsMap.has(key)) {
            matchedFieldsMap.set(key, field);
          }
        });
        return maskedObj;
      })
    );
    return { 
      maskedData: maskedItems, 
      matchedFields: Array.from(matchedFieldsMap.values()) 
    };
  }

  // 处理对象
  const { maskedObj, matched } = await maskObjectWithTracking(data, sensitiveFields, plainAccessSet);
  matched.forEach(field => {
    const key = `${field.field_name}_${field.mask_type}`;
    if (!matchedFieldsMap.has(key)) {
      matchedFieldsMap.set(key, field);
    }
  });
  
  return { 
    maskedData: maskedObj, 
    matchedFields: Array.from(matchedFieldsMap.values()) 
  };
}

/**
 * 对单个对象进行脱敏，检查记录级别权限
 */
async function maskObjectWithTracking(obj, sensitiveFields, plainAccessSet) {
  if (!obj || typeof obj !== 'object') return { maskedObj: obj, matched: [] };

  const maskedObj = { ...obj };
  const matched = [];

  // 尝试获取记录ID（常见的ID字段名）
  const recordId = obj.id || obj.uuid || obj._id || null;

  for (const field of sensitiveFields) {
    const fieldName = field.field_name;
    
    if (maskedObj.hasOwnProperty(fieldName) && maskedObj[fieldName] != null) {
      // 只有当有recordId时才检查权限
      const hasPermission = Boolean(recordId && plainAccessSet.has(`${fieldName}:${recordId}`));
      
      if (hasPermission) {
        // 有权限，保留明文
        matched.push({
          field_name: fieldName,
          mask_type: 'plain',
          access_level: 'record',
          record_id: recordId,
          original_value: String(maskedObj[fieldName]).substring(0, 10) + '...',
        });
      } else {
        // 没有权限，执行脱敏
        maskedObj[fieldName] = maskValue(
          maskedObj[fieldName],
          field.mask_type,
          field.mask_rule
        );
        matched.push({
          field_name: fieldName,
          mask_type: field.mask_type,
          access_level: 'masked',
          record_id: recordId,
          original_value: String(maskedObj[fieldName]).substring(0, 10) + '...',
        });
      }
    }
  }

  return { maskedObj, matched };
}

/**
 * 记录访问日志（按请求维度记录，去重并统计）
 */
function logAccess(req, userId, matchedFields, requestPath) {
  if (matchedFields.length === 0) return;
  
  // 统计每个字段的脱敏类型和出现次数
  const fieldStats = {};
  matchedFields.forEach(field => {
    const key = `${field.field_name}(${field.mask_type})`;
    fieldStats[key] = (fieldStats[key] || 0) + 1;
  });
  
  // 不记录批量脱敏日志，避免冗余
  // 敏感数据的关键操作（明文访问授权、密码验证）已在 plain-access.service.js 中记录
  // 接口请求本身也会被 operation 日志记录
}

dataMaskingMiddleware.invalidateSensitiveFields = () => sensitiveFieldCache.invalidate();

return dataMaskingMiddleware;
}

module.exports = { createDataMasking };
