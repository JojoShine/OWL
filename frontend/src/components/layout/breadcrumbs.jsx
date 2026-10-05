import { Breadcrumb } from 'antd';
import { ChevronRight } from 'lucide-react';
import { Link, matchPath, useLocation } from 'react-router-dom';
import { useAppShellData } from '@/contexts/AppShellDataContext';
import './breadcrumbs.css';

const normalize = (path) => path?.split(/[?#]/)[0].replace(/\/$/, '') || '/';
const isLocalPath = (path) => path?.startsWith('/') && !path.startsWith('//');

function findTrail(menus, pathname, parents = []) {
  for (const menu of menus) {
    const trail = [...parents, { title: menu.name, path: isLocalPath(menu.path) ? normalize(menu.path) : undefined }];
    const child = findTrail(menu.children || [], pathname, trail);
    if (child) return child;
    if (isLocalPath(menu.path) && normalize(menu.path) === pathname) return trail;
  }
  return null;
}

// These pages are reached from their parent page rather than the sidebar.
const detailPages = [
  { pattern: '/setting/api-builder/edit/:id', parent: '/setting/api-builder', parentTitle: 'API 构建器', title: (params) => params.id === 'new' ? '新增接口' : '编辑接口' },
  { pattern: '/setting/api-builder/keys', parent: '/setting/api-builder', parentTitle: 'API 构建器', title: () => '接口密钥' },
  { pattern: '/monitor/alerts', parent: '/monitor', parentTitle: '监控概览', title: () => '告警管理' },
];

export function getBreadcrumbs(pathname, businessMenus = [], systemMenus = []) {
  const path = normalize(pathname);
  const groups = [{ title: '业务应用', menus: businessMenus }, { title: '系统管理', menus: systemMenus }];
  const lookup = (target) => {
    for (const group of groups) {
      const trail = findTrail(group.menus, target);
      if (trail) return [{ title: group.title }, ...trail];
    }
    return null;
  };
  const direct = lookup(path);
  if (direct) return direct;
  for (const page of detailPages) {
    const match = matchPath(page.pattern, path);
    if (match) return [...(lookup(page.parent) || [{ title: page.parentTitle }]), { title: page.title(match.params) }];
  }
  return [];
}

export default function PageBreadcrumbs() {
  const { pathname } = useLocation();
  const { businessMenus, systemMenus, menusLoading } = useAppShellData();
  const trail = getBreadcrumbs(pathname, businessMenus, systemMenus);
  if (menusLoading || !trail.length) return null;
  return <Breadcrumb aria-label="面包屑" className="owl-breadcrumbs min-w-0" style={{ marginBottom: 12 }} separator={<ChevronRight aria-hidden="true" size={12} />} items={trail.map((item, index) => ({
      key: `${index}-${item.path || item.title}`,
      title: index === trail.length - 1
        ? <span aria-current="page" className="break-words text-foreground">{item.title}</span>
        : item.path ? <Link to={item.path} className="break-words">{item.title}</Link> : <span className="break-words">{item.title}</span>,
    }))} />;
}
