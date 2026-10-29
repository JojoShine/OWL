import catalog from './business-message-catalog.json';
const messages = {
  AUTH_INVALID_CREDENTIALS: '用户名或密码错误',
  AUTH_CHALLENGE_INVALID: '登录验证已失效，请重新尝试',
  AUTH_UPGRADE_REQUIRED: '登录方式已升级，请刷新页面后重试',
  AUTH_UNAVAILABLE: '登录服务暂不可用，请稍后重试',
  PASSWORD_POLICY_VIOLATION: '密码不符合当前安全规则，请按提示重新设置',
  VALIDATION_ERROR: '输入信息不符合要求，请检查后重试',
  FORBIDDEN: '您没有权限执行此操作',
  NOT_FOUND: '请求的资源不存在',
};
const safeMessages = new Set([...catalog,
  '链接已过期', '姓名不能为空', '手机号格式错误', '分享链接已过期', '名称已存在', '请输入有效邮箱',
  '导出范围过大，请缩小范围', '该记录已被其他用户删除', '用户名或密码错误',
  '验证码错误或已过期', '原密码错误', '新密码不能与原密码相同', '两次输入的密码不一致',
  '用户名已存在', '邮箱已被注册', '手机号已被注册', '账户已被封禁', '账户已被禁用',
  '配置数据不合法', '上传文件不能为空', '没有找到上传的文件', '记录不存在', '用户不存在',
  '角色不存在', '部门不存在', '权限不存在', '菜单不存在', '文件不存在', '文件夹不存在',
]);
export function safeBusinessMessage(message) {
  if (Array.isArray(message)) {
    return message.length && message.every(item => safeMessages.has(item)) ? message.join('；') : '';
  }
  return safeMessages.has(message) ? message : '';
}
const fieldLabels = {username:'用户名',password:'密码',oldPassword:'原密码',newPassword:'新密码',confirmPassword:'确认密码',email:'邮箱',phone:'手机号',name:'名称',captchaCode:'验证码',captchaId:'验证码',page:'页码',limit:'每页条数',id:'记录',role_ids:'角色',department_id:'部门'};
const constraints = {'any.required':'不能为空','string.empty':'不能为空','string.email':'格式不正确','string.pattern.base':'格式不正确','string.guid':'格式不正确','string.min':'长度不足','string.max':'过长','string.base':'格式不正确','number.base':'必须为数字','number.min':'数值过小','number.max':'数值过大','number.integer':'必须为整数','any.only':'选项无效','any.invalid':'无效'};
export function getBusinessErrorMessage(code, params) {
  if (code === 'VALIDATION_ERROR') {
    const {field,constraint} = params || {};
    if (field === 'newPassword' && constraint === 'any.invalid') return '新密码不能与原密码相同';
    if (field === 'confirmPassword' && constraint === 'any.only') return '两次输入的密码不一致';
    if (Object.hasOwn(fieldLabels,field) && Object.hasOwn(constraints,constraint)) return fieldLabels[field]+constraints[constraint];
  }
  if (code === 'AUTH_LOCKED') {
    const seconds = params?.retryAfterSeconds;
    return Number.isInteger(seconds) && seconds > 0 && seconds <= 1800
      ? `尝试次数过多，请在 ${seconds} 秒后重试` : '尝试次数过多，请稍后重试';
  }
  return Object.hasOwn(messages, code) ? messages[code] : '';
}
