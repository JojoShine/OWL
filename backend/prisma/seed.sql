-- Optimized Database Seeder
-- Proper execution order to prevent foreign key constraint violations
-- Database: common_management
-- Created: 2025-12-10T09:03:20.813Z

BEGIN;

-- ============================================
-- Table: departments
-- Records: 4
-- ============================================
ALTER SEQUENCE IF EXISTS owl_departments_id_seq RESTART;
-- Root departments (parent_id = NULL) must be inserted first
INSERT INTO public."owl_departments" ("id", "parent_id", "name", "code", "leader_id", "description", "sort", "status",
                                      "created_at", "updated_at")
VALUES ('4f272cdf-1e5f-4d7d-8c67-8d9bd39b6110', NULL, '市场部', 'MARKET', NULL, '负责市场推广和销售', 2, 'active',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_departments" ("id", "parent_id", "name", "code", "leader_id", "description", "sort", "status",
                                      "created_at", "updated_at")
VALUES ('d3c7b289-50d6-4f95-8e60-3802c61876b1', NULL, '技术部', 'TECH', '99e2337b-8676-4414-b71e-d5aff2008616',
        '负责公司技术研发工作', 1, 'active', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
-- Child departments - these reference parent departments inserted above
INSERT INTO public."owl_departments" ("id", "parent_id", "name", "code", "leader_id", "description", "sort", "status",
                                      "created_at", "updated_at")
VALUES ('30a6f3b2-699c-4efd-b077-611696fba4c2', 'd3c7b289-50d6-4f95-8e60-3802c61876b1', '测试部', 'QA', NULL,
        '负责产品质量保证', 2, 'active', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_departments" ("id", "parent_id", "name", "code", "leader_id", "description", "sort", "status",
                                      "created_at", "updated_at")
VALUES ('afac37c4-d35e-471e-a8bc-b4d72efb2e5b', 'd3c7b289-50d6-4f95-8e60-3802c61876b1', '研发部', 'DEV', NULL,
        '负责产品开发和维护', 1, 'active', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');


-- ============================================
-- Table: roles
-- Records: 3
-- ============================================
ALTER SEQUENCE IF EXISTS owl_roles_id_seq RESTART;
INSERT INTO public."owl_roles" ("id", "name", "code", "description", "status", "sort", "created_at", "updated_at",
                                "deleted_at")
VALUES ('5bbddbca-0ace-4641-8a5b-8882a648ca49', '超级管理员', 'super_admin', '拥有系统所有权限', 'active', 1,
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"', NULL);
INSERT INTO public."owl_roles" ("id", "name", "code", "description", "status", "sort", "created_at", "updated_at",
                                "deleted_at")
VALUES ('6b81e3c2-ec0c-40f3-8e00-ec54f1b41345', '管理员', 'admin', '拥有大部分管理权限', 'active', 2,
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"', NULL);
INSERT INTO public."owl_roles" ("id", "name", "code", "description", "status", "sort", "created_at", "updated_at",
                                "deleted_at")
VALUES ('b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '普通用户', 'user', '普通用户角色，只有查看权限', 'active', 3,
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"', NULL);


-- ============================================
-- Table: permissions
-- Records: 57
-- ============================================
ALTER SEQUENCE IF EXISTS owl_permissions_id_seq RESTART;
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('024169e2-0532-40f1-a5a0-c7feedd44494', '查看用户', 'user:read', 'user', 'read', '查看用户列表和详情',
        '用户管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('0295f5fa-3cae-4005-8652-0d954670e588', '查看日志', 'log:read', 'log', 'read', '查看和导出系统日志', '日志管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('064a4b1a-eb86-4212-a533-1b514fbfa2d8', '创建文件夹', 'folder:create', 'folder', 'create', '创建新文件夹',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('139331b6-cd33-4331-8719-6eaae116aabb', '删除邮件模板', 'email_template:delete', 'email_template', 'delete',
        '删除邮件模板', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('1acd47ae-53b4-4a37-bc1a-2b527a98891a', '创建API密钥', 'api-key:create', 'api-key', 'create', '创建新的API密钥',
        '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('2086184f-1dbd-4c31-890d-f8749e5c0429', '更新用户', 'user:update', 'user', 'update', '更新用户信息', '用户管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('20beadc6-4aa9-40ab-a930-6633fc6985c4', '删除接口', 'api-interface:delete', 'api-interface', 'delete',
        '删除接口', '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('269049e4-a8a7-4e93-b5c6-aa5aa5029f59', '创建权限', 'permission:create', 'permission', 'create', '创建新权限',
        '权限管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('2996c5af-dffe-46e2-983a-d98f3bafd90c', '查看监控', 'monitor:read', 'monitor', 'read', '查看系统监控数据',
        'monitor', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('2a9d8ab4-1ccf-43b0-b4b2-58d39d4862ee', '删除配置', 'generator:delete', 'generator', 'delete',
        '删除模块配置和生成的代码', '代码生成', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('2cbe8702-e4ca-4a9f-8281-844e88f3510b', '创建菜单', 'menu:create', 'menu', 'create', '创建新菜单', '菜单管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('30be8930-048c-40cd-a1d5-33eb35dde5aa', '编辑水印配置', 'watermark:update', 'watermark', 'update',
        '允许编辑水印配置', 'system', '"2025-12-10T05:57:14.853Z"', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('31beda1e-cc51-4787-9f68-8e2c115b2921', '删除菜单', 'menu:delete', 'menu', 'delete', '删除菜单', '菜单管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('3372a808-a112-4880-ac8a-e057e48c3a35', '编辑API密钥', 'api-key:update', 'api-key', 'update',
        '编辑和更新API密钥', '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('3e52b630-0fe0-49fd-8155-ad768c53b2d8', '创建用户', 'user:create', 'user', 'create', '创建新用户', '用户管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('40ae0cde-41d3-449f-95fc-dd4c7d476ee2', '查看通知', 'notification:read', 'notification', 'read', '查看站内通知',
        '通知管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('4d3127f7-5755-4ed4-af1f-e2d6357dfeab', '删除权限', 'permission:delete', 'permission', 'delete', '删除权限',
        '权限管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('4e527c72-862e-46d6-bd15-05547109dcb9', '备份日志', 'log:create', 'log', 'create', '备份日志到对象存储',
        '日志管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('5ac2feb3-6791-483d-9ef8-328eda16ff99', '更新部门', 'department:update', 'department', 'update', '更新部门信息',
        '部门管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('62456aca-9cd1-4e14-a33e-7adbf126acfc', '查看权限', 'permission:read', 'permission', 'read',
        '查看权限列表和详情', '权限管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('6c73274a-f38f-4a3f-b245-d1b88d57c15a', '创建代码', 'generator:create', 'generator', 'create',
        '初始化配置和生成代码', '代码生成', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('72db0d90-6cc4-406e-8765-a6c48f885c4b', '查看分享', 'file-share:read', 'file-share', 'read', '查看文件分享列表',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('76db4052-4e5d-41ea-9205-a2871a3493a0', '创建部门', 'department:create', 'department', 'create', '创建新部门',
        '部门管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('88d70fc2-d68f-4b8f-9d19-d03f208ff5d8', '删除API密钥', 'api-key:delete', 'api-key', 'delete', '删除API密钥',
        '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('895fdc25-c9cf-4d4e-af22-aa5ed425b49f', '删除文件夹', 'folder:delete', 'folder', 'delete', '删除文件夹',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('8bec9047-5937-4db1-96fc-c2ee8be5f1d6', '更新配置', 'generator:update', 'generator', 'update', '更新模块配置',
        '代码生成', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('8cd36f75-89e8-4929-b7f0-016263031d32', '配置日志', 'log:update', 'log', 'update', '配置日志系统', '日志管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('8e8e39d5-9c94-42d8-b9b4-5db3ef47ca51', '更新菜单', 'menu:update', 'menu', 'update', '更新菜单信息', '菜单管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('8ea9f023-9813-4636-8161-8037d5d771e3', '更新文件', 'file:update', 'file', 'update',
        '更新文件信息（重命名、移动）', '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('92e74673-1631-4651-b427-53cb50807720', '创建角色', 'role:create', 'role', 'create', '创建新角色', '角色管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('95469e80-90b0-4f9f-9456-e2b5d27e7376', '查看API密钥', 'api-key:read', 'api-key', 'read', '查看API密钥列表',
        '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('95b16179-fd33-4c71-ab38-3e989b81c8a6', '查看接口', 'api-interface:read', 'api-interface', 'read',
        '查看接口列表和详情', '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('992d1983-5220-47cc-a930-c16ae8c87d2e', '查看部门', 'department:read', 'department', 'read',
        '查看部门列表和详情', '部门管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('a0ae3b0d-ea91-4c57-9fe4-e53a5501d302', '查看文件', 'file:read', 'file', 'read', '查看文件列表和详情',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('a79b87b1-b3cd-4217-8a82-fea08118512d', '删除角色', 'role:delete', 'role', 'delete', '删除角色', '角色管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('ac22363b-9e01-47a6-8214-98f045d49ee4', '更新角色', 'role:update', 'role', 'update', '更新角色信息', '角色管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('ad7dd271-8db1-4bd1-bed4-fa3064fad7a9', '编辑接口', 'api-interface:update', 'api-interface', 'update',
        '编辑和更新接口配置', '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('af43230e-ceb1-43ef-ba7a-551f029cd4dc', '分享文件', 'file:share', 'file-share', 'create', '创建文件分享链接',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('b2cc5246-07d6-4e9d-9e2a-15983fefaca3', '管理通知', 'notification:update', 'notification', 'update',
        '发送和管理通知', '通知管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('b3268fc7-3730-4e43-aa54-4a1d072ecf31', '查看文件夹', 'folder:read', 'folder', 'read', '查看文件夹列表和详情',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('b456c384-fa7f-41b9-92d3-a1c266744e16', '创建邮件模板', 'email_template:create', 'email_template', 'create',
        '创建新邮件模板', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('b837ef47-1821-4de1-a929-8f1df974b1f6', '删除部门', 'department:delete', 'department', 'delete', '删除部门',
        '部门管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('bd9db7d3-687b-4e3a-a5ef-c2aef2b0c0ef', '删除用户', 'user:delete', 'user', 'delete', '删除用户', '用户管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('c00023dd-d328-44df-89b5-88e7528b868b', '查看菜单', 'menu:read', 'menu', 'read', '查看菜单列表和详情',
        '菜单管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('c21cdb67-eb7d-43eb-9384-4975bf474400', '查看角色', 'role:read', 'role', 'read', '查看角色列表和详情',
        '角色管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('c615e0cb-ecfc-4589-8bd2-92659961011d', '查看水印配置', 'watermark:read', 'watermark', 'read',
        '允许查看水印配置', 'system', '"2025-12-10T05:57:14.853Z"', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('c6b79ee2-625b-470b-ba4c-eb709adad277', '管理监控', 'monitor:update', 'monitor', 'update',
        '管理监控配置和告警规则', 'monitor', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('c5e37e50-a136-4dfd-9291-1cbd6195539e', '创建监控', 'monitor:create', 'monitor', 'create',
        '创建新的监控配置和告警规则', 'monitor', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('9d1ca541-1649-4444-b8f7-8f77a818667e', '删除监控', 'monitor:delete', 'monitor', 'delete',
        '删除监控配置和告警规则', 'monitor', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('ca158f71-71cb-4e45-9c32-6f58220f832e', '删除分享', 'file-share:delete', 'file-share', 'delete', '删除文件分享',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('d8e1d305-ff33-4f11-9322-6bf212daec2b', '更新邮件模板', 'email_template:update', 'email_template', 'update',
        '更新邮件模板信息', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('df4b8233-172e-46cc-b7ab-52f15051db50', '查看邮件模板', 'email_template:read', 'email_template', 'read',
        '查看邮件模板列表和详情', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('df4b8233-172e-46cc-7ac0-52f15051db51', '查看邮件任务', 'email-task:read', 'email-task', 'read',
        '查看邮件发送任务列表和详情', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('df4b8233-172e-46cc-7ac0-52f15051db52', '创建邮件任务', 'email-task:create', 'email-task', 'create',
        '创建邮件发送任务', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('df4b8233-172e-46cc-7ac0-52f15051db53', '更新邮件任务', 'email-task:update', 'email-task', 'update',
        '更新邮件任务信息', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('df4b8233-172e-46cc-7ac0-52f15051db54', '删除邮件任务', 'email-task:delete', 'email-task', 'delete',
        '删除邮件任务', '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('e132cadc-511b-44f9-b702-65a01bb72956', '更新权限', 'permission:update', 'permission', 'update', '更新权限信息',
        '权限管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('e5d3fad0-c917-4300-a8aa-cdfefb4f6398', '上传文件', 'file:create', 'file', 'create', '上传文件', '文件管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('e61bcc30-937f-4ece-87d0-385204700a61', '删除文件', 'file:delete', 'file', 'delete', '删除文件', '文件管理',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('ee746fd4-39c3-4bc9-9f50-5a459d4f1cc1', '创建接口', 'api-interface:create', 'api-interface', 'create',
        '创建新的接口', '接口开发', '"2025-12-01T08:24:07.997Z"', '"2025-12-01T08:24:07.997Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('efbe9734-6549-4337-9e86-bc19efa237b4', '更新文件夹', 'folder:update', 'folder', 'update', '更新文件夹信息',
        '文件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('f813f305-5fa7-4117-8da6-15ebd813c002', '查看代码生成器', 'generator:read', 'generator', 'read',
        '查看代码生成器配置和历史', '代码生成', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('facc15c9-55a8-4d37-a188-1c7a80227456', '发送邮件', 'email:create', 'email', 'create', '发送邮件和查看邮件日志',
        '邮件管理', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');


-- ============================================
-- Table: users
-- Records: 3
-- ============================================
-- ============================================
-- 初始用户数据
-- ============================================
-- 用户密码会由 Seeder 在同一事务中重新生成；非管理员示例账号默认禁用。

ALTER SEQUENCE IF EXISTS owl_users_id_seq RESTART;
INSERT INTO public."owl_users" ("id", "username", "email", "password", "real_name", "phone", "avatar", "status",
                                "last_login_at", "last_login_ip", "created_at", "updated_at", "deleted_at",
                                "department_id")
VALUES ('88feb135-7e32-4950-ad65-d6194347d08c', 'manager', 'manager@example.com',
        '$2a$10$QjH97YvOX6PcJyCaXTcLm.xfp.RR4ZLRRWGfbM77E.AEAsv5fjqnC', '管理员', '13800138001', NULL, 'active', NULL,
        NULL, '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"', NULL, 'd3c7b289-50d6-4f95-8e60-3802c61876b1');
INSERT INTO public."owl_users" ("id", "username", "email", "password", "real_name", "phone", "avatar", "status",
                                "last_login_at", "last_login_ip", "created_at", "updated_at", "deleted_at",
                                "department_id")
VALUES ('89093b76-8a32-426c-b5e5-5ca34ec136b9', 'user', '1135059331@qq.com',
        '$2a$10$KqZQorlS8AFULntBYAyOyexNIxP4XiyOy4lwkgXZ77/kfEuaK9X8W', '普通用户', '13800138002', NULL, 'active',
        '"2025-11-18T08:27:20.197Z"', NULL, '"2025-11-18T08:26:43.790Z"', '"2025-11-18T08:32:02.697Z"', NULL, NULL);
INSERT INTO public."owl_users" ("id", "username", "email", "password", "real_name", "phone", "avatar", "status",
                                "last_login_at", "last_login_ip", "created_at", "updated_at", "deleted_at",
                                "department_id")
VALUES ('99e2337b-8676-4414-b71e-d5aff2008616', 'admin', 'admin@example.com',
        '$2a$10$5YMppYUHBWVvENnqLQwWcOksGfUvcbH25Lp6IBUnm9LHAqqUfMSMC', '超级管理员', '13800138000', NULL, 'active',
        '"2025-12-10T05:39:57.221Z"', NULL, '"2025-10-28T00:43:06.737Z"', '"2025-12-10T05:39:57.294Z"', NULL,
        'd3c7b289-50d6-4f95-8e60-3802c61876b1');
-- 短信登录用户示例（无密码用户，仅通过手机号登录）
-- INSERT INTO public."owl_users" ("id", "username", "email", "password", "real_name", "phone", "avatar", "status",
--                                 "last_login_at", "last_login_ip", "created_at", "updated_at", "deleted_at",
--                                 "department_id")
-- VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'user_sms_001', 'sms001@example.com', NULL, '短信用户1', '13900139001',
--         NULL, 'active', NULL, NULL, '"2026-06-06T00:00:00.000Z"', '"2026-06-06T00:00:00.000Z"', NULL, NULL);
-- INSERT INTO public."owl_users" ("id", "username", "email", "password", "real_name", "phone", "avatar", "status",
--                                 "last_login_at", "last_login_ip", "created_at", "updated_at", "deleted_at",
--                                 "department_id")
-- VALUES ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'user_sms_002', 'sms002@example.com', NULL, '短信用户2', '13900139002',
--         NULL, 'active', NULL, NULL, '"2026-06-06T00:00:00.000Z"', '"2026-06-06T00:00:00.000Z"', NULL, NULL);

-- ============================================
-- Table: menus
-- Records: 19
-- ============================================
ALTER SEQUENCE IF EXISTS owl_menus_id_seq RESTART;
-- Root menus (parent_id = NULL) must be inserted first
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('0e734687-5eb8-472f-a138-ed35ce17556a', NULL, '系统管理', NULL, NULL, 'Settings', 'menu', true, 99, 'active',
        NULL, 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('7150a49c-3b3e-4b22-827c-af4aab39d2d7', NULL, '系统工具', NULL, NULL, 'Wrench', 'menu', true, 98, 'active',
        NULL, 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('1cc8a153-2470-4714-8da1-9545db5b8794', NULL, '文件管理', '/files', NULL, 'FolderOpen', 'menu', true, 2,
        'active', 'file:read', 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('20d1ace9-f45a-4888-9a69-733606f583f6', NULL, '消息中心', '/notifications', NULL, 'Bell', 'menu', true, 25,
        'active', 'notification:read', 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('51785958-3437-4938-b77d-ce7cf2d9782b', NULL, '监控系统', NULL, NULL, 'Activity', 'menu', true, 20, 'active',
        NULL, 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('7dbae11a-93a0-4825-bb80-e1a8120de300', NULL, '概览', '/dashboard', NULL, 'LayoutDashboard', 'menu', true, 0,
        'active', NULL, 'business', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('fcca17f1-a067-40bb-8315-948a4371b5ed', NULL, '日志管理', '/logs', NULL, 'FileText', 'menu', true, 10, 'active',
        'log:read', 'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
-- Child menus - these reference parent menus inserted above
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('31aa61d5-711f-43ec-ba19-01035c393a58', '0e734687-5eb8-472f-a138-ed35ce17556a', '角色管理', '/setting/roles',
        'RolesPage', 'Users', 'menu', true, 2, 'active', 'role:read', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('6ae5d75e-3020-4f69-aaa9-df75474c0921', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '通知设置',
        '/setting/notification-settings', NULL, 'Settings', 'menu', true, 85, 'active', NULL, 'system',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('6f6f4f29-38bc-44fd-89b3-c82203678c13', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '接口开发',
        '/setting/api-builder', '', 'Key', 'menu', true, 7, 'active', 'user:read', 'system',
        '"2025-11-27T02:46:53.914Z"', '"2025-11-27T02:47:08.756Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('7896701f-ca95-4293-bda5-2a7281090ef8', '0e734687-5eb8-472f-a138-ed35ce17556a', '部门管理',
        '/setting/departments', 'DepartmentsPage', 'Building2', 'menu', true, 5, 'active', 'department:read', 'system',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('05a7bb9b-bf96-4ce9-b510-bf0d068acd5d', '51785958-3437-4938-b77d-ce7cf2d9782b', '监控概览', '/monitor', NULL,
        'BarChart3', 'menu', true, 1, 'active', 'monitor:read', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('cfa8dc2d-0554-4999-8f2b-98077bcebbc3', '51785958-3437-4938-b77d-ce7cf2d9782b', '接口监控', '/monitor/apis',
        NULL, 'Network', 'menu', true, 2, 'active', 'monitor:update', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('6f13b0c0-3d3f-4aeb-aa75-79cfbb3f806e', '51785958-3437-4938-b77d-ce7cf2d9782b', '服务器监控', '/monitor/servers',
        NULL, 'Server', 'menu', true, 4, 'active', 'monitor:read', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('9289f417-0496-4d7f-839a-7b1198eaa0fd', '0e734687-5eb8-472f-a138-ed35ce17556a', '权限管理',
        '/setting/permissions', 'PermissionsPage', 'Shield', 'menu', true, 3, 'active', 'permission:read', 'system',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('a12f7314-1f9e-44e1-bc7a-8b81aa41d870', '0e734687-5eb8-472f-a138-ed35ce17556a', '用户管理', '/setting/users',
        'UsersPage', 'UserCircle', 'menu', true, 1, 'active', 'user:read', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('d9126103-db5f-43b2-8964-503b65b76983', '0e734687-5eb8-472f-a138-ed35ce17556a', '菜单管理', '/setting/menus',
        'MenusPage', 'MenuIcon', 'menu', true, 4, 'active', 'menu:read', 'system', '"2025-10-28T00:43:06.737Z"',
        '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('eeeeeeee-ffff-0000-1111-222222222222', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '水印设置',
        '/setting/watermark-settings', NULL, 'Waves', 'menu', true, 8, 'active', 'watermark:update', 'system',
        '"2025-12-10T06:07:13.302Z"', '"2025-12-10T06:07:13.302Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('f98825d5-2161-4952-ac09-e3c21f7047d7', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '代码生成器', '/generator', '',
        'Code', 'menu', true, 99, 'active', 'generator:read', 'system', '"2025-11-24T02:31:56.976Z"',
        '"2025-11-24T02:32:23.939Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('feed1e74-6c95-47f6-9576-c2fc7f71ed65', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '邮件管理',
        '/setting/email-templates', NULL, 'Mail', 'menu', true, 80, 'active', 'email_template:read', 'system',
        '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('ffffffff-ffff-ffff-ffff-111111111111', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '配置管理',
        '/setting/config-management', 'ConfigManagementPage', 'Sliders', 'menu', true, 90, 'active', 'config:read',
        'system', '"2025-10-28T00:43:06.737Z"', '"2025-10-28T00:43:06.737Z"');


-- ============================================
-- Table: user_roles
-- Records: 15
-- ============================================
ALTER SEQUENCE IF EXISTS owl_user_roles_id_seq RESTART;
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('1981fb09-6722-417c-b397-4622a5b321dd', '70f069af-41f6-42f3-809f-c2598d4dc0a2',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T09:55:23.154Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('1d499bc1-b082-4f69-a216-aaa78c3c8f3e', '4cd9ae95-83aa-4fc9-81ad-caff5591cd7d',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T08:22:01.493Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('300320dc-b440-443d-948a-13ad704657d5', 'c10a2a62-0024-4177-a3a5-a258da92f1a1',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-17T14:09:31.306Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('31ac842e-2038-4799-86ea-5756fc31cad7', '67020bee-86a0-4dd2-bb18-ea49b08730ce',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T08:44:10.054Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('327f6232-1faa-4edc-b90f-194c425f7697', '99e2337b-8676-4414-b71e-d5aff2008616',
        '5bbddbca-0ace-4641-8a5b-8882a648ca49', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('3b1dbf32-f947-4e34-8bf5-b6d829a2c667', '0ed9aba6-de99-4816-9b53-620ad8a52471',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T03:20:08.772Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('4e8cb7f9-d8d7-456a-bcae-d3039329f137', '88feb135-7e32-4950-ad65-d6194347d08c',
        '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('65b700e8-04f8-4c0a-abde-0e0d075e3639', '89093b76-8a32-426c-b5e5-5ca34ec136b9',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T08:32:02.444Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('6d532f20-56e1-4b7a-b135-c41f9bf81f62', '2bb7c8d0-b6ef-413f-ad0f-7fe35b040220',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T04:55:05.047Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('754a4ac5-df79-44e0-9fd0-aeea009dda36', '30848293-41c8-4a89-bad6-27d7507a826b',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-18T00:06:06.306Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('9829b7f9-2fe6-47e7-80a6-8e38fb0fcbc4', 'ff5f9894-e7aa-4dec-9213-3da07f07a083',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('98e9a35e-2c20-4d06-9023-625a5dfdd6b6', '61976ffe-b6bb-4be2-8ffa-a223315f4e36',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-17T00:14:23.902Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('e6cf5cf1-f50d-4fd5-a038-5604150f2c0e', '2a9216bf-231f-4db1-b8c8-ee82ea3b0889',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-17T01:12:54.234Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('f5c8537f-177d-4eaa-9a0c-83f1e8ccb317', 'a716c9df-b6ea-4e19-a3ff-af22d76e1484',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-17T00:41:44.531Z"');
INSERT INTO public."owl_user_roles" ("id", "user_id", "role_id", "created_at")
VALUES ('f86d47f2-6184-4cd8-a5f5-f7bdf43a077c', 'ef1623c9-c9f2-43f2-9ee4-4c476c04b7cb',
        'b4f563f7-b8a8-4322-b9ac-4b6daae6271f', '"2025-11-17T12:15:33.143Z"');


-- ============================================
-- Table: role_permissions
-- Records: 140
-- ============================================
ALTER SEQUENCE IF EXISTS owl_role_permissions_id_seq RESTART;
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('04ae2420-d405-40a5-9464-098f180a3882', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '88d70fc2-d68f-4b8f-9d19-d03f208ff5d8', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('05696128-4694-4f9a-8ea9-fc6708f485a4', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '62456aca-9cd1-4e14-a33e-7adbf126acfc', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0583d3e0-4410-4572-8ab1-b7b1361a9a2f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b3268fc7-3730-4e43-aa54-4a1d072ecf31', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0676c670-5e50-4f3b-b882-6dd8e64ee48e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '20beadc6-4aa9-40ab-a930-6633fc6985c4', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0916d93e-3f6e-448d-98ef-ea85f4c3ea84', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b456c384-fa7f-41b9-92d3-a1c266744e16', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0b34f101-58cd-4109-a9e3-39dac43b5f02', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '2cbe8702-e4ca-4a9f-8281-844e88f3510b', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0b6cf648-430b-4c4d-962b-d78f9cd9433a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'a79b87b1-b3cd-4217-8a82-fea08118512d', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0bf4db54-39f2-4920-8a3e-8372ce7d7f1a', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '3372a808-a112-4880-ac8a-e057e48c3a35', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0c879f87-6444-423d-a735-cce5c4866162', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'ca158f71-71cb-4e45-9c32-6f58220f832e', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0dee4a01-4916-4c44-8125-3ecfc719513b', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'efbe9734-6549-4337-9e86-bc19efa237b4', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('0ff8bb57-d8a2-4bb0-a285-576126b90255', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '95b16179-fd33-4c71-ab38-3e989b81c8a6', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1037c040-6816-4592-8e98-2c0c42b16b7c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'b3268fc7-3730-4e43-aa54-4a1d072ecf31', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('10d99abd-fcf9-428a-87bc-5db6fe78d35f', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '95469e80-90b0-4f9f-9456-e2b5d27e7376', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1497ddb1-4ba4-429b-8f83-edba29396ae8', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c6b79ee2-625b-470b-ba4c-eb709adad277', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('16da2fa4-e856-45c1-b5d7-18748d574680', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '269049e4-a8a7-4e93-b5c6-aa5aa5029f59', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1789dafb-09ef-4d76-9e2e-7bc6b56b0777', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '1acd47ae-53b4-4a37-bc1a-2b527a98891a', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1b65be2f-76fb-45a2-9155-3af753f23cbd', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '064a4b1a-eb86-4212-a533-1b514fbfa2d8', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1c8b4e72-280a-44c2-9ce8-d04c0c250152', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '6c73274a-f38f-4a3f-b245-d1b88d57c15a', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('1ccf82c7-a14c-493f-9b8c-068a7ae1982d', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '895fdc25-c9cf-4d4e-af22-aa5ed425b49f', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('20f52dce-7ed0-4d06-bf20-736c9822a7e6', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'c00023dd-d328-44df-89b5-88e7528b868b', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('250c4e66-3309-48d2-a510-465584bc8e92', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '2996c5af-dffe-46e2-983a-d98f3bafd90c', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('28526081-17a6-42f6-bc5b-796bc974b94c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '8bec9047-5937-4db1-96fc-c2ee8be5f1d6', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('2922650d-7f89-4fb9-a0e5-f939244a3a03', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '2996c5af-dffe-46e2-983a-d98f3bafd90c', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('2c84382c-986e-4930-a564-7fefe9381344', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '4e527c72-862e-46d6-bd15-05547109dcb9', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('2cd29e75-07ed-4c4c-9964-9ab2fece6702', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '31beda1e-cc51-4787-9f68-8e2c115b2921', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('2f5ccf62-d4a9-4972-a888-350f623c0602', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'c6b79ee2-625b-470b-ba4c-eb709adad277', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('30719827-6da0-4697-a9f9-1d125b694dc0', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '024169e2-0532-40f1-a5a0-c7feedd44494', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('31aef13b-f730-44de-b0a5-a1b810292fcf', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '20beadc6-4aa9-40ab-a930-6633fc6985c4', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('335240b0-36d7-4c7a-bb87-e677938dfd08', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '992d1983-5220-47cc-a930-c16ae8c87d2e', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('35ff85cd-1a08-4727-a079-baeaa9fb3264', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'af43230e-ceb1-43ef-ba7a-551f029cd4dc', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3716cf55-e03e-4e40-82ca-e257e9d2fbaf', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'c00023dd-d328-44df-89b5-88e7528b868b', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('38525e69-62ec-4b92-8120-7234731a2c85', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'd8e1d305-ff33-4f11-9322-6bf212daec2b', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3881d622-ead5-400e-817f-de6cb0c03d8d', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '30be8930-048c-40cd-a1d5-33eb35dde5aa', '"2025-12-10T06:01:00.554Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3a8578aa-e2b6-417c-8257-3c3d872f4660', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'b2cc5246-07d6-4e9d-9e2a-15983fefaca3', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3a9fdbf0-6b6f-4c88-bb6f-b043badcc572', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'd8e1d305-ff33-4f11-9322-6bf212daec2b', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3c9a99a0-a8d2-4123-b85f-0e316ba7d15c', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '4e527c72-862e-46d6-bd15-05547109dcb9', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('3e9c56b0-c97b-4728-b3c6-26e11a99c219', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '3372a808-a112-4880-ac8a-e057e48c3a35', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('403ad73a-db13-4538-92ae-55d348466ad7', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '064a4b1a-eb86-4212-a533-1b514fbfa2d8', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('45883d07-7d2b-446c-ad4c-8ca74480a48e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'a0ae3b0d-ea91-4c57-9fe4-e53a5501d302', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('47fa398f-1147-4388-b8db-980c0f084484', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'bd9db7d3-687b-4e3a-a5ef-c2aef2b0c0ef', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('496a5cdf-0995-40b2-bb10-238eba51a48c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '0295f5fa-3cae-4005-8652-0d954670e588', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('4b7515d3-9483-473f-9f90-b101d23ba0d0', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'e61bcc30-937f-4ece-87d0-385204700a61', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('50dce7f3-2eca-4776-ad62-fc93c862d372', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c615e0cb-ecfc-4589-8bd2-92659961011d', '"2025-12-10T06:01:00.554Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('5156caff-fd3a-4eee-95dc-518712c91fb3', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '2a9d8ab4-1ccf-43b0-b4b2-58d39d4862ee', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('52620b41-7ff7-4f6d-ac3a-e014b9413262', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'e132cadc-511b-44f9-b702-65a01bb72956', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('5689aa20-2a8e-4484-b27a-7299cdc220ba', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '139331b6-cd33-4331-8719-6eaae116aabb', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('56983def-19cf-4047-b9e4-71c9a6e6a489', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '2cbe8702-e4ca-4a9f-8281-844e88f3510b', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('58025d15-2749-4ecb-83f8-f9a8e342b091', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '31beda1e-cc51-4787-9f68-8e2c115b2921', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('5e1c3aaf-5c50-44ad-88ad-24c023da3620', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'ad7dd271-8db1-4bd1-bed4-fa3064fad7a9', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('5e6acd1c-5cac-484d-a945-54da1d7b12c7', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '95469e80-90b0-4f9f-9456-e2b5d27e7376', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('5eb6c85c-8442-4332-8b66-e5830ececc86', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '76db4052-4e5d-41ea-9205-a2871a3493a0', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('61262923-5893-4495-a31c-59e5541843a9', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '8cd36f75-89e8-4929-b7f0-016263031d32', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('6131c009-609c-418a-830d-3c6b98f42b84', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '024169e2-0532-40f1-a5a0-c7feedd44494', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('6bebcb2e-116a-42b2-9d44-d2b8f9d38480', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '30be8930-048c-40cd-a1d5-33eb35dde5aa', '"2025-12-10T06:01:00.554Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7122897d-1daa-4515-b72f-0863d06eaae4', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'b456c384-fa7f-41b9-92d3-a1c266744e16', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('73140c60-3d0e-44c0-ad55-e2d80957bb4a', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'b456c384-fa7f-41b9-92d3-a1c266744e16', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7319635e-9ff3-454f-bc6c-1257008c7dc7', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '40ae0cde-41d3-449f-95fc-dd4c7d476ee2', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('757e5f54-ad45-4300-8692-5d965ee11efe', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'f813f305-5fa7-4117-8da6-15ebd813c002', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('766d2425-e30b-4e3c-ac89-773b98f81b64', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'bd9db7d3-687b-4e3a-a5ef-c2aef2b0c0ef', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('77ef31ea-5b3a-40b5-bd53-76b66997b7ba', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '40ae0cde-41d3-449f-95fc-dd4c7d476ee2', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('79654174-7778-42d2-a831-e1e5118074f7', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'df4b8233-172e-46cc-b7ab-52f15051db50', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('79bc9bc6-5873-454f-8234-eabfa914172c', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'ee746fd4-39c3-4bc9-9f50-5a459d4f1cc1', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7d84e109-6a81-4bf5-9c3c-b9e5cefc2935', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '8cd36f75-89e8-4929-b7f0-016263031d32', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7f37e7b4-ea61-4ec2-91b6-8a694b5da42e', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'facc15c9-55a8-4d37-a188-1c7a80227456', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7fd93de6-c71f-4192-80ad-be4cd3335a74', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '72db0d90-6cc4-406e-8765-a6c48f885c4b', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('7ffc7967-9476-4a88-9c3e-17541141f156', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '992d1983-5220-47cc-a930-c16ae8c87d2e', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('800d49c9-00b4-40d6-9cf4-08ecb41666cc', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '95469e80-90b0-4f9f-9456-e2b5d27e7376', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('812b3dce-4806-49b7-b12a-b4433735aae1', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'e61bcc30-937f-4ece-87d0-385204700a61', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('84c4cdb1-4b21-47f6-864a-bf9548094971', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'c615e0cb-ecfc-4589-8bd2-92659961011d', '"2025-12-10T06:01:00.554Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('84e094a4-a85e-4be2-b498-f5fbba06b1cd', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '139331b6-cd33-4331-8719-6eaae116aabb', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('883d60f3-2dba-4100-a4a7-7cefb19fa849', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '76db4052-4e5d-41ea-9205-a2871a3493a0', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('89af4788-09ed-40c7-8093-74596992340d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '1acd47ae-53b4-4a37-bc1a-2b527a98891a', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('89cfcf2c-d674-4f2f-bc3e-0c7fe3cb8848', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'df4b8233-172e-46cc-b7ab-52f15051db50', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('8a24c0f2-6e18-4b09-8f7c-079340475bdd', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '139331b6-cd33-4331-8719-6eaae116aabb', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('8a7ab66a-99e8-4a0e-b0a8-a494ee8293fa', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '62456aca-9cd1-4e14-a33e-7adbf126acfc', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('8fcf17cc-4d91-4dc1-98f5-7e3b66aaaf45', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c21cdb67-eb7d-43eb-9384-4975bf474400', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('9334399c-09e9-413f-85ac-780af9e187df', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '95b16179-fd33-4c71-ab38-3e989b81c8a6', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('999f0527-709a-47b0-9a54-04d18901a3f4', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'b2cc5246-07d6-4e9d-9e2a-15983fefaca3', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('9d37597c-32a2-4fc6-aee5-9712f2ec2d8e', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '8e8e39d5-9c94-42d8-b9b4-5db3ef47ca51', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('9eff8691-2027-4331-87b0-bfcc7a8726f0', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'd8e1d305-ff33-4f11-9322-6bf212daec2b', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('9f416207-afb7-4a98-a05b-1101e4bb628c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '5ac2feb3-6791-483d-9ef8-328eda16ff99', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a23686c7-7f22-44eb-8b1a-c90c43415ab1', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '0295f5fa-3cae-4005-8652-0d954670e588', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a2e8d90f-801a-46fe-8380-0b46d4157040', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '8e8e39d5-9c94-42d8-b9b4-5db3ef47ca51', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a56780dc-72d4-4f5f-8d4a-67ce995bdb80', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '8cd36f75-89e8-4929-b7f0-016263031d32', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a64b263f-1173-4fd4-8215-771a97a203bb', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '2a9d8ab4-1ccf-43b0-b4b2-58d39d4862ee', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a67ca7ad-5364-4477-9f28-fd00b773da17', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'f813f305-5fa7-4117-8da6-15ebd813c002', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a6e73c04-a24c-4ccb-9053-7a85578f178d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'ca158f71-71cb-4e45-9c32-6f58220f832e', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a754e225-bcd3-4a01-b17f-8b56538460ef', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '024169e2-0532-40f1-a5a0-c7feedd44494', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a767a596-41d0-4619-99f3-79f89e34acbd', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'ee746fd4-39c3-4bc9-9f50-5a459d4f1cc1', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a9cda31a-5092-42cd-99ec-865db16ea98e', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '2086184f-1dbd-4c31-890d-f8749e5c0429', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a9dab38f-2644-45b9-a5e6-86ced7357453', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'a79b87b1-b3cd-4217-8a82-fea08118512d', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ab5b6a58-6d43-481e-a3b6-98ca9eb13ac6', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '6c73274a-f38f-4a3f-b245-d1b88d57c15a', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ac9f5487-bc14-4b8c-a0c3-1a464748353c', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b2cc5246-07d6-4e9d-9e2a-15983fefaca3', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ad7f9c6c-c70b-4b17-babf-99fcdb8f0bab', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'f813f305-5fa7-4117-8da6-15ebd813c002', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('aea7b0cb-5e9d-4803-ab92-a80032dbd18b', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '6c73274a-f38f-4a3f-b245-d1b88d57c15a', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('b1119950-1eae-44f3-9900-c1591a54f7c6', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '3372a808-a112-4880-ac8a-e057e48c3a35', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('b11c7375-644f-484b-ab0a-292a400f7030', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '8ea9f023-9813-4636-8161-8037d5d771e3', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('b21a2c4f-e919-4dc9-9b72-a1215d2e96e4', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '40ae0cde-41d3-449f-95fc-dd4c7d476ee2', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('b53b1c9a-8c6a-40bb-b798-cc45ab156f3a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '2996c5af-dffe-46e2-983a-d98f3bafd90c', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ba83a5ac-7f7e-4c1e-a871-02b2ca1fe23d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '895fdc25-c9cf-4d4e-af22-aa5ed425b49f', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('baa57b36-6b91-47db-ad7a-5d82bab1deaa', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c00023dd-d328-44df-89b5-88e7528b868b', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('bbcf4483-a434-414d-857f-8c7693b21de6', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'c21cdb67-eb7d-43eb-9384-4975bf474400', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('bbd55636-7458-46ca-9e2a-f4029e143abe', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '20beadc6-4aa9-40ab-a930-6633fc6985c4', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('bc5ff76f-0b68-41a4-ab2b-94bdea9a6818', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'a0ae3b0d-ea91-4c57-9fe4-e53a5501d302', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('bceda558-1bb5-4345-9f0c-acf8fb2dfa7b', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b837ef47-1821-4de1-a929-8f1df974b1f6', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('bf572c31-8427-42f4-8409-8d3415b07b42', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '92e74673-1631-4651-b427-53cb50807720', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c007247e-21a9-4616-87cc-7dfc63626596', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '8bec9047-5937-4db1-96fc-c2ee8be5f1d6', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c2bdff74-c338-4a3a-88cb-370f282e20d8', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'af43230e-ceb1-43ef-ba7a-551f029cd4dc', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c3e13b3f-6cd3-4c8b-a830-7436731d3599', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'ee746fd4-39c3-4bc9-9f50-5a459d4f1cc1', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c516cc3c-871a-4721-8452-958f6686342c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'ac22363b-9e01-47a6-8214-98f045d49ee4', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c6a47343-1604-47c2-b94d-ed1704b0f461', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '2086184f-1dbd-4c31-890d-f8749e5c0429', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c7731db8-8b36-4aa6-a95b-1109beb83020', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '8bec9047-5937-4db1-96fc-c2ee8be5f1d6', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c7c3bf99-647d-45cc-a09a-45826f22e3a2', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '0295f5fa-3cae-4005-8652-0d954670e588', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('cf907ab9-655f-4d4f-a0fb-82ed1e937391', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'c6b79ee2-625b-470b-ba4c-eb709adad277', '"2025-11-12T06:43:07.179Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d4863c59-60f9-4a53-bd20-0de0b3b1fd4b', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '992d1983-5220-47cc-a930-c16ae8c87d2e', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d4ee7836-9f54-48c6-88c0-416c5549ab7f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'e5d3fad0-c917-4300-a8aa-cdfefb4f6398', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d53870a3-5ca2-4008-842c-12fad81b6a31', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '1acd47ae-53b4-4a37-bc1a-2b527a98891a', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d5ce4b93-8532-46de-a21d-1507b0fa6461', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '3e52b630-0fe0-49fd-8155-ad768c53b2d8', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d6dc5605-a988-4bc5-8745-95f0fa3bfa64', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'b837ef47-1821-4de1-a929-8f1df974b1f6', '"2025-11-12T06:43:07.183Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('d9623786-c76f-4358-b419-fc91c01a8293', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '88d70fc2-d68f-4b8f-9d19-d03f208ff5d8', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('da1a570f-d837-42bb-a219-2a5a340423b5', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '4d3127f7-5755-4ed4-af1f-e2d6357dfeab', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('dad8716b-1455-4d20-b499-8f0d91f005dc', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'efbe9734-6549-4337-9e86-bc19efa237b4', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('dc2db581-0dc6-41d3-ac0b-6fc144c7107a', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '95b16179-fd33-4c71-ab38-3e989b81c8a6', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('dfc5dd57-0540-4f52-95be-5759ff995365', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'c615e0cb-ecfc-4589-8bd2-92659961011d', '"2025-12-10T06:01:00.554Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e1690fc3-6d6b-4db2-83bf-e5c73f23b0c1', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'facc15c9-55a8-4d37-a188-1c7a80227456', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e5003d22-2d3e-4e07-91e9-db606e1f7d98', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'facc15c9-55a8-4d37-a188-1c7a80227456', '"2025-11-12T06:43:07.182Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e524a764-62d3-492c-b76a-57dc6171a616', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '8ea9f023-9813-4636-8161-8037d5d771e3', '"2025-11-27T02:47:21.234Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e5a4e2be-7986-4784-8c1d-802a927d1400', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '3e52b630-0fe0-49fd-8155-ad768c53b2d8', '"2025-11-12T06:43:07.181Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e60d0bb1-2236-4a9d-9680-e5af90e4d198', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'ac22363b-9e01-47a6-8214-98f045d49ee4', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('e76ea041-966f-4b09-9f7b-bd99f2495047', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '88d70fc2-d68f-4b8f-9d19-d03f208ff5d8', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ea8392e5-d2ae-4083-ab28-646c10e99dd2', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'ad7dd271-8db1-4bd1-bed4-fa3064fad7a9', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('ec519e9d-0b5d-4c13-a887-f9a4a9cf2f5a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '5ac2feb3-6791-483d-9ef8-328eda16ff99', '"2025-11-27T02:47:21.236Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('f2013cad-29fa-43b8-b10c-106128289dd9', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '92e74673-1631-4651-b427-53cb50807720', '"2025-11-27T02:47:21.235Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('f3cc956d-a7b8-45d5-b62e-df0357bb3a37', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '72db0d90-6cc4-406e-8765-a6c48f885c4b', '"2025-11-27T02:47:21.233Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('f773132c-5eda-4a24-82d5-40e09a370b4b', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'c21cdb67-eb7d-43eb-9384-4975bf474400', '"2025-11-18T08:30:26.126Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('f96fcb31-57a3-4d6e-825f-89c8ac84c813', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'df4b8233-172e-46cc-b7ab-52f15051db50', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fa4a0939-96c1-4be3-a968-3a75f0bb288a', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'e5d3fad0-c917-4300-a8aa-cdfefb4f6398', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fba26f0a-9309-4b8c-b8e0-96f412607bf4', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'ad7dd271-8db1-4bd1-bed4-fa3064fad7a9', '"2025-12-01T08:24:08.095Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fce2efe8-0615-4ecb-8c48-c79b37d6d087', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '2a9d8ab4-1ccf-43b0-b4b2-58d39d4862ee', '"2025-11-18T08:30:26.127Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fd669c6e-c519-45a3-a17f-8796a887be07', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '4e527c72-862e-46d6-bd15-05547109dcb9', '"2025-11-12T06:43:07.180Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fd669c6e-c519-45a3-a17f-8796a887be08', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'df4b8233-172e-46cc-7ac0-52f15051db51', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fd669c6e-c519-45a3-a17f-8796a887be09', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'df4b8233-172e-46cc-7ac0-52f15051db52', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fd669c6e-c519-45a3-a17f-8796a887be0a', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'df4b8233-172e-46cc-7ac0-52f15051db53', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('fd669c6e-c519-45a3-a17f-8796a887be0b', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'df4b8233-172e-46cc-7ac0-52f15051db54', '"2025-12-10T05:57:14.853Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a1b2c3d4-0001-4000-8000-000000000001', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'c5e37e50-a136-4dfd-9291-1cbd6195539e', '"2025-10-28T00:43:06.737Z"');
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('a1b2c3d4-0002-4000-8000-000000000002', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '9d1ca541-1649-4444-b8f7-8f77a818667e', '"2025-10-28T00:43:06.737Z"');


-- ============================================
-- Table: role_menus
-- Records: 54
-- ============================================
ALTER SEQUENCE IF EXISTS owl_role_menus_id_seq RESTART;
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('01e66b91-655e-4f45-83fd-2855bf391035', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'd9126103-db5f-43b2-8964-503b65b76983', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('032032f3-f090-4415-97d4-00fd8fad689f', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'feed1e74-6c95-47f6-9576-c2fc7f71ed65', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('051e04c7-5098-47bd-8028-dbf6434dc37e', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '31aa61d5-711f-43ec-ba19-01035c393a58', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('0baf1bce-5eb2-4365-b57d-344dc928074c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'eeeeeeee-ffff-0000-1111-222222222222', '"2025-12-10T06:08:37.830Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('14161645-a179-449b-8291-6448eed6a3e6', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '31aa61d5-711f-43ec-ba19-01035c393a58', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('164a79c1-d349-4b1b-94da-aeb07a71d734', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'fcca17f1-a067-40bb-8315-948a4371b5ed', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('249254e2-4294-4201-828c-de0c45933c01', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'cfa8dc2d-0554-4999-8f2b-98077bcebbc3', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('2b42425f-3a68-4b52-8f2f-4d30e2ff572f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '9289f417-0496-4d7f-839a-7b1198eaa0fd', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('2c40af45-902c-4d9a-ae20-3e9fa5d8914a', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '20d1ace9-f45a-4888-9a69-733606f583f6', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('2e1912fb-2e40-49f8-9a10-fa64a4494813', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'fcca17f1-a067-40bb-8315-948a4371b5ed', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('2f4f3d1c-1eab-4f43-a72c-d55c3a729b5a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '1cc8a153-2470-4714-8da1-9545db5b8794', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('35f54a3d-f5e7-47b8-9120-4f2ca3ae0996', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '7896701f-ca95-4293-bda5-2a7281090ef8', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('35fcf23c-55bc-4cac-9878-33a625e44a89', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'd9126103-db5f-43b2-8964-503b65b76983', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('381242b2-c538-409d-92c8-6924e108601c', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '9289f417-0496-4d7f-839a-7b1198eaa0fd', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('386c03f8-6a12-4d40-be1a-2066ee389b5f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '6ae5d75e-3020-4f69-aaa9-df75474c0921', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('3ebc4a1c-e4ec-48dd-b829-96823b6d5446', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '51785958-3437-4938-b77d-ce7cf2d9782b', '"2025-11-12T06:43:07.512Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('403ea6fc-2ff3-4d95-b1b3-800bf6424fbf', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '6f6f4f29-38bc-44fd-89b3-c82203678c13', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('4879fd01-3719-4a41-9c18-719d79db53f0', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '9289f417-0496-4d7f-839a-7b1198eaa0fd', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('4fae61ac-979b-44ba-8fea-abcd35868802', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'd9126103-db5f-43b2-8964-503b65b76983', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('59247b8b-c9e3-4be9-83de-8cece20c0012', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '51785958-3437-4938-b77d-ce7cf2d9782b', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('5ae06b82-b3a2-4a40-97e9-4eb24f4fd810', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '7896701f-ca95-4293-bda5-2a7281090ef8', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('5da08cac-3f37-41af-a2f9-9297fd7feb14', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '20d1ace9-f45a-4888-9a69-733606f583f6', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('66a6565d-fd3d-47be-9d43-f165421ad7fc', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '7dbae11a-93a0-4825-bb80-e1a8120de300', '"2025-11-12T06:43:07.512Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('6747729c-2f3b-4ad9-90a5-638acc948984', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '05a7bb9b-bf96-4ce9-b510-bf0d068acd5d', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('7101dcc1-3c01-477d-b1ab-f4b8a86fe58d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'a12f7314-1f9e-44e1-bc7a-8b81aa41d870', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('74abe63a-ce3c-4217-baf8-7ecdf7a86efb', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '1cc8a153-2470-4714-8da1-9545db5b8794', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('752bd7ab-a0ce-4455-9be9-4061f718cdb6', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '20d1ace9-f45a-4888-9a69-733606f583f6', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('76ec3e78-af7d-44b4-88fd-4e572e1984d0', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'a12f7314-1f9e-44e1-bc7a-8b81aa41d870', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('79522ec5-9684-41af-ac6d-b8a04e8c1403', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '31aa61d5-711f-43ec-ba19-01035c393a58', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('875fc23c-8b36-4423-b8d2-148f00f7275b', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '7dbae11a-93a0-4825-bb80-e1a8120de300', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('8a78d27c-f26f-4ca9-b15e-d66f2fadf3cd', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'cfa8dc2d-0554-4999-8f2b-98077bcebbc3', '"2025-11-18T08:30:26.407Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('8c4842fb-6ce2-4de5-9ce3-7e872c9c6f41', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'fcca17f1-a067-40bb-8315-948a4371b5ed', '"2025-11-12T06:43:07.512Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('8e3f227b-9930-4116-b6bf-88b9d27be5e5', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '1cc8a153-2470-4714-8da1-9545db5b8794', '"2025-11-12T06:43:07.512Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('97242956-56c0-456a-8a43-4e6df5e39252', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '6ae5d75e-3020-4f69-aaa9-df75474c0921', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('9e411214-fa48-440c-9c98-208d3b9de350', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '7dbae11a-93a0-4825-bb80-e1a8120de300', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('aaf5a4ce-cdd4-49c0-a5d4-8be6351c1cdb', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        'feed1e74-6c95-47f6-9576-c2fc7f71ed65', '"2025-11-18T08:30:26.407Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('b9d7f377-8019-470b-a914-c58cd0ed085c', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'f98825d5-2161-4952-ac09-e3c21f7047d7', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('beb33f12-e812-4ca1-b95d-d0bbd0f34b4a', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '7896701f-ca95-4293-bda5-2a7281090ef8', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('ced7a516-6c12-4d66-8f22-716a941399f7', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '0e734687-5eb8-472f-a138-ed35ce17556a', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('cf49f7cb-4382-4990-a234-3198bee71961', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '05a7bb9b-bf96-4ce9-b510-bf0d068acd5d', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('dc37f98b-af1d-45e9-b27e-f5852db2f6a9', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '0e734687-5eb8-472f-a138-ed35ce17556a', '"2025-11-18T08:30:26.406Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('dd7c30c4-4156-4a17-aa6b-98b58d5b5946', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '05a7bb9b-bf96-4ce9-b510-bf0d068acd5d', '"2025-11-18T08:30:26.407Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('e78d75fd-1e2e-4687-870f-94df468a9e30', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '51785958-3437-4938-b77d-ce7cf2d9782b', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('e922d98f-6a70-4471-a369-79f3664b20ae', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'eeeeeeee-ffff-0000-1111-222222222222', '"2025-12-10T06:08:37.830Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('eca203e7-6738-4cf5-aeb7-c334961335e9', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'cfa8dc2d-0554-4999-8f2b-98077bcebbc3', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('f0daff7c-8971-48ed-997e-17903e3dcfb0', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'feed1e74-6c95-47f6-9576-c2fc7f71ed65', '"2025-11-27T02:47:21.544Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('f4d493e9-9368-4a6a-9c91-4bfd1244b5b9', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'a12f7314-1f9e-44e1-bc7a-8b81aa41d870', '"2025-11-12T06:43:07.513Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('f8c89cf7-1791-495c-b0fb-61befb3192ec', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '0e734687-5eb8-472f-a138-ed35ce17556a', '"2025-11-27T02:47:21.543Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('fe18d62e-259d-4fcc-a045-1b4d1ef30321', 'b4f563f7-b8a8-4322-b9ac-4b6daae6271f',
        '6ae5d75e-3020-4f69-aaa9-df75474c0921', '"2025-11-18T08:30:26.407Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'ffffffff-ffff-ffff-ffff-111111111111', '"2025-12-10T06:08:37.830Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0002', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        'ffffffff-ffff-ffff-ffff-111111111111', '"2025-12-10T06:08:37.830Z"');
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('b1b2c3d4-0001-4000-8000-000000000001', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '6f13b0c0-3d3f-4aeb-aa75-79cfbb3f806e', '"2025-10-28T00:43:06.737Z"');


-- ============================================
-- Table: watermark_config
-- Records: 1
-- ============================================
ALTER SEQUENCE IF EXISTS owl_watermark_config_id_seq RESTART;
INSERT INTO public."owl_watermark_config" ("id", "enabled", "lines", "font_size", "font_weight", "color", "opacity",
                                           "rotation", "spacing", "masking_rules", "created_at", "updated_at",
                                           "created_by")
VALUES ('40713250-df1e-4173-aab6-e2a7f69c2a1d', true, '["{{user:email}}"]', 24, 400, '#000000', '0.10', 330, 300,
        '{"email":{"type":"mask_middle","showCount":2},"phone":{"type":"hide_last","hideCount":4},"username":{"type":"hide","hideCount":3}}',
        '2025-12-09T21:56:43.407Z', '2025-12-10T08:13:40.186Z', '99e2337b-8676-4414-b71e-d5aff2008616');


-- ============================================
-- Table: folders
-- Records: 0 - No initial data needed
-- ============================================
ALTER SEQUENCE IF EXISTS owl_folders_id_seq RESTART;
-- No initial folder data - folders will be created by users


-- ============================================
-- Table: files
-- Records: 0 - No initial data needed
-- ============================================
ALTER SEQUENCE IF EXISTS owl_files_id_seq RESTART;
-- No initial file data - files will be uploaded by users


-- file_permissions: Empty

-- ============================================
-- Table: file_shares
-- Records: 1
-- ============================================
ALTER SEQUENCE IF EXISTS owl_file_shares_id_seq RESTART;
INSERT INTO public."owl_file_shares" ("id", "file_id", "share_code", "expires_at", "created_by", "created_at")
VALUES ('41d39211-53dc-499a-92b9-cac699645afd', 'e3e6778e-d62a-4a03-80aa-397c4ddd368b', 'mMRI0iVC',
        '"2025-11-25T03:46:14.684Z"', '99e2337b-8676-4414-b71e-d5aff2008616', '"2025-11-24T03:46:14.684Z"');


-- ============================================
-- Table: notification_settings
-- Records: 8
-- ============================================
ALTER SEQUENCE IF EXISTS owl_notification_settings_id_seq RESTART;
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('37c7589a-62a5-4925-a42a-24e27ad00a4f', '0ed9aba6-de99-4816-9b53-620ad8a52471', true, true, true, true, true,
        '"2025-11-18T03:21:13.417Z"', '"2025-11-18T03:21:13.417Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('3f5d6c2a-f353-44b5-a1eb-b7caede857c5', '89093b76-8a32-426c-b5e5-5ca34ec136b9', true, true, true, true, true,
        '"2025-11-18T08:28:40.777Z"', '"2025-11-18T08:28:40.777Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('4eeb0372-287c-40c6-982b-1bd1a6570472', '4cd9ae95-83aa-4fc9-81ad-caff5591cd7d', true, true, true, true, true,
        '"2025-11-18T08:32:56.364Z"', '"2025-11-18T08:32:56.364Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('5923c97a-c25d-4de0-b5ca-393f8d206538', '30848293-41c8-4a89-bad6-27d7507a826b', true, true, true, true, true,
        '"2025-11-18T00:07:47.055Z"', '"2025-11-18T00:07:47.055Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('90f1bb2f-5aa5-40bf-8aa8-a004736f1073', '99e2337b-8676-4414-b71e-d5aff2008616', true, true, true, true, true,
        '"2025-10-28T01:09:55.011Z"', '"2025-10-28T01:09:55.011Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('c70d5245-3291-4f6d-9943-0d7fc1daa34b', '70f069af-41f6-42f3-809f-c2598d4dc0a2', true, true, true, true, true,
        '"2025-11-18T09:56:54.069Z"', '"2025-11-18T09:56:54.069Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('eedc16e1-73c6-4463-8ddf-68fbebc25523', '2a9216bf-231f-4db1-b8c8-ee82ea3b0889', true, true, true, true, true,
        '"2025-11-17T01:16:13.118Z"', '"2025-11-17T01:16:13.118Z"');
INSERT INTO public."owl_notification_settings" ("id", "user_id", "email_enabled", "push_enabled", "system_notification",
                                                "warning_notification", "error_notification", "created_at",
                                                "updated_at")
VALUES ('fec6260b-c284-44b6-94bf-2b2bfe72c41b', '61976ffe-b6bb-4be2-8ffa-a223315f4e36', true, true, true, true, true,
        '"2025-11-17T12:54:22.872Z"', '"2025-11-17T12:54:22.872Z"');


-- ============================================
-- Table: email_templates
-- Records: 0
-- ============================================
-- 不创建默认模板，由用户自定义创建


-- notifications: Empty

-- email_logs: Empty

-- ============================================
-- Table: api_keys
-- Records: 0
-- ============================================
-- 接口密钥由管理员按厂商或业务用途创建，不预置默认凭证。


-- ============================================
-- Table: api_interfaces
-- Records: 0
-- ============================================
-- SQL 接口由管理员按实际业务创建，不预置测试接口。


-- api_monitors: Empty

-- api_monitor_logs: Empty

-- api_call_logs: Empty

-- alert_rules: Empty

-- alert_history: Empty

-- monitor_metrics: Empty

-- test_products: Empty

-- generated_modules: Empty

-- ============================================
-- Table: generated_fields
-- Records: 81
-- ============================================
ALTER SEQUENCE IF EXISTS owl_generated_fields_id_seq RESTART;
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0035ee4b-da85-4214-9c31-7ae23161041a', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'module_id', 'uuid', '模块ID',
        true, 'exact', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-17T04:14:48.728Z"', '"2025-11-17T04:14:48.728Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0107087a-7891-4aed-8fda-1859bf5573c2', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'updated_at',
        'timestamp with time zone', '更新时间', false, 'range', 'datetime', false, 9, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-24T02:54:26.186Z"', '"2025-11-24T02:54:26.186Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('01a2442c-464c-4693-89bb-a3cdd457144e', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'request_headers', 'jsonb',
        'request_headers', true, 'exact', 'input', true, 6, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-18T09:56:06.202Z"', '"2025-11-18T09:56:06.202Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('026e266a-1e4d-415b-89aa-d309977100b6', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'error_message', 'text',
        '错误信息', true, 'like', 'input', true, 10, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-17T04:14:48.939Z"', '"2025-11-17T04:14:48.939Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('029626e7-284a-4b87-9cf1-04b98ccb5907', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'files_generated', 'json',
        '生成的文件列表', true, 'exact', 'input', true, 6, NULL, 'left', 'percentage', NULL, true, 'textarea', NULL,
        false, '"2025-11-17T04:14:48.840Z"', '"2025-11-17T04:14:48.840Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('05d469d0-d2c6-4e7d-a92a-8587b16820fe', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'name', 'character varying',
        '商品名称', true, 'like', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-24T02:54:26.027Z"', '"2025-11-24T02:54:26.027Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('082f3b05-569c-43a0-a6c1-3e5d2dfc34ae', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'created_at',
        'timestamp with time zone', '创建时间', false, 'range', 'datetime', false, 8, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-10-28T01:12:59.185Z"', '"2025-10-28T01:12:59.185Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0925bdf0-3a89-4707-a7d9-afb4b38c5b3f', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'category', 'character varying',
        '商品分类', true, 'like', 'input', true, 6, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-10-28T01:12:59.180Z"', '"2025-10-28T01:12:59.180Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0a65cb0d-9e6b-408c-904f-07a452a49376', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'operation_type',
        'character varying', '操作类型: create/update/delete', true, 'like', 'input', true, 11, NULL, 'left', NULL,
        NULL, true, 'input', NULL, false, '"2025-11-17T04:14:48.967Z"', '"2025-11-17T04:14:48.967Z"', 'default', true,
        0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0b4ec7d0-d3b6-43e5-b176-7c49d2c88c45', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'created_at',
        'timestamp with time zone', 'created_at', false, 'range', 'datetime', false, 22, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-20T09:20:25.881Z"', '"2025-11-20T09:20:25.881Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('0e2b1c9a-d596-4815-9527-5b15754b256a', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'updated_at',
        'timestamp with time zone', 'updated_at', false, 'range', 'datetime', false, 23, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-20T09:20:25.886Z"', '"2025-11-20T09:20:25.886Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('118ebc13-8d03-4528-9dfe-0d92a811a7f1', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'method', 'character varying',
        'method', true, 'like', 'input', true, 5, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.785Z"', '"2025-11-20T09:20:25.785Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('12f11ef9-c9b0-4f28-afd4-4456b62625c6', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'success', 'boolean',
        '是否成功', true, 'exact', 'select', true, 9, NULL, 'left', NULL, NULL, true, 'select', NULL, false,
        '"2025-11-17T04:14:48.915Z"', '"2025-11-17T04:14:48.915Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('19742e58-26ec-40e6-a48a-065a40bc62d4', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'path', 'character varying',
        'path', true, 'like', 'input', true, 4, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.779Z"', '"2025-11-20T09:20:25.779Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('1a593433-d921-479b-8161-604a3f2e53d1', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'stock', 'integer', '库存数量',
        true, 'range', 'number', true, 5, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-24T02:54:26.096Z"', '"2025-11-24T02:54:26.096Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('1aea3a34-f8e7-4af0-8d19-eea55ca261d8', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'response_transform', 'text',
        '响应转换代码', true, 'like', 'input', true, 27, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.906Z"', '"2025-11-20T09:20:25.906Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('23759148-d7b8-40d1-a27f-f2f4db09183c', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'request_method',
        'character varying', 'request_method', true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'input',
        NULL, false, '"2025-11-18T09:56:06.186Z"', '"2025-11-18T09:56:06.186Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('2ad908fc-5f6d-4a94-89ad-9db272335b1a', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'cache_enabled', 'boolean',
        'cache_enabled', true, 'exact', 'select', true, 12, NULL, 'left', NULL, NULL, true, 'select', NULL, false,
        '"2025-11-20T09:20:25.830Z"', '"2025-11-20T09:20:25.830Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('2d5bae66-9408-4e92-b79a-c2bdc2c816e5', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'rule_id', 'uuid', '告警规则ID',
        true, 'exact', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:19:58.115Z"', '"2025-11-20T09:19:58.115Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('2f1e5604-8e86-424e-9a0d-0e2f6b23c0d0', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'version', 'integer', 'version',
        true, 'range', 'number', true, 17, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.856Z"', '"2025-11-20T09:20:25.856Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('3483bab2-9029-4d27-ab66-3b43fe8aab44', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'avg_response_time',
        'double precision', 'avg_response_time', true, 'range', 'number', true, 20, NULL, 'left', NULL, NULL, true,
        'input', NULL, false, '"2025-11-20T09:20:25.871Z"', '"2025-11-20T09:20:25.871Z"', 'default', true, 0, NULL,
        NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('348c58bc-573c-4b8a-b2cd-5038c16862ad', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'sql_template', 'text',
        'SQL模板（旧字段，兼容保留）', true, 'like', 'input', true, 7, NULL, 'left', NULL, NULL, true, 'textarea', NULL,
        false, '"2025-11-20T09:20:25.795Z"', '"2025-11-20T09:20:25.795Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('37880c80-a540-48ed-84de-70dc43c01afe', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'query_config', 'jsonb',
        '查询配置（包含SQL、表、字段等）', true, 'exact', 'input', true, 25, NULL, 'left', NULL, NULL, true, 'textarea',
        NULL, false, '"2025-11-20T09:20:25.896Z"', '"2025-11-20T09:20:25.896Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('37e663ae-7b9b-4277-bae4-274775e69678', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'id', 'uuid', '历史记录ID，主键',
        false, 'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-11-17T04:14:48.705Z"', '"2025-11-17T04:14:48.705Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('45ce0a5b-01b4-4b26-8b4d-ec3d421f38b9', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'created_by', 'uuid',
        'created_by', false, 'exact', 'input', false, 21, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-11-20T09:20:25.876Z"', '"2025-11-20T09:20:25.876Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('4e72214e-f581-4046-be6a-fb798173c8d4', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'response_time', 'integer',
        'response_time', true, 'range', 'number', true, 10, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.224Z"', '"2025-11-18T09:56:06.224Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('4f65e4df-aba7-492e-81bb-21e68e0a90e0', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'cache_ttl', 'integer',
        'cache_ttl', true, 'range', 'number', true, 13, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.835Z"', '"2025-11-20T09:20:25.835Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('526df028-b94f-49c6-b455-f374e1d37445', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'status', 'character varying',
        '商品状态: active/inactive/discontinued', true, 'like', 'input', true, 7, NULL, 'left', NULL, NULL, true,
        'input', NULL, false, '"2025-10-28T01:12:59.182Z"', '"2025-10-28T01:12:59.182Z"', 'default', true, 0, NULL,
        NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('54a27b0e-ec07-45a8-9b2f-940bf5b14a3b', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'rate_limit', 'integer',
        '限流（次/分钟）', true, 'range', 'number', true, 28, NULL, 'left', 'percentage', NULL, true, 'input', NULL,
        false, '"2025-11-20T09:20:25.911Z"', '"2025-11-20T09:20:25.911Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('59c4d3f0-b21d-48a0-b5b7-6b3b6ca003ca', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'query_type',
        'character varying', '查询类型: raw | builder', true, 'like', 'input', true, 24, NULL, 'left', NULL, NULL, true,
        'input', NULL, false, '"2025-11-20T09:20:25.891Z"', '"2025-11-20T09:20:25.891Z"', 'default', true, 0, NULL,
        NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('5a929106-46f9-47b8-acfc-f262c06cc5ca', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'last_called_at',
        'timestamp without time zone', 'last_called_at', true, 'range', 'datetime', true, 19, NULL, 'left', 'datetime',
        NULL, true, 'datetime', NULL, false, '"2025-11-20T09:20:25.866Z"', '"2025-11-20T09:20:25.866Z"', 'default',
        true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('5b591040-d699-451d-a554-180c92f2ed57', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'datasource_id', 'uuid',
        'datasource_id', true, 'exact', 'input', true, 6, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.790Z"', '"2025-11-20T09:20:25.790Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('64ba1531-98c0-4735-992c-1524e1a881fe', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'response_size', 'integer',
        'response_size', true, 'range', 'number', true, 11, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.229Z"', '"2025-11-18T09:56:06.229Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('65187de9-0f38-4645-9894-b99ddc576373', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'user_id', 'uuid', 'user_id',
        true, 'exact', 'input', true, 8, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.213Z"', '"2025-11-18T09:56:06.213Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('68284c96-b1eb-4784-bc58-3c97516870b1', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'rate_limit_enabled', 'boolean',
        'rate_limit_enabled', true, 'exact', 'select', true, 14, NULL, 'left', 'percentage', NULL, true, 'select', NULL,
        false, '"2025-11-20T09:20:25.840Z"', '"2025-11-20T09:20:25.840Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('6a99f079-fe06-49ad-b26d-8efeefd09262', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'request_params', 'jsonb',
        'request_params', true, 'exact', 'input', true, 5, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-18T09:56:06.197Z"', '"2025-11-18T09:56:06.197Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('6c37dbe7-c0fd-453c-892e-f2fbeae8cd4b', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'name', 'character varying',
        'name', true, 'like', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.769Z"', '"2025-11-20T09:20:25.769Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('6e9a8b7e-84a4-4abf-9808-358a3f758e35', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'is_active', 'boolean',
        'is_active', true, 'exact', 'select', true, 16, NULL, 'left', NULL, NULL, true, 'select', NULL, false,
        '"2025-11-20T09:20:25.851Z"', '"2025-11-20T09:20:25.851Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('726614bc-733f-4cc6-91d1-81a7df37b623', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'auth_required', 'boolean',
        'auth_required', true, 'exact', 'select', true, 10, NULL, 'left', NULL, NULL, true, 'select', NULL, false,
        '"2025-11-20T09:20:25.819Z"', '"2025-11-20T09:20:25.819Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('7ce66d54-bcd9-4782-8e6f-5713c8a7edac', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'id', 'uuid', '告警历史ID，主键',
        false, 'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-11-20T09:19:58.109Z"', '"2025-11-20T09:19:58.109Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('7dc1c9f6-8d61-4ebb-9599-c4ac1f319dff', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'created_by', 'uuid', '操作人',
        false, 'exact', 'input', false, 7, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-11-17T04:14:48.866Z"', '"2025-11-17T04:14:48.866Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('91fdadef-e23b-4126-bd9c-7684528e78f2', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'id', 'uuid', 'id', false,
        'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false, '"2025-11-18T09:56:06.175Z"',
        '"2025-11-18T09:56:06.175Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('93394245-7305-416e-bf6a-537e36b9c211', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'id', 'uuid', '商品ID，主键',
        false, 'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-11-24T02:54:26.004Z"', '"2025-11-24T02:54:26.004Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('93ea04f3-9215-40eb-9baf-b8fbba6a9992', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'input_params', 'jsonb',
        'input_params', true, 'exact', 'input', true, 8, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.800Z"', '"2025-11-20T09:20:25.800Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('948e453e-08d4-41c8-8f3d-bc1dcf760a52', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'id', 'uuid', '商品ID，主键',
        false, 'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false,
        '"2025-10-28T01:12:59.168Z"', '"2025-10-28T01:12:59.168Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('94a38c06-6837-46a5-a4e5-01cb28c765e8', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'level', 'character varying',
        '告警级别：info, warning, error, critical', true, 'like', 'input', true, 4, NULL, 'left', NULL, NULL, true,
        'input', NULL, false, '"2025-11-20T09:19:58.126Z"', '"2025-11-20T09:19:58.126Z"', 'default', true, 0, NULL,
        NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('96bbc807-2a31-40ca-a4ec-83410ab24f52', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'request_path',
        'character varying', 'request_path', true, 'like', 'input', true, 4, NULL, 'left', NULL, NULL, true, 'input',
        NULL, false, '"2025-11-18T09:56:06.191Z"', '"2025-11-18T09:56:06.191Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('98998a27-f865-4e4b-b2f4-19ffc7772baf', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'description', 'text',
        'description', true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.774Z"', '"2025-11-20T09:20:25.774Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('9b577e2e-e400-4533-996f-92df0c0638b3', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'price', 'numeric', '商品价格',
        true, 'range', 'number', true, 4, NULL, 'left', 'currency', NULL, true, 'input', NULL, false,
        '"2025-10-28T01:12:59.176Z"', '"2025-10-28T01:12:59.176Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('9c86d307-c442-4f84-9ea8-3c25f03352f2', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'error_message', 'text',
        'error_message', true, 'like', 'input', true, 14, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-18T09:56:06.244Z"', '"2025-11-18T09:56:06.244Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('9cfba11d-1bf0-4b19-98c8-d6d7b65ab8fc', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'created_at',
        'timestamp with time zone', '创建时间', false, 'range', 'datetime', false, 8, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-24T02:54:26.164Z"', '"2025-11-24T02:54:26.164Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('9eff3904-ad75-4452-ba84-2c8a2648b192', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'price', 'numeric', '商品价格',
        true, 'range', 'number', true, 4, NULL, 'left', 'currency', NULL, true, 'input', NULL, false,
        '"2025-11-24T02:54:26.073Z"', '"2025-11-24T02:54:26.073Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('a39ee004-af00-43b1-96cd-ae981ac6dd1c', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'stack_trace', 'text',
        'stack_trace', true, 'like', 'input', true, 15, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-18T09:56:06.250Z"', '"2025-11-18T09:56:06.250Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('abe884d4-656d-47fa-b065-bd221f821ec7', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'name', 'character varying',
        '商品名称', true, 'like', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-10-28T01:12:59.171Z"', '"2025-10-28T01:12:59.171Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('ad2376b8-02f5-4f38-b7c7-0f551d8af01c', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'params_schema', 'jsonb',
        '参数schema定义', true, 'exact', 'input', true, 26, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.901Z"', '"2025-11-20T09:20:25.901Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('aec78919-a794-4f5c-bbd8-e857b4cba8ac', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'response_status', 'integer',
        'response_status', true, 'range', 'number', true, 9, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.218Z"', '"2025-11-18T09:56:06.218Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('b1a3b7a4-57cf-4dee-a532-fc430865af67', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'created_at',
        'timestamp with time zone', '创建时间', false, 'range', 'datetime', false, 6, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-20T09:19:58.136Z"', '"2025-11-20T09:19:58.136Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('b58bcfd1-203c-49fc-8a97-04301414cb8f', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'executed_sql', 'text',
        'executed_sql', true, 'like', 'input', true, 12, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-18T09:56:06.234Z"', '"2025-11-18T09:56:06.234Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('b79b1b8d-15d2-47a6-aacd-b0271ff68e00', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'request_ip',
        'character varying', 'request_ip', true, 'like', 'input', true, 7, NULL, 'left', NULL, NULL, true, 'input',
        NULL, false, '"2025-11-18T09:56:06.208Z"', '"2025-11-18T09:56:06.208Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('b8e4a9c6-12f1-464b-9d7f-6e4f6a24a86a', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'auth_config', 'jsonb',
        'auth_config', true, 'exact', 'input', true, 11, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.825Z"', '"2025-11-20T09:20:25.825Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('bb4329e0-7b01-40ee-b050-9204891814f3', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'status', 'character varying',
        '商品状态: active/inactive/discontinued', true, 'like', 'input', true, 7, NULL, 'left', NULL, NULL, true,
        'input', NULL, false, '"2025-11-24T02:54:26.141Z"', '"2025-11-24T02:54:26.141Z"', 'default', true, 0, NULL,
        NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('bd565587-13f0-466e-a773-06481a0fd2ff', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'sql_duration', 'integer',
        'sql_duration', true, 'range', 'number', true, 13, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.239Z"', '"2025-11-18T09:56:06.239Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('c3668948-d853-4916-a475-65d0825a5d03', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'category', 'character varying',
        '商品分类', true, 'like', 'input', true, 6, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-24T02:54:26.118Z"', '"2025-11-24T02:54:26.118Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('cf2e9510-2d8d-4f2c-9f4b-e9b130db2c64', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'status', 'character varying',
        '状态：pending, resolved', true, 'like', 'input', true, 5, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:19:58.131Z"', '"2025-11-20T09:19:58.131Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('d0acb8ba-9a53-4a76-b050-45cc62db4db0', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'resolved_at',
        'timestamp with time zone', '解决时间', true, 'range', 'datetime', true, 7, NULL, 'left', 'datetime', NULL,
        true, 'datetime', NULL, false, '"2025-11-20T09:19:58.141Z"', '"2025-11-20T09:19:58.141Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('d5524063-0045-4749-828f-e1b55870a120', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'api_id', 'uuid', 'api_id',
        true, 'exact', 'input', true, 2, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-18T09:56:06.181Z"', '"2025-11-18T09:56:06.181Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('d78bd47e-a0b1-4f8b-b245-773036c9ec8d', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'call_count', 'integer',
        'call_count', true, 'range', 'number', true, 18, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-11-20T09:20:25.861Z"', '"2025-11-20T09:20:25.861Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('d9a036be-fa9b-418c-89f3-c0ea70806fc9', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'generated_by', 'uuid',
        '操作人', true, 'exact', 'input', true, 12, NULL, 'left', 'percentage', NULL, true, 'input', NULL, false,
        '"2025-11-17T04:14:48.997Z"', '"2025-11-17T04:14:48.997Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('de052e5c-1624-4905-83ed-ea1fd88c292e', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'stock', 'integer', '库存数量',
        true, 'range', 'number', true, 5, NULL, 'left', NULL, NULL, true, 'input', NULL, false,
        '"2025-10-28T01:12:59.178Z"', '"2025-10-28T01:12:59.178Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('e192555c-ddad-4dd9-8874-9527e7435e96', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'description', 'text',
        '商品描述', true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-10-28T01:12:59.173Z"', '"2025-10-28T01:12:59.173Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('e2a7504d-ec56-48fa-98dc-877cfad74c64', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'output_format', 'jsonb',
        'output_format', true, 'exact', 'input', true, 9, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:20:25.814Z"', '"2025-11-20T09:20:25.814Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('e42e67ad-355c-424c-aed0-506fde01b0cd', 'a228f74b-ba6a-4d3b-a7ee-49a5c8ce18fb', 'description', 'text',
        '商品描述', true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-24T02:54:26.050Z"', '"2025-11-24T02:54:26.050Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('e5d84696-35fa-43f6-8829-3ee699860bef', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'created_at',
        'timestamp with time zone', '创建时间', false, 'range', 'datetime', false, 8, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-17T04:14:48.893Z"', '"2025-11-17T04:14:48.893Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('e9c72a4e-5e4a-4832-8a83-bc146ec2b229', '2e4d199b-6ac1-4dfe-8012-286b5f27b394', 'message', 'text', '告警信息',
        true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'textarea', NULL, false,
        '"2025-11-20T09:19:58.121Z"', '"2025-11-20T09:19:58.121Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('ebe499ce-3ed3-4f5f-955b-56b4629342cb', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'table_name',
        'character varying', '数据库表名', true, 'like', 'input', true, 3, NULL, 'left', NULL, NULL, true, 'input',
        NULL, false, '"2025-11-17T04:14:48.750Z"', '"2025-11-17T04:14:48.750Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('eccb5faa-200d-46a1-83c8-9fdef979e81f', 'fc0dc1a1-424b-4d83-ba0d-f2298f768554', 'created_at',
        'timestamp with time zone', 'created_at', false, 'range', 'datetime', false, 16, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-11-18T09:56:06.255Z"', '"2025-11-18T09:56:06.255Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('f058b877-0a10-4e89-92d9-640b52fadb81', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'rate_limit_config', 'jsonb',
        'rate_limit_config', true, 'exact', 'input', true, 15, NULL, 'left', 'percentage', NULL, true, 'textarea', NULL,
        false, '"2025-11-20T09:20:25.845Z"', '"2025-11-20T09:20:25.845Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('f44cd004-68b3-4609-a0e0-7035219436dc', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'module_name',
        'character varying', '模块名称', true, 'like', 'input', true, 4, NULL, 'left', NULL, NULL, true, 'input', NULL,
        false, '"2025-11-17T04:14:48.775Z"', '"2025-11-17T04:14:48.775Z"', 'default', true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('fb2330fc-0345-48bf-bb11-6e5ca13e7a80', 'b0ef67cc-4d78-4e6b-b69a-3d7a9c1dd67e', 'action', 'character varying',
        '操作类型: create/update/delete (已废弃，使用operation_type)', true, 'like', 'input', true, 5, NULL, 'left',
        NULL, NULL, true, 'input', NULL, false, '"2025-11-17T04:14:48.812Z"', '"2025-11-17T04:14:48.812Z"', 'default',
        true, 0, NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('fb672b31-05a9-4dd1-b2dc-484f9333d858', '16e2f366-efad-43fd-a58e-2c17eec27eab', 'updated_at',
        'timestamp with time zone', '更新时间', false, 'range', 'datetime', false, 9, NULL, 'left', 'datetime', NULL,
        false, 'datetime', NULL, false, '"2025-10-28T01:12:59.187Z"', '"2025-10-28T01:12:59.187Z"', 'default', true, 0,
        NULL, NULL);
INSERT INTO public."owl_generated_fields" ("id", "module_id", "field_name", "field_type", "field_comment",
                                           "is_searchable", "search_type", "search_component", "show_in_list",
                                           "list_sort", "list_width", "list_align", "format_type", "format_options",
                                           "show_in_form", "form_component", "form_rules", "is_readonly", "created_at",
                                           "updated_at", "field_group", "show_in_detail", "detail_sort", "detail_label",
                                           "detail_component")
VALUES ('fbd786b4-dc19-4678-b542-87d381350dc5', '9ec5dcc4-a066-403a-b642-86140e0f66a3', 'id', 'uuid', 'id', false,
        'exact', 'input', true, 1, NULL, 'left', NULL, NULL, false, 'input', NULL, false, '"2025-11-20T09:20:25.764Z"',
        '"2025-11-20T09:20:25.764Z"', 'default', true, 0, NULL, NULL);

-- ============================================
-- Table: generation_history
-- Records: 2
-- ============================================
ALTER SEQUENCE IF EXISTS owl_generation_history_id_seq RESTART;
INSERT INTO public."owl_generation_history" ("id", "module_id", "table_name", "module_name", "action",
                                             "files_generated", "created_by", "created_at", "success", "error_message",
                                             "operation_type", "generated_by")
VALUES ('47c1c979-b3bf-4394-b1a2-e577776184ff', NULL, 'test_products', 'TestProducts', NULL, NULL, NULL,
        '"2025-11-24T02:54:57.065Z"', true, NULL, 'create', '99e2337b-8676-4414-b71e-d5aff2008616');
INSERT INTO public."owl_generation_history" ("id", "module_id", "table_name", "module_name", "action",
                                             "files_generated", "created_by", "created_at", "success", "error_message",
                                             "operation_type", "generated_by")
VALUES ('4c5e59a2-d83f-48de-ba46-1ff6c88259cb', NULL, 'test_products', 'TestProducts', NULL, NULL, NULL,
        '"2025-10-28T01:13:03.526Z"', true, NULL, 'create', '99e2337b-8676-4414-b71e-d5aff2008616');

-- Now insert with correct codes
-- thirty-party-key insert - REMOVED: This menu does not exist in the general platform

-- Re-enable foreign key constraints
SET CONSTRAINTS ALL IMMEDIATE;

-- 概览 Widget 配置菜单
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('3e2aa45a-e1e3-4708-934c-f9f5d9681fd1', '0e734687-5eb8-472f-a138-ed35ce17556a', '概览配置',
        '/setting/dashboard-widgets', NULL, 'LayoutDashboard', 'menu', true, 91, 'active', 'config:read', 'system',
        now(), now())
;

-- 预置概览 Widget（11个固定卡片，用户只需修改 SQL）
INSERT INTO owl_dashboard_widgets (id, title, widget_type, chart_type, sql_query, x_key, data_key, unit, sort_order,
                                   enabled, created_at, updated_at)
VALUES
-- 5个数字指标
('3e2aa45a-e1e3-4708-934c-f9f5d9681fd0', '活跃用户数', 'metric', NULL,
 'SELECT COUNT(*) AS value FROM owl_users WHERE status = ''active''', NULL, 'value', '人', 1, true, now(), now()),
('70ee2fae-5775-4da8-857f-098eb433c5e9', '总用户数', 'metric', NULL, 'SELECT COUNT(*) AS value FROM owl_users', NULL,
 'value', '人', 2, true, now(), now()),
('0fc05875-e421-4339-b21b-4b68ab662b2f', '近7天登录', 'metric', NULL,
 'SELECT COUNT(*) AS value FROM owl_users WHERE last_login_at >= NOW() - INTERVAL ''7 days''', NULL, 'value', '人', 3,
 true, now(), now()),
('9c674a60-a280-4821-90bc-cb2c3c0c961c', '系统运行天数', 'metric', NULL,
 'SELECT EXTRACT(DAY FROM NOW() - MIN(created_at))::int AS value FROM owl_users', NULL, 'value', '天', 4, true, now(),
 now()),
('ba750e12-c397-46fa-9848-c754a7bc8574', '文件总数', 'metric', NULL, 'SELECT COUNT(*) AS value FROM owl_files', NULL,
 'value', '个', 5, true, now(), now()),
-- 6个图表
('9cb34bea-6e7e-416e-ab97-f18def1a14d5', '最近登录趋势', 'chart', 'area',
 'SELECT TO_CHAR(DATE_TRUNC(''day'', last_login_at), ''MM-DD'') AS date, COUNT(*) AS "登录数" FROM owl_users WHERE last_login_at >= NOW() - INTERVAL ''7 days'' GROUP BY DATE_TRUNC(''day'', last_login_at) ORDER BY DATE_TRUNC(''day'', last_login_at)',
 'date', '登录数', NULL, 6, true, now(), now()),
('c29abd96-4cd4-429b-959d-5fb0fc126022', '系统概览', 'chart', 'pie',
 'SELECT ''活跃用户'' AS name, COUNT(*) AS value FROM owl_users WHERE status = ''active'' UNION ALL SELECT ''角色'' AS name, COUNT(*) AS value FROM owl_roles UNION ALL SELECT ''权限'' AS name, COUNT(*) AS value FROM owl_permissions UNION ALL SELECT ''离线用户'' AS name, COUNT(*) AS value FROM owl_users WHERE status != ''active''',
 'name', 'value', NULL, 7, true, now(), now()),
('82b6db22-4165-431b-a6a0-44daa44dadbe', '存储概览', 'chart', 'bar',
 'SELECT CASE WHEN mime_type LIKE ''image/%'' OR mime_type LIKE ''video/%'' OR mime_type LIKE ''audio/%'' THEN ''媒体'' WHEN mime_type LIKE ''%pdf%'' OR mime_type LIKE ''%word%'' OR mime_type LIKE ''%text%'' THEN ''文档'' ELSE ''其他'' END AS name, ROUND(SUM(size) / 1073741824.0, 2) AS value FROM owl_files GROUP BY 1',
 'name', 'value', 'GB', 8, true, now(), now()),
('0071640c-9a40-4eec-8158-1852bcae2597', '部门用户分布', 'chart', 'bar',
 'SELECT d.name AS name, COUNT(u.id) AS value FROM owl_departments d LEFT JOIN owl_users u ON d.id = u.department_id WHERE d.id IS NOT NULL GROUP BY d.name ORDER BY value DESC LIMIT 6', 'name',
 'value', '人', 9, true, now(), now()),
('77a0bb2a-42f0-4694-998d-532419a1ffc8', '在线用户趋势', 'chart', 'area',
 'SELECT TO_CHAR(DATE_TRUNC(''hour'', last_login_at), ''HH24:MI'') AS time, COUNT(*) AS "在线用户" FROM owl_users WHERE last_login_at >= NOW() - INTERVAL ''12 hours'' GROUP BY DATE_TRUNC(''hour'', last_login_at) ORDER BY DATE_TRUNC(''hour'', last_login_at)',
 'time', '在线用户', NULL, 10, true, now(), now()),
('3b01103c-a257-4151-bc11-282cff6736e2', '访问趋势', 'chart', 'area',
 'SELECT TO_CHAR(DATE_TRUNC(''day'', last_login_at), ''MM-DD'') AS date, COUNT(*) AS visits FROM owl_users WHERE last_login_at >= NOW() - INTERVAL ''7 days'' GROUP BY DATE_TRUNC(''day'', last_login_at) ORDER BY DATE_TRUNC(''day'', last_login_at)',
 'date', 'visits', NULL, 11, true, now(), now())
;


-- ============================================
-- 敏感字段配置初始化数据
-- ============================================

INSERT INTO owl_sensitive_fields (table_name, field_name, mask_type, description, is_active)
VALUES
-- 用户表敏感字段
('owl_users', 'phone', 'phone', '用户手机号', true),
('owl_users', 'email', 'email', '用户邮箱', true),
('owl_users', 'id_card', 'id_card', '身份证号', true)
;


-- ============================================
-- 数据访问管理相关菜单
-- ============================================

-- 第三方 API 密钥菜单（放在系统工具下）
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '第三方密钥',
        '/setting/third-party-keys', 'ThirdPartyKeysPage', 'Key', 'menu', true, 87, 'active',
        'third-party-keys:read', 'system', now(), now());

-- 数据访问管理菜单（放在系统工具下）
INSERT INTO public."owl_menus" ("id", "parent_id", "name", "path", "component", "icon", "type", "visible", "sort",
                                "status", "permission_code", "menu_type", "created_at", "updated_at")
VALUES ('7f3e9a2b-4c1d-4e8f-9b5a-6d2c8e1f0a3b', '7150a49c-3b3e-4b22-827c-af4aab39d2d7', '数据访问管理',
        '/setting/sensitive-fields', 'SensitiveFieldsPage', 'ShieldCheck', 'menu', true, 88, 'active',
        'sensitive-field:read', 'system', now(), now());

-- ============================================
-- 数据访问管理相关权限
-- ============================================

-- 敏感字段管理权限
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', '查看敏感字段', 'sensitive-field:read', 'sensitive-field', 'read',
        '查看敏感字段配置列表和详情', '数据安全', now(), now()),
       ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', '创建敏感字段', 'sensitive-field:create', 'sensitive-field', 'create',
        '创建新的敏感字段配置', '数据安全', now(), now()),
       ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', '更新敏感字段', 'sensitive-field:update', 'sensitive-field', 'update',
        '更新敏感字段配置', '数据安全', now(), now()),
       ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', '删除敏感字段', 'sensitive-field:delete', 'sensitive-field', 'delete',
        '删除敏感字段配置', '数据安全', now(), now());

-- ============================================
-- 第三方 API 密钥权限
-- ============================================

INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', '查看第三方密钥', 'third-party-keys:read', 'third-party-keys', 'read',
        '查看第三方 API 密钥列表和详情', '系统配置', now(), now()),
       ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', '创建第三方密钥', 'third-party-keys:create', 'third-party-keys', 'create',
        '创建新的第三方 API 密钥', '系统配置', now(), now()),
       ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', '更新第三方密钥', 'third-party-keys:update', 'third-party-keys', 'update',
        '更新第三方 API 密钥和状态', '系统配置', now(), now()),
       ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', '删除第三方密钥', 'third-party-keys:delete', 'third-party-keys', 'delete',
        '删除第三方 API 密钥', '系统配置', now(), now());


-- ============================================
-- 超级管理员绑定数据访问管理权限
-- ============================================

INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', now()),
       ('c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', now()),
       ('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', now()),
       ('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', now()),
       ('261e48ef-cc40-4075-ac5e-4a6fac12a61e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'c5e37e50-a136-4dfd-9291-1cbd6195539e', now()),
       ('e8868351-e02b-4dea-8973-39a52ed0ebb5', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '9d1ca541-1649-4444-b8f7-8f77a818667e', now());

-- ============================================
-- 超级管理员绑定第三方密钥权限
-- ============================================

INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('c9d0e1f2-f3a4-4b5c-6d7e-8f9a0b1c2d3e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', now()),
       ('d0e1f2a3-a4b5-4c6d-7e8f-9a0b1c2d3e4f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', now()),
       ('e1f2a3b4-b5c6-4d7e-8f9a-0b1c2d3e4f5a', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', now()),
       ('f2a3b4c5-c6d7-4e8f-9a0b-1c2d3e4f5a6b', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', now());


-- 超级管理员绑定邮件任务权限
INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('f2a3b4c5-c6d7-4e8f-9a0b-1c2d3e4f5a6c', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'df4b8233-172e-46cc-7ac0-52f15051db51', now()),
       ('f2a3b4c5-c6d7-4e8f-9a0b-1c2d3e4f5a6d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'df4b8233-172e-46cc-7ac0-52f15051db52', now()),
       ('f2a3b4c5-c6d7-4e8f-9a0b-1c2d3e4f5a6e', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'df4b8233-172e-46cc-7ac0-52f15051db53', now()),
       ('f2a3b4c5-c6d7-4e8f-9a0b-1c2d3e4f5a6f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        'df4b8233-172e-46cc-7ac0-52f15051db54', now());

INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '7f3e9a2b-4c1d-4e8f-9b5a-6d2c8e1f0a3b', now());

-- 超级管理员绑定第三方密钥菜单
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('b2c3d4e5-f6a7-b8c9-d0e1-f2a3b4c5d6e7', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d', now());

-- 超级管理员绑定概览配置菜单
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '3e2aa45a-e1e3-4708-934c-f9f5d9681fd1', now());

-- 超级管理员绑定系统工具菜单
INSERT INTO public."owl_role_menus" ("id", "role_id", "menu_id", "created_at")
VALUES ('02042918-ec81-47c5-8a9f-cfb447595d4d', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '7150a49c-3b3e-4b22-827c-af4aab39d2d7', now());

INSERT INTO public."owl_system_configs" ("id", "logo_url", "login_bg_url", "company_name", "system_name", "show_tech_stack", "registration_enabled", "tech_stack_info", "enable_theme_switch", "theme_mode", "primary_color", "created_by", "created_at", "updated_at", "login_layout", "login_method", "registration_method")
VALUES (1, NULL, NULL, 'Owl Platform', 'Owl Platform', true, true, NULL, true, 'auto', 'default', NULL, now(), now(), 'left-image', 'both', 'both');

-- 内置管理员角色可读取邮件记录
INSERT INTO public."owl_permissions" ("id", "name", "code", "resource", "action", "description", "category",
                                      "created_at", "updated_at")
VALUES ('7c47d403-119f-4e36-916d-41c625839a45', '查看邮件记录', 'email:read', 'email', 'read',
        '查看邮件发送记录和详情', '邮件管理', now(), now());

INSERT INTO public."owl_role_permissions" ("id", "role_id", "permission_id", "created_at")
VALUES ('04f2e4c8-2b76-4082-9b6a-48f8e7f81c53', '5bbddbca-0ace-4641-8a5b-8882a648ca49',
        '7c47d403-119f-4e36-916d-41c625839a45', now()),
       ('667ece82-fd58-4c9f-b46d-d3a872717119', '6b81e3c2-ec0c-40f3-8e00-ec54f1b41345',
        '7c47d403-119f-4e36-916d-41c625839a45', now());

COMMIT;
