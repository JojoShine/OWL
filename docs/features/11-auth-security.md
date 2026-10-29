# 认证安全配置与部署

OWL 的安全设置位于配置管理页面，支持密码强度、密码失败次数和锁定时间。密码登录使用一次性挑战及 SM2 加密；旧版明文登录请求会被拒绝，部署时需同步更新前后端。

## 默认规则

- 密码强度默认标准：至少 10 位，包含大写字母、小写字母、数字、其他非空白字符中的两类。
- 基础为至少 8 位；严格为至少 12 位且包含三类字符。
- 所有新设置的密码最多 50 个 Unicode 码点、72 个 UTF-8 字节。服务端校验创建、编辑、重置、修改及密码注册；已有密码不会因策略提升而失效。短信建号不要求密码。
- 15 分钟内密码失败 5 次，锁定 15 分钟。可选失败次数为 3/5/10 次，锁定时长为 5/15/30 分钟。
- 验证码和挑战错误不计入密码失败。锁定不会因重复尝试延长；到期后恢复，成功登录清除失败计数。

## 部署准备

1. 备份业务数据库，运行现有数据库部署命令应用 `20261029000000_auth_security` 迁移。新增列均有默认值，现有配置记录会自动获得默认安全规则。
2. 配置可用的 Redis 6.2 或更新版本。实例间共享 Redis；密码登录的计数和挑战不能回退内存。Redis 故障或超时会暂时拒绝密码登录。
3. 在后端目录、Node 22.12 或更新环境中安全生成 SM2 密钥：

   ```sh
   node -e "console.log(require('sm-crypto-v2').sm2.generateKeyPairHex().privateKey)"
   ```

   将输出通过部署平台的密钥管理功能注入 `LOGIN_SM2_PRIVATE_KEY`，并设置 `LOGIN_SM2_KEY_ID`（如 `login-v1`）。不要把私钥提交到仓库、截图或日志。所有后端实例使用相同密钥和编号；公钥由服务端从私钥派生。
4. 同步发布后端与前端。没有正确配置密钥时，密码登录不可用；不会自动生成临时密钥或回退明文。
5. 密钥轮换时同步更新所有实例的密钥与编号。旧挑战失效，用户重新提交登录即可。已有登录令牌不受 SM2 密钥轮换影响。

SM2 使用锁定的 `sm-crypto-v2@2.0.0`，已检查其普通浏览器与 Node 路径使用 `crypto.getRandomValues`，没有使用 Math.random 回退。API 与算法模式参考[库官方说明](https://github.com/Cubelrti/sm-crypto-v2)。依赖升级需重跑浏览器互通及篡改测试。

## 登录接口

`POST /api/system/auth/challenge` 返回 challengeId、nonce、publicKey、keyId、expiresAt，60 秒有效且禁止缓存。挑战编号和 nonce 均来自 32 字节安全随机数。

前端使用公钥加密 `{username,password,nonce,challengeId,purpose:'password-login'}`，登录提交 `{challengeId,keyId,ciphertext,captchaId,captchaCode}`。密文为十六进制 C1C3C2，C1 带 04 前缀。公钥为带 04 前缀的非压缩点。服务端先原子取删挑战，再解密并检查内容；失败也不会恢复挑战。

每次主动登录重新申请挑战，不自动重试或回退明文。用户名或密码错误统一提示，锁定提示包含剩余等待秒数。未知错误不直接展示；字段校验仅使用已知标签与约束生成提示。前后端的显式业务文案目录需保持一致，不允许按“是否中文”直接放行技术错误。

## HTTP 保护范围

普通 HTTP 页面可以使用 SM2 密码登录，浏览器缺少安全随机源时会明确失败。它降低被动抓包读取登录账号密码的风险，不能保护 HTTP 页面、公钥或登录令牌免于中间人篡改和窃取。

本次仅覆盖密码登录传输，注册、管理员设置密码和修改密码的请求没有使用该挑战协议。生产部署仍应使用 HTTPS。

## 验证

- 后端常规测试：`npm test -- --runInBand`。
- 专用 Redis 测试：设置 `OWL_AUTH_REDIS_TEST=1` 和 `OWL_AUTH_REDIS_URL`，运行 `npm test -- --runInBand test/nest/login-security.redis.test.js`。必须使用隔离测试 Redis。
- PostgreSQL 身份流程：配置专用测试数据库后，设置 `OWL_DATABASE_TEST=1` 运行 `test/nest/identity.database.test.js`。
- 前端：`npm run test:ui` 与 `npm run build`。
- 浏览器检查非 localhost 的普通 HTTP 页面：`window.isSecureContext` 为 false，填写验证码后登录成功，登录网络请求只含密文信封与验证码，不含明文用户名和密码。

2026-10-29 实施验证：前端 288 项测试通过并完成构建；后端完整测试 101 项通过，25 项因测试集配置跳过，其中本次相关 Redis 与数据库检查另外显式执行并通过（Redis 9 项、PostgreSQL 3 项）。Chrome 在非安全 HTTP 上完成真实验证码与加密登录，返回 200；测试宿主仅启用认证相关接口，不作为全站端到端覆盖。
