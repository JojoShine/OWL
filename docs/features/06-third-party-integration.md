# 第三方签名对接

## 功能定位

第三方签名密钥用于后台系统整合、数据同步和开放业务接口，与 API Builder 的 SQL 接口密钥完全独立。

## 请求头

```text
X-API-Key: <public_key>
X-Timestamp: <unix_timestamp_ms>
X-Nonce: <random_nonce>
X-Signature: <hmac_sha256_hex>
```

## 签名原文

```text
HTTP_METHOD
CANONICAL_PATH_AND_QUERY
TIMESTAMP
NONCE
SHA256_BODY
```

查询参数按键和值排序并统一编码。服务端使用 API Secret 执行 HMAC-SHA256，并通过恒定时间比较签名。

## 安全规则

- 时间戳与服务器时间差不得超过 5 分钟。
- Nonce 每次请求必须唯一，并在 Redis 中保留 10 分钟防止重放。
- API Secret 使用独立密钥进行 AES-256-GCM 加密存储。
- Secret 仅在创建和重新生成时展示一次。
- 每条开放接口声明权限标识，凭证必须拥有对应 Scope。
- Redis 不可用时签名请求拒绝访问，避免防重放能力降级。

## 连通性验证

授权 `integration:ping` 后，可使用签名请求访问：

```text
GET /api/public/integration/ping
```

## 与接口密钥的区别

| 类型 | 第三方签名密钥 | SQL 接口密钥 |
|---|---|---|
| 场景 | 系统整合、数据同步、开放业务接口 | API Builder 生成的 SQL 接口 |
| 认证 | HMAC-SHA256 + 时间戳 + Nonce | `X-API-Key` |
| 授权 | Scope 权限标识 | 一个密钥关联多个 SQL 接口 |
| 存储 | Secret 可逆加密，用于验签 | Key 单向摘要，不可恢复 |

两类凭证不能换取后台用户 Token，也不能互相调用对方负责的接口。
