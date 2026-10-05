import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AppProviders from '@/AppProviders';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout';
import { Loading } from '@/components/ui/loading';

export function Screen({ Page }) {
  const { pathname } = useLocation();
  return <Suspense fallback={<Loading text="加载中..." />}><Page key={pathname} /></Suspense>;
}
function Root() { return <AppProviders><Outlet /></AppProviders>; }
function Shell() { return <AuthenticatedLayout><Outlet /></AuthenticatedLayout>; }

const DynamicModulePage = lazy(() => import('@/pages/dynamic-module/index.jsx'));
const BizExamplePage = lazy(() => import('@/pages/biz/example/index.jsx'));
const DashboardPage = lazy(() => import('@/pages/dashboard/index.jsx'));
const FilesPage = lazy(() => import('@/pages/files/index.jsx'));
const GeneratorPage = lazy(() => import('@/pages/generator/index.jsx'));
const LogsPage = lazy(() => import('@/pages/logs/index.jsx'));
const MonitorAlertsPage = lazy(() => import('@/pages/monitor/alerts/index.jsx'));
const MonitorApisPage = lazy(() => import('@/pages/monitor/apis/index.jsx'));
const MonitorPage = lazy(() => import('@/pages/monitor/index.jsx'));
const MonitorServersPage = lazy(() => import('@/pages/monitor/servers/index.jsx'));
const NotificationsPage = lazy(() => import('@/pages/notifications/index.jsx'));
const SettingApiBuilderEditDetailPage = lazy(() => import('@/pages/setting/api-builder/edit/detail/index.jsx'));
const SettingApiBuilderKeysPage = lazy(() => import('@/pages/setting/api-builder/keys/index.jsx'));
const SettingApiBuilderPage = lazy(() => import('@/pages/setting/api-builder/index.jsx'));
const SettingConfigManagementPage = lazy(() => import('@/pages/setting/config-management/index.jsx'));
const SettingDashboardWidgetsPage = lazy(() => import('@/pages/setting/dashboard-widgets/index.jsx'));
const SettingDepartmentsPage = lazy(() => import('@/pages/setting/departments/index.jsx'));
const SettingEmailTemplatesPage = lazy(() => import('@/pages/setting/email-templates/index.jsx'));
const SettingLogsPage = lazy(() => import('@/pages/setting/logs/index.jsx'));
const SettingMenusPage = lazy(() => import('@/pages/setting/menus/index.jsx'));
const SettingNotificationSettingsPage = lazy(() => import('@/pages/setting/notification-settings/index.jsx'));
const SettingPermissionsPage = lazy(() => import('@/pages/setting/permissions/index.jsx'));
const SettingRolesPage = lazy(() => import('@/pages/setting/roles/index.jsx'));
const SettingSensitiveFieldsPage = lazy(() => import('@/pages/setting/sensitive-fields/index.jsx'));
const SettingThirdPartyKeysPage = lazy(() => import('@/pages/setting/third-party-keys/index.jsx'));
const SettingUsersPage = lazy(() => import('@/pages/setting/users/index.jsx'));
const SettingWatermarkSettingsPage = lazy(() => import('@/pages/setting/watermark-settings/index.jsx'));
const LoginPage = lazy(() => import('@/pages/login/index.jsx'));
const HomePage = lazy(() => import('@/pages/index.jsx'));
const RegisterPage = lazy(() => import('@/pages/register/index.jsx'));
const ShareDetailPage = lazy(() => import('@/pages/share/detail/index.jsx'));
const NotFound = lazy(() => import('@/pages/not-found'));

export const routes = [{ Component: Root, children: [
  { path: '/login', element: <Screen Page={LoginPage} /> },
  { index: true, element: <Screen Page={HomePage} /> },
  { path: '/register', element: <Screen Page={RegisterPage} /> },
  { path: '/share/:shareCode', element: <Screen Page={ShareDetailPage} /> },
  { id: 'authenticated', Component: Shell, children: [
    { path: ':slug', element: <Screen Page={DynamicModulePage} /> },
    { path: 'biz/example', element: <Screen Page={BizExamplePage} /> },
    { path: 'dashboard', element: <Screen Page={DashboardPage} /> },
    { path: 'files', element: <Screen Page={FilesPage} /> },
    { path: 'generator', element: <Screen Page={GeneratorPage} /> },
    { path: 'logs', element: <Screen Page={LogsPage} /> },
    { path: 'monitor/alerts', element: <Screen Page={MonitorAlertsPage} /> },
    { path: 'monitor/apis', element: <Screen Page={MonitorApisPage} /> },
    { path: 'monitor', element: <Screen Page={MonitorPage} /> },
    { path: 'monitor/servers', element: <Screen Page={MonitorServersPage} /> },
    { path: 'notifications', element: <Screen Page={NotificationsPage} /> },
    { path: 'setting/api-builder/edit/:id', element: <Screen Page={SettingApiBuilderEditDetailPage} /> },
    { path: 'setting/api-builder/keys', element: <Screen Page={SettingApiBuilderKeysPage} /> },
    { path: 'setting/api-builder', element: <Screen Page={SettingApiBuilderPage} /> },
    { path: 'setting/config-management', element: <Screen Page={SettingConfigManagementPage} /> },
    { path: 'setting/dashboard-widgets', element: <Screen Page={SettingDashboardWidgetsPage} /> },
    { path: 'setting/departments', element: <Screen Page={SettingDepartmentsPage} /> },
    { path: 'setting/email-templates', element: <Screen Page={SettingEmailTemplatesPage} /> },
    { path: 'setting/logs', element: <Screen Page={SettingLogsPage} /> },
    { path: 'setting/menus', element: <Screen Page={SettingMenusPage} /> },
    { path: 'setting/notification-settings', element: <Screen Page={SettingNotificationSettingsPage} /> },
    { path: 'setting/permissions', element: <Screen Page={SettingPermissionsPage} /> },
    { path: 'setting/roles', element: <Screen Page={SettingRolesPage} /> },
    { path: 'setting/sensitive-fields', element: <Screen Page={SettingSensitiveFieldsPage} /> },
    { path: 'setting/third-party-keys', element: <Screen Page={SettingThirdPartyKeysPage} /> },
    { path: 'setting/users', element: <Screen Page={SettingUsersPage} /> },
    { path: 'setting/watermark-settings', element: <Screen Page={SettingWatermarkSettingsPage} /> },
  ] },
  { path: '*', element: <Screen Page={NotFound} /> },
] }];
