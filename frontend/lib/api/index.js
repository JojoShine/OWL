// API模块汇总导出 - 所有API统一从 system 文件夹导入

// 系统管理相关（统一从 system 文件夹导入）
import * as authModule from './system/auth.api';
import * as smsModule from './system/sms.api';
import * as userModule from './system/user.api';
import * as roleModule from './system/role.api';
import * as permissionModule from './system/permission.api';
import * as menuModule from './system/menu.api';
import * as departmentModule from './system/department.api';
import * as logModule from './system/log.api';
import * as jobModule from './system/job.api';
import * as dictionaryModule from './system/dictionary.api';
import * as apiBuilderModule from './system/api-builder.api';
import * as watermarkModule from './system/watermark.api';
import * as thirdPartyKeysModule from './system/third-party-keys.api';
import * as notificationModule from './system/notification.api';
import * as dashboardWidgetModule from './system/dashboard-widget.api';
import * as systemConfigModule from './system/system-config.api';
import * as captchaModule from './system/captcha.api';
import * as sensitiveFieldModule from './system/sensitive-field.api';
import * as dataAccessModule from './system/data-access.api';
import * as dashboardModule from './system/dashboard.api';
import * as monitorModule from './system/monitor.api';
import * as generatorModule from './system/generator.api';
import * as statsModule from './system/stats.api';
import * as fileManagerModule from './system/file-manager.api';
import * as emailTaskModule from './system/email-task.api';
import * as zabbixModule from './system/zabbix.api';

// 认证相关
export const authApi = authModule.authApi;
export const smsAuthApi = smsModule.smsAuthApi;

// 导出文件管理相关 API
export const { folderApi, fileApi, fileShareApi } = fileManagerModule;

// 导出监控相关 API
export const { monitorApi, apiMonitorApi, alertApi, serverMonitorApi } = monitorModule;

// 导出仪表盘相关 API
export const dashboardApi = dashboardModule.dashboardApi;

// 导出代码生成相关 API
export const generatorApi = generatorModule.generatorApi;

// 导出统计相关 API
export const statsApi = statsModule.statsApi;

// 导出系统管理相关 API
export const userApi = userModule.userApi;
export const roleApi = roleModule.roleApi;
export const permissionApi = permissionModule.permissionApi;
export const menuApi = menuModule.menuApi;
export const departmentApi = departmentModule.departmentApi;
export const logApi = logModule.logApi;
export const jobApi = jobModule.jobApi;
export const dictionaryApi = dictionaryModule.dictionaryApi;
export const apiBuilderApi = apiBuilderModule.apiBuilderApi;
export const watermarkApi = watermarkModule.watermarkApi;
export const thirdPartyKeysApi = thirdPartyKeysModule.thirdPartyKeysApi;
export const { notificationApi, emailApi, emailTemplateApi, notificationSettingsApi } = notificationModule;
export const dashboardWidgetApi = dashboardWidgetModule.dashboardWidgetApi;
export const systemConfigApi = systemConfigModule.systemConfigApi;
export const captchaApi = captchaModule.captchaApi;
export const sensitiveFieldApi = sensitiveFieldModule.sensitiveFieldApi;
export const dataAccessApi = dataAccessModule.dataAccessApi;
export const emailTaskApi = emailTaskModule.emailTaskApi;
export const zabbixApi = zabbixModule.zabbixApi;

// 默认导出（用于向后兼容）
export default {
  // 认证相关
  authApi,
  smsAuthApi,
  
  // 文件管理相关
  folderApi,
  fileApi,
  fileShareApi,
  
  // 监控相关
  monitorApi,
  apiMonitorApi,
  alertApi,
  serverMonitorApi,
  
  // 仪表盘相关
  dashboardApi,
  
  // 代码生成相关
  generatorApi,
  
  // 统计相关
  statsApi,
  
  // 系统管理相关
  userApi,
  roleApi,
  permissionApi,
  menuApi,
  departmentApi,
  logApi,
  jobApi,
  dictionaryApi,
  apiBuilderApi,
  watermarkApi,
  thirdPartyKeysApi,
  notificationApi,
  emailApi,
  emailTemplateApi,
  notificationSettingsApi,
  dashboardWidgetApi,
  systemConfigApi,
  captchaApi,
  sensitiveFieldApi,
  dataAccessApi,
  emailTaskApi,
  zabbixApi,
};
