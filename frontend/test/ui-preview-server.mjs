import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const previewUsersResponse = {
  success: true,
  data: {
    items: [
      { id: 1, username: 'zhangsan', real_name: '张三', email: 'zha***@example.com', phone: '138****1001', status: 'active', last_login_at: '2026-08-25T01:32:00.000Z' },
      { id: 2, username: 'lisi', real_name: '李四', email: 'lis***@example.com', phone: '138****1002', status: 'active', last_login_at: '2026-08-25T00:15:00.000Z' },
      { id: 3, username: 'wangwu', real_name: '王五', email: 'wan***@example.com', phone: '138****1003', status: 'active', last_login_at: '2026-08-24T14:47:00.000Z' },
      { id: 4, username: 'zhaoliu', real_name: '赵六', email: 'zha***@example.com', phone: '138****1004', status: 'active', last_login_at: '2026-08-24T10:03:00.000Z' },
      { id: 5, username: 'sunqi', real_name: '孙七', email: 'sun***@example.com', phone: '138****1005', status: 'active', last_login_at: '2026-08-24T08:20:00.000Z' },
      { id: 6, username: 'zhouba', real_name: '周八', email: 'zho***@example.com', phone: '138****1006', status: 'active', last_login_at: '2026-08-24T06:11:00.000Z' },
      { id: 7, username: 'wujiu', real_name: '吴九', email: 'wuj***@example.com', phone: '138****1007', status: 'inactive', last_login_at: '2026-08-20T03:32:00.000Z' },
      { id: 8, username: 'zhengshi', real_name: '郑十', email: 'zhe***@example.com', phone: '138****1008', status: 'active', last_login_at: '2026-08-23T09:58:00.000Z' },
      { id: 9, username: 'chenshiyi', real_name: '陈十一', email: 'che***@example.com', phone: '138****1009', status: 'active', last_login_at: '2026-08-24T01:45:00.000Z' },
      { id: 10, username: 'huangshier', real_name: '黄十二', email: 'hua***@example.com', phone: '138****1010', status: 'active', last_login_at: '2026-08-21T02:21:00.000Z' },
    ],
    pagination: { page: 1, limit: 10, total: 128, totalPages: 13 },
  },
};

const previewMenusResponse = {
  success: true,
  data: {
    businessMenus: [{ id: 1, name: '工作台', path: '/dashboard', icon: 'LayoutDashboard', children: [] }],
    systemMenus: [
      { id: 2, name: '组织架构', path: '/setting/departments', icon: 'Network', children: [] },
      { id: 3, name: '角色管理', path: '/setting/roles', icon: 'ShieldCheck', children: [] },
      { id: 4, name: '用户管理', path: '/setting/users', icon: 'Users', children: [] },
      { id: 5, name: '系统设置', path: '/setting/system', icon: 'Settings', children: [] },
    ],
  },
};

const jsonRoutes = new Map([
  ['/api/system/users', previewUsersResponse],
  ['/api/system/menus/user-tree', previewMenusResponse],
  ['/api/system/system-config', { success: true, data: { system_name: 'Owl 管理平台', primary_color: 'default', enable_theme_switch: true } }],
  ['/api/system/notifications/unread-count', { success: true, data: { count: 8 } }],
  ['/api/system/watermark/rendered', { success: true, data: { enabled: false, lines: [] } }],
  ['/api/system/data-security/fields', { success: true, data: { items: [] } }],
  ['/api/system/departments/tree', { success: true, data: [] }],
  ['/api/system/roles', { success: true, data: { items: [] } }],
]);

const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.UI_PREVIEW_ORIGIN || 'http://localhost:4173',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS, POST, PUT, PATCH, DELETE',
  Vary: 'Origin',
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...corsHeaders,
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function getUsersResponse(searchParams) {
  const search = searchParams.get('search')?.trim().toLocaleLowerCase() || '';
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10);
  const matches = previewUsersResponse.data.items.filter((user) => {
    if (!search) return true;
    return [user.username, user.real_name, user.email, user.phone]
      .some((value) => value.toLocaleLowerCase().includes(search));
  });
  const total = search ? matches.length : previewUsersResponse.data.pagination.total;
  // The unfiltered route is the fixed page-one visual sample with a fixed total of 128.
  // Search results come only from that exact sample and therefore use coherent real slices.
  const start = search ? (page - 1) * limit : 0;
  const items = matches.slice(start, start + limit);

  return {
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    },
  };
}

export function createPreviewServer() {
  return http.createServer((request, response) => {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      sendJson(response, 409, { success: false, message: 'UI preview is read only' });
      return;
    }

    const requestUrl = new URL(request.url, 'http://127.0.0.1');

    if (request.method === 'GET' && requestUrl.pathname === '/api/system/users') {
      sendJson(response, 200, getUsersResponse(requestUrl.searchParams));
      return;
    }

    if (request.method === 'GET' && jsonRoutes.has(requestUrl.pathname)) {
      sendJson(response, 200, jsonRoutes.get(requestUrl.pathname));
      return;
    }

    sendJson(response, 404, { success: false, message: 'Not found' });
  });
}

const isDirectRun = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  const portFlagIndex = process.argv.indexOf('--port');
  const port = Number.parseInt(process.argv[portFlagIndex + 1] || '4180', 10);
  const server = createPreviewServer();

  server.listen(port, '127.0.0.1', () => {
    console.log(`Read-only UI preview server listening on http://127.0.0.1:${port}`);
  });
}
