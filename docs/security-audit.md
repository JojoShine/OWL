# 安全审计报告

## 审计日期
2026-06-26（更新）

## 已修复的漏洞

### 1. 动态模块 SQL 注入漏洞 ✅ 已修复
**文件**: `backend/src/core/modules/generator/generic.service.js`

**风险等级**: 🔴 严重

**问题描述**:
- 表名、字段名直接拼接到 SQL 语句
- ORDER BY 参数未验证
- 可能导致 SQL 注入攻击

**修复措施**:
- 添加 `_escapeIdentifier()` 方法转义所有标识符
- 添加 `_validateSortField()` 白名单验证排序字段
- 添加 `_validateOrder()` 验证排序顺序
- 所有标识符使用双引号转义
- 用户输入值使用参数化查询

---

### 2. API Builder SQL 注入漏洞 ✅ 已修复
**文件**: `backend/src/core/modules/api-builder/api-builder-executor.service.js`

**风险等级**: 🔴 严重（已解决）

**问题描述**:
- `bindParameters` 方法使用字符串替换而非参数化查询
- `escapeSqlValue` 只转义单引号，无法防止所有注入
- 没有使用 Sequelize 的 `replacements` 参数

**修复措施**:
- ✅ 移除不安全的 `bindParameters()` 和 `escapeSqlValue()` 方法
- ✅ 添加 `prepareReplacements()` 方法安全处理参数
- ✅ 使用 Sequelize 的参数化查询（replacements）
- ✅ 完全杜绝字符串拼接 SQL

**修复后代码**:
```javascript
const replacements = this.prepareReplacements(params, interface_.parameters);
const queryResult = await db.sequelize.query(interface_.sql_query, {
  replacements,
  type: queryType,
});
```

---

### 4. XSS 漏洞 - 公共页面 URL 注入 ✅ 已修复
**文件**: `frontend/app/public/pages/[slug]/page.js`

**风险等级**: 🔴 严重（已解决）

**问题描述**:
- 图片 URL (`src` 属性) 未经验证直接使用
- 按钮链接 (`href` 属性) 未经验证直接使用
- 攻击者可注入 `javascript:`, `data:`, `vbscript:` 等危险协议

**攻击场景**:
```javascript
// 恶意组件示例
{
  type: 'button',
  props: {
    link: 'javascript:alert(document.cookie)'
  }
}
```

**修复措施**:
- ✅ 添加 `sanitizeUrl()` 函数验证链接 URL
- ✅ 添加 `sanitizeImageUrl()` 函数验证图片 URL
- ✅ 只允许 `http://`, `https://`, `mailto:`, `tel:` 和相对路径
- ✅ 阻止 `javascript:`, `data:`, `vbscript:`, `file:` 等危险协议
- ✅ 外部链接添加 `rel="noopener noreferrer"` 和 `target="_blank"`
- ✅ 无效 URL 使用安全默认值 (`#` 或空字符串)

---

### 5. XSS 漏洞 - 邮件内容 HTML 注入 ✅ 已修复
**文件**: `backend/src/core/modules/notification/email.service.js`

**风险等级**: 🟡 中等（已解决）

**问题描述**:
- 邮件标题和内容直接插入 HTML 模板未转义
- 用户输入可能包含 HTML/JavaScript 标签
- 在支持 JavaScript 的邮件客户端中可能执行恶意脚本

**攻击场景**:
```javascript
// 恶意告警内容
{
  title: '<script>alert("XSS")</script>',
  content: '<img src=x onerror=alert(1)>'
}
```

**修复措施**:
- ✅ 添加 `escapeHtml()` 函数转义 HTML 特殊字符
- ✅ 在 `wrapAlertContent()` 方法中转义 `title` 和 `content`
- ✅ 转义字符: `&`, `<`, `>`, `"`, `'`
- ✅ 添加 `white-space: pre-wrap` 保留换行符格式

---

## 低风险问题

### 6. 文件上传安全 ✅ 已修复
**文件**: `backend/src/middlewares/upload.js`

**风险等级**: 🟡 中等（已解决）

**当前保护措施**:
- ✅ MIME 类型白名单
- ✅ 文件大小限制（100MB）
- ✅ 文件数量限制（10个）
- ✅ 文件名编码修复
- ✅ 使用内存存储（上传到 Minio）
- ✅ 文件扩展名黑名单验证

**修复内容**:
- ✅ 移除了危险的 MIME 类型: `text/html`, `text/css`, `text/javascript`, `image/svg+xml`
- ✅ 添加了文件扩展名黑名单 `FORBIDDEN_EXTENSIONS`
- ✅ 黑名单包含: html, htm, js, jsx, ts, tsx, exe, bat, cmd, sh, bash, php, asp, aspx, jsp, svg
- ✅ 在文件过滤器中优先检查扩展名，再检查 MIME 类型
- ✅ 双重验证（扩展名 + MIME 类型）提供更强的安全保障

**防护效果**:
- 完全阻止可执行代码文件上传
- 防止恶意脚本注入（XSS）
- 防止服务器端脚本执行

---

## 低风险问题

### 7. 时区处理 ✅ 已优化
**文件**: 
- `backend/src/core/modules/generator/generic.service.js`
- `frontend/components/ui/date-time-picker.jsx`

**问题**: UTC 时间和本地时间混淆

**已修复**: 
- 后端 SQL 查询时使用 `AT TIME ZONE` 转换为本地时区
- 前端直接发送和显示本地时间

---

## 安全建议

### 认证与授权
- ✅ 使用 JWT 认证
- ✅ 密码加密（bcrypt）
- ✅ 权限检查中间件
- ✅ 请求频率限制（rate limiting）
  - 生产环境: 100 请求/15分钟
  - 开发环境: 1000 请求/60分钟
- ⚠️ 建议添加：登录失败锁定机制

### 数据验证
- ✅ 使用 Joi 进行输入验证
- ✅ Sequelize 参数化查询
- ✅ 标识符转义和白名单验证
- ✅ 文件上传类型限制
- ✅ URL 清理和协议验证（防止 XSS）
- ✅ HTML 转义（防止邮件 XSS）

### 日志与监控
- ✅ 日志记录（winston）
- ✅ API 调用日志
- ⚠️ 建议添加：安全事件告警
- ⚠️ 建议添加：异常流量检测

### 依赖安全
- ⚠️ 定期运行 `npm audit`
- ⚠️ 及时更新依赖包
- ⚠️ 使用 Snyk 或 Dependabot 监控漏洞

---

## 修复优先级

### 已完成 ✅
1. **动态模块 SQL 注入漏洞** - 已添加标识符转义和白名单验证
2. **API Builder SQL 注入漏洞** - 已改用参数化查询
3. **文件上传安全** - 已禁止危险文件类型上传
4. **请求频率限制** - 已确认存在并正常工作
5. **公共页面 URL 注入 (XSS)** - 已添加 URL 清理和协议验证
6. **邮件内容 HTML 注入 (XSS)** - 已添加 HTML 转义

### 建议改进 🟢
1. **中优先级**: 添加登录失败锁定机制
2. **低优先级**: 文件魔数验证（进一步增强文件类型检测）
3. **低优先级**: 依赖安全监控（npm audit / Snyk / Dependabot）

---

## 审计人员
Claude Sonnet 4.6
