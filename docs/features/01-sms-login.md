# 短信登录

## 功能说明

支持手机号 + 验证码的登录和注册方式，开箱即用。

底层对接阿里云短信服务，支持两种模式，通过环境变量切换：

| 模式 | 环境变量值 | 说明 |
|------|-----------|------|
| 普通短信服务 (Dysmsapi) | `dysmsapi` | 验证码由系统生成，发送后在 Redis 中校验 |
| 短信认证服务 (OneVerify) | `oneverify` | 验证码由阿里云托管，通过 `CheckSmsVerifyCode` 接口校验，更安全 |

---

## 配置方式

源码开发在 `backend/.env`、Docker 部署在部署目录 `.env` 中填写以下参数：

```bash
# 阿里云通用
ALIYUN_ACCESS_KEY_ID=your_access_key_id
ALIYUN_ACCESS_KEY_SECRET=your_access_key_secret

# 短信服务
ALIYUN_SMS_SIGN_NAME=你的短信签名
ALIYUN_SMS_TEMPLATE_CODE=SMS_XXXXXXX

# 服务类型：oneverify（短信认证服务）或 dysmsapi（普通短信）
ALIYUN_SMS_SERVICE_TYPE=oneverify
```

---

## 接口说明

| 接口 | 说明 |
|------|------|
| `POST /api/auth/send-sms` | 发送验证码 |
| `POST /api/auth/sms-login` | 验证码登录（已注册用户） |
| `POST /api/auth/sms-register` | 验证码注册（新用户） |

---

## 安全机制

- 验证码有效期 5 分钟
- 同一手机号 60 秒内限发一次（Redis 限流）
- 使用 `oneverify` 模式时，验证码校验由阿里云服务完成，不在本地存储
- 使用 `dysmsapi` 模式时，验证码存储于 Redis，验证后立即删除，防止重放
