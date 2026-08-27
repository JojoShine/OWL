# 加密能力

提供多种加密算法的统一接口，包括对称加密、非对称加密、哈希和签名等功能。

## 支持的算法

### 对称加密
- **AES-256-CBC**: 高级加密标准，支持256位密钥
- **SM4**: 国密分组密码算法

### 非对称加密
- **RSA-2048**: 支持加密、解密、签名和验证
- **SM2**: 国密椭圆曲线公钥密码算法

### 哈希和签名
- **HMAC**: 支持多种哈希算法（SHA256等）
- **SM3**: 国密哈希算法

## 快速开始

### AES 加密

```javascript
const { createAES } = require('./crypto');

const aes = createAES('my-secret-key-32-chars-long!!!');

// 加密
const encrypted = aes.encrypt('Hello, World!');
console.log('密文:', encrypted);

// 解密
const decrypted = aes.decrypt(encrypted);
console.log('明文:', decrypted);
```

### RSA 加密和签名

```javascript
const { RSACrypto, createRSA } = require('./crypto');

// 生成密钥对
const { publicKey, privateKey } = RSACrypto.generateKeyPair();
const rsa = createRSA(publicKey, privateKey);

// 加密
const encrypted = rsa.encrypt('Secret Message');
const decrypted = rsa.decrypt(encrypted);

// 签名
const signature = rsa.sign('Important Data');
const isValid = rsa.verify('Important Data', signature);
```

### HMAC 签名

```javascript
const { createHMAC } = require('./crypto');

const hmac = createHMAC('my-secret-key');

// 生成签名
const signature = hmac.sign('Data to sign');

// 验证签名
const isValid = hmac.verify('Data to sign', signature);

// API 签名
const apiSig = hmac.generateAPISignature(
  'GET',
  '/api/users',
  { page: 1, limit: 10 },
  '1234567890'
);
```

### SM3 哈希

```javascript
const { sm3Hash, SM3Crypto } = require('./crypto');

// 计算哈希
const hash = sm3Hash('Data to hash');

// 验证哈希
const isValid = SM3Crypto.verify('Data to hash', hash);

// HMAC-SM3
const hmacValue = SM3Crypto.hmac('data', 'key');
```

### SM2 加密（需要 sm-crypto 库）

```javascript
const { SM2Crypto, createSM2 } = require('./crypto');

// 生成密钥对
const { publicKey, privateKey } = SM2Crypto.generateKeyPair();
const sm2 = createSM2(publicKey, privateKey);

// 加密和解密
const encrypted = sm2.encrypt('Secret');
const decrypted = sm2.decrypt(encrypted);

// 签名和验证
const signature = sm2.sign('Data');
const isValid = sm2.verify('Data', signature);
```

### SM4 加密（需要 sm-crypto 库）

```javascript
const { createSM4 } = require('./crypto');

const sm4 = createSM4('my-secret-key-16!');

// ECB 模式
const encrypted = sm4.encrypt('Secret');
const decrypted = sm4.decrypt(encrypted);

// CBC 模式
const iv = 'initialization-vector';
const encryptedCBC = sm4.encryptCBC('Secret', iv);
const decryptedCBC = sm4.decryptCBC(encryptedCBC, iv);
```

## API 参考

### AESCrypto

- `encrypt(plaintext)`: 加密数据，返回 base64 编码的密文
- `decrypt(ciphertext)`: 解密数据，返回明文

### RSACrypto

- `static generateKeyPair()`: 生成 RSA-2048 密钥对
- `encrypt(plaintext)`: 使用公钥加密
- `decrypt(ciphertext)`: 使用私钥解密
- `sign(data)`: 使用私钥签名
- `verify(data, signature)`: 使用公钥验证签名

### HMACCrypto

- `sign(data, algorithm)`: 生成 HMAC 签名（hex 编码）
- `signBase64(data, algorithm)`: 生成 HMAC 签名（base64 编码）
- `verify(data, signature, algorithm)`: 验证 HMAC 签名
- `verifyBase64(data, signature, algorithm)`: 验证 HMAC 签名（base64）
- `generateAPISignature(method, path, params, timestamp)`: 生成 API 签名
- `verifyAPISignature(method, path, params, timestamp, signature)`: 验证 API 签名

### SM3Crypto

- `static hash(data, encoding)`: 计算 SM3 哈希
- `static hmac(data, key, encoding)`: 计算 HMAC-SM3
- `static verify(data, hash)`: 验证哈希值

### SM2Crypto

- `static generateKeyPair()`: 生成 SM2 密钥对
- `encrypt(plaintext, cipherMode)`: 加密数据
- `decrypt(ciphertext, cipherMode)`: 解密数据
- `sign(data)`: 签名数据
- `verify(data, signature)`: 验证签名

### SM4Crypto

- `encrypt(plaintext)`: ECB 模式加密
- `decrypt(ciphertext)`: ECB 模式解密
- `encryptCBC(plaintext, iv)`: CBC 模式加密
- `decryptCBC(ciphertext, iv)`: CBC 模式解密

## 安全建议

1. **密钥管理**
   - 不要在代码中硬编码密钥
   - 使用环境变量或密钥管理服务存储密钥
   - 定期轮换密钥

2. **算法选择**
   - 优先使用 AES-256 进行对称加密
   - 使用 RSA-2048 或更强的密钥进行非对称加密
   - 使用 SHA256 或更强的哈希算法

3. **时序攻击防护**
   - HMAC 验证使用 `timingSafeEqual` 防止时序攻击
   - 避免使用简单的字符串比较验证签名

4. **国密算法**
   - SM2、SM3、SM4 需要安装 `sm-crypto` 库
   - 在中国等地区使用国密算法可能有法规要求

## 依赖

- Node.js 内置 `crypto` 模块
- 可选：`sm-crypto` 库（用于国密算法支持）

## 安装国密库

```bash
npm install sm-crypto
```

## 示例

查看 `examples.js` 文件了解更多使用示例。
