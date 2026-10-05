import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class ApiController {
  @Get()
  index() {
    return {
    success: true,
    message: 'Welcome to Common Management Platform API',
    version: '1.0.0',
    documentation: 'https://github.com/your-repo/api-docs',
    endpoints: {
      auth: {
        register: 'POST /api/system/auth/register',
        login: 'POST /api/system/auth/login',
        me: 'GET /api/system/auth/me',
        changePassword: 'POST /api/system/auth/change-password',
        refreshToken: 'POST /api/system/auth/refresh-token',
        logout: 'POST /api/system/auth/logout',
      },
      users: {
        list: 'GET /api/system/users',
        get: 'GET /api/system/users/:id',
        create: 'POST /api/system/users',
        update: 'PUT /api/system/users/:id',
        delete: 'DELETE /api/system/users/:id',
        resetPassword: 'POST /api/system/users/:id/reset-password',
      },
      roles: {
        list: 'GET /api/system/roles',
        all: 'GET /api/system/roles/all',
        get: 'GET /api/system/roles/:id',
        create: 'POST /api/system/roles',
        update: 'PUT /api/system/roles/:id',
        delete: 'DELETE /api/system/roles/:id',
      },
      permissions: {
        list: 'GET /api/system/permissions',
        all: 'GET /api/system/permissions/all',
        get: 'GET /api/system/permissions/:id',
        create: 'POST /api/system/permissions',
        update: 'PUT /api/system/permissions/:id',
        delete: 'DELETE /api/system/permissions/:id',
        resources: 'GET /api/system/permissions/resources',
        actions: 'GET /api/system/permissions/actions',
        categories: 'GET /api/system/permissions/categories',
      },
      menus: {
        list: 'GET /api/system/menus',
        tree: 'GET /api/system/menus/tree',
        userTree: 'GET /api/system/menus/user-tree',
        get: 'GET /api/system/menus/:id',
        create: 'POST /api/system/menus',
        update: 'PUT /api/system/menus/:id',
        delete: 'DELETE /api/system/menus/:id',
      },
      departments: {
        list: 'GET /api/system/departments',
        tree: 'GET /api/system/departments/tree',
        get: 'GET /api/system/departments/:id',
        members: 'GET /api/system/departments/:id/members',
        create: 'POST /api/system/departments',
        update: 'PUT /api/system/departments/:id',
        delete: 'DELETE /api/system/departments/:id',
      },
      folders: {
        list: 'GET /api/system/folders',
        tree: 'GET /api/system/folders/tree',
        get: 'GET /api/system/folders/:id',
        contents: 'GET /api/system/folders/:id/contents',
        create: 'POST /api/system/folders',
        update: 'PUT /api/system/folders/:id',
        delete: 'DELETE /api/system/folders/:id',
      },
      files: {
        list: 'GET /api/system/files',
        get: 'GET /api/system/files/:id',
        upload: 'POST /api/system/files/upload',
        download: 'GET /api/system/files/:id/download',
        preview: 'GET /api/system/files/:id/preview',
        update: 'PUT /api/system/files/:id',
        delete: 'DELETE /api/system/files/:id',
        batchDelete: 'POST /api/system/files/batch-delete',
        move: 'PUT /api/system/files/:id/move',
        copy: 'POST /api/system/files/:id/copy',
        stats: 'GET /api/system/files/stats',
      },
      fileShares: {
        list: 'GET /api/system/file-shares',
        get: 'GET /api/system/file-shares/:shareCode',
        create: 'POST /api/system/file-shares',
        download: 'GET /api/system/file-shares/:shareCode/download',
        delete: 'DELETE /api/system/file-shares/:id',
      },
      health: 'GET /health',
    },
    };
  }
}
