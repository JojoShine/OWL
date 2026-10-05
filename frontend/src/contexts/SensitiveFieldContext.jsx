
import React, { createContext, useContext, useState, useEffect } from 'react';
import { sensitiveFieldApi } from '@/lib/api';

const SensitiveFieldContext = createContext();

export function SensitiveFieldProvider({ children }) {
  // 敏感字段配置列表 [{ table_name, field_name, mask_type, ... }, ...]
  const [sensitiveFields, setSensitiveFields] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 初始加载配置
  useEffect(() => {
    loadSensitiveFields();
  }, []);

  const loadSensitiveFields = async () => {
    try {
      setIsLoading(true);

      // 分页获取所有敏感字段（后端限制每页最多100条）
      let allFields = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await sensitiveFieldApi.getSensitiveFields({
          is_active: 'true',
          limit: 100,
          page: page
        });

        const fields = response.data?.data || response.data?.items || [];
        allFields = allFields.concat(fields);

        const pagination = response.data?.pagination;
        hasMore = pagination && page < pagination.totalPages;
        page++;
      }

      setSensitiveFields(allFields);
    } catch (error) {
      console.error('加载敏感字段配置失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 检查字段是否是敏感字段
   * @param {string} fieldName - 字段名
   * @returns {boolean} 是否是敏感字段
   */
  const isSensitiveField = (fieldName) => {
    return sensitiveFields.some(field => field.field_name === fieldName);
  };

  /**
   * 判断字段是否需要显示编辑按钮（编辑模式专用）
   * @param {string} fieldName - 字段名
   * @param {any} fieldValue - 字段值
   * @returns {boolean} 是否需要显示编辑按钮
   */
  const shouldShowEditButton = (fieldName, fieldValue) => {
    // 字段配置为敏感字段 且 值包含脱敏标记（*）
    return isSensitiveField(fieldName) &&
           fieldValue &&
           typeof fieldValue === 'string' &&
           fieldValue.includes('*');
  };

  /**
   * 获取所有敏感字段名列表
   * @returns {string[]} 字段名数组
   */
  const getSensitiveFieldNames = () => {
    return [...new Set(sensitiveFields.map(field => field.field_name))];
  };

  const value = {
    sensitiveFields,
    isLoading,
    loadSensitiveFields,
    isSensitiveField,
    shouldShowEditButton,
    getSensitiveFieldNames,
  };

  return (
    <SensitiveFieldContext.Provider value={value}>
      {children}
    </SensitiveFieldContext.Provider>
  );
}

export function useSensitiveField() {
  const context = useContext(SensitiveFieldContext);
  if (!context) {
    throw new Error('useSensitiveField必须在SensitiveFieldProvider内使用');
  }
  return context;
}

export default SensitiveFieldContext;
