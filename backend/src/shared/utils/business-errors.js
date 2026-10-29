const fieldLabels = {username:'用户名',password:'密码',oldPassword:'原密码',newPassword:'新密码',confirmPassword:'确认密码',email:'邮箱',phone:'手机号',name:'名称',captchaCode:'验证码',captchaId:'验证码',page:'页码',limit:'每页条数',id:'记录',role_ids:'角色',department_id:'部门'};
const constraints = {'any.required':'不能为空','string.empty':'不能为空','string.email':'格式不正确','string.pattern.base':'格式不正确','string.guid':'格式不正确','string.min':'长度不足','string.max':'过长','string.base':'格式不正确','number.base':'必须为数字','number.min':'数值过小','number.max':'数值过大','number.integer':'必须为整数','any.only':'选项无效','any.invalid':'无效'};
function validationMessage(field, constraint) {
  if (field === 'newPassword' && constraint === 'any.invalid') return '新密码不能与原密码相同';
  if (field === 'confirmPassword' && constraint === 'any.only') return '两次输入的密码不一致';
  return Object.hasOwn(fieldLabels, field) && Object.hasOwn(constraints, constraint) ? fieldLabels[field]+constraints[constraint] : '';
}
const messages = {
  AUTH_INVALID_CREDENTIALS: '用户名或密码错误',
  AUTH_CHALLENGE_INVALID: '登录验证已失效，请重新尝试',
  AUTH_UPGRADE_REQUIRED: '登录方式已升级，请刷新页面后重试',
  AUTH_UNAVAILABLE: '登录服务暂不可用，请稍后重试',
  AUTH_LOCKED: '尝试次数过多，请稍后重试',
  PASSWORD_POLICY_VIOLATION: '密码不符合当前安全规则，请按提示重新设置',
};
function publicError(error) {
  const status = error.statusCode || 500;
  const detail = typeof error.getResponse === 'function' ? error.getResponse() : error;
  const code = detail?.errorCode;
  if (status === 422 && Array.isArray(error.errors)) {
    const first = error.errors[0];
    const field = first?.path?.at?.(-1);
    const constraint = first?.type;
    const message = validationMessage(field, constraint);
    if (message) return {errorCode:'VALIDATION_ERROR',message,params:{field,constraint}};
  }
  if (Object.hasOwn(messages, code)) {
    const result = { errorCode: code, message: messages[code] };
    if (code === 'AUTH_LOCKED' && Number.isInteger(detail.params?.retryAfterSeconds)) result.params = { retryAfterSeconds: detail.params.retryAfterSeconds };
    return result;
  }
  if (status < 500 && require('./business-message-catalog.json').includes(error.message)) return { errorCode: 'BUSINESS_ERROR', message: error.message };
  const fallback = {
    400: ['BAD_REQUEST', '请求参数不正确，请检查后重试'], 401: ['UNAUTHORIZED', '登录已失效，请重新登录'],
    403: ['FORBIDDEN', '您没有权限执行此操作'], 404: ['NOT_FOUND', '请求的资源不存在'],
    409: ['CONFLICT', '数据已存在或已发生变化，请刷新后重试'], 422: ['VALIDATION_ERROR', '输入信息不符合要求，请检查后重试'],
    429: ['TOO_MANY_REQUESTS', '请求过于频繁，请稍后重试'],
  }[status] || ['INTERNAL_SERVER_ERROR', '服务器出错，请稍后重试'];
  return { errorCode: fallback[0], message: fallback[1] };
}
module.exports = { publicError };
