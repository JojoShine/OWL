import axios from '../../utils/http-client';

// 文件夹管理API
export const folderApi = {
  // 获取文件夹树
  getFolderTree: () => axios.get('/folders/tree'),

  // 获取文件夹列表
  getFolders: (params) => axios.get('/folders', { params }),

  // 获取文件夹详情
  getFolder: (id) => axios.get(`/folders/${id}`),

  // 获取文件夹内容（子文件夹 + 文件）
  getFolderContents: (id, params) => axios.get(`/folders/${id}/contents`, { params }),

  // 创建文件夹
  createFolder: (data) => axios.post('/folders', data),

  // 更新文件夹
  updateFolder: (id, data) => axios.put(`/folders/${id}`, data),

  // 删除文件夹
  deleteFolder: (id) => axios.delete(`/folders/${id}`),

  // 获取文件夹权限列表
  getPermissions: (folderId) => axios.get(`/folders/${folderId}/permissions`),

  // 添加文件夹权限
  addPermission: (folderId, data) => axios.post(`/folders/${folderId}/permissions`, data),

  // 设置文件夹权限继承
  setInherit: (folderId, data) => axios.put(`/folders/${folderId}/inherit`, data),
};

// 文件管理API
export const fileApi = {
  // 上传文件（单个或多个）
  uploadFiles: (files, folderId, onProgress) => {
    const formData = new FormData();

    // 支持单个或多个文件
    if (Array.isArray(files)) {
      files.forEach(file => {
        formData.append('files', file);
      });
    } else {
      formData.append('files', files);
    }

    if (folderId) {
      formData.append('folder_id', folderId);
    }

    return axios.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
  },

  // 获取文件列表
  getFiles: (params) => axios.get('/files', { params }),

  // 获取文件详情
  getFile: (id) => axios.get(`/files/${id}`),

  // 更新文件（重命名）
  updateFile: (id, data) => axios.put(`/files/${id}`, data),

  // 删除文件
  deleteFile: (id) => axios.delete(`/files/${id}`),

  // 批量删除文件
  batchDeleteFiles: (ids) => axios.post('/files/batch-delete', { ids }),

  // 下载文件
  downloadFile: (id) => axios.get(`/files/${id}/download`, { responseType: 'blob' }),

  // 预览文件
  previewFile: (id) => axios.get(`/files/${id}/preview-public`, { responseType: 'blob' }),

  // 移动文件
  moveFile: (id, folderId) => axios.put(`/files/${id}/move`, { folder_id: folderId }),

  // 复制文件
  copyFile: (id, folderId) => axios.post(`/files/${id}/copy`, { folder_id: folderId }),

  // 获取存储统计
  getStats: () => axios.get('/files/stats'),

  // 获取文件权限列表
  getPermissions: (fileId) => axios.get(`/files/${fileId}/permissions`),

  // 添加文件权限
  addPermission: (fileId, data) => axios.post(`/files/${fileId}/permissions`, data),

  // 设置文件权限继承
  setInherit: (fileId, data) => axios.put(`/files/${fileId}/inherit`, data),
};

// 文件分享API
export const fileShareApi = {
  // 获取用户的所有分享
  getShares: () => axios.get('/file-shares'),

  // 获取分享信息（通过分享码）
  getShareByCode: (shareCode) => axios.get(`/file-shares/${shareCode}`),

  // 创建文件分享
  createShare: (data) => axios.post('/file-shares', data),

  // 下载分享的文件
  downloadSharedFile: (shareCode) => axios.get(`/file-shares/${shareCode}/download`, { responseType: 'blob' }),

  // 删除分享
  deleteShare: (id) => axios.delete(`/file-shares/${id}`),
};