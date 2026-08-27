# 查询缓存架构

## 概述

本系统实现了基于 Redis 的透明查询缓存，自动缓存 Sequelize 查询结果，无需修改业务代码。

## 工作原理

### 1. 缓存包装器

系统在应用启动时自动包装所有模型的查询方法：
- `findAll` - 查询多条记录
- `findOne` - 查询单条记录
- `findByPk` - 根据主键查询
- `findAndCountAll` - 查询并统计
- `count` - 统计数量

### 2. 缓存键生成

缓存键格式：`owl:cache:{模型名}:{查询参数哈希}`

例如：
- `owl:cache:User:a3f2d8c1` - User 模型的某次查询
- `owl:cache:SystemConfig:b7e4f9a2` - SystemConfig 模型的某次查询

### 3. 缓存 TTL 配置

不同模型有不同的缓存过期时间：

| 模型 | TTL（秒） | 说明 |
|------|-----------|------|
| User | 600 | 10 分钟 |
| Role | 600 | 10 分钟 |
| Permission | 600 | 10 分钟 |
| Menu | 600 | 10 分钟 |
| SystemConfig | 300 | 5 分钟 |
| WatermarkConfig | 300 | 5 分钟 |
| Dictionary | 300 | 5 分钟 |
| Department | 300 | 5 分钟 |
| 其他模型 | 180 | 3 分钟（默认） |

### 4. 自动失效策略

当数据发生变化时，缓存会自动清除：

- **afterCreate**：创建记录后清除该模型所有缓存
- **afterUpdate**：更新记录后清除该模型所有缓存
- **afterDestroy**：删除记录后清除该模型所有缓存

这确保了缓存数据的一致性。

## 控制台日志

缓存操作会输出到控制台，方便调试和监控：

```
[Cache HIT] User - User:a3f2d8c1          # 缓存命中
[Cache MISS] User - User:b7e4f9a2         # 缓存未命中
[Cache SET] User - User:b7e4f9a2 (TTL: 600s)  # 设置缓存
[Cache CLEAR] User - 15 keys              # 清除缓存
```

## 配置文件

### Redis 配置

在 `.env` 文件中配置 Redis 连接：

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### 修改 TTL 配置

编辑 `backend/src/config/cache.js` 中的 `MODEL_TTL_CONFIG`：

```javascript
const MODEL_TTL_CONFIG = {
  User: 600,           // 10 分钟
  SystemConfig: 300,   // 5 分钟
  DEFAULT: 180,        // 3 分钟（默认）
};
```

## 使用示例

业务代码无需任何修改，缓存自动生效：

```javascript
// 第一次查询 - 从数据库读取
const users = await User.findAll({ where: { status: 'active' } });
// 输出：[Cache MISS] User - User:a3f2d8c1
// 输出：[Cache SET] User - User:a3f2d8c1 (TTL: 600s)

// 第二次相同查询 - 从缓存读取
const users2 = await User.findAll({ where: { status: 'active' } });
// 输出：[Cache HIT] User - User:a3f2d8c1
```



// 创建新用户 - 自动清除 User 模型所有缓存
await User.create({ username: 'newuser', email: 'new@example.com' });
// 输出：[Cache CLEAR] User - 15 keys

// 再次查询 - 缓存已清除，从数据库读取
const users3 = await User.findAll({ where: { status: 'active' } });
// 输出：[Cache MISS] User - User:a3f2d8c1
```

## 性能收益

- **减少数据库负载**：相同查询直接从 Redis 返回，避免重复查询数据库
- **提升响应速度**：Redis 内存访问远快于数据库查询
- **自动失效**：数据变更时自动清除缓存，保证数据一致性

## 监控建议

1. 观察控制台日志，查看缓存命中率
2. 如果某个模型缓存命中率低，可以缩短 TTL 或取消缓存
3. 如果缓存命中率高但数据变更频繁，可能需要优化失效策略

## 注意事项

1. **关联查询**：包含 `include` 的查询也会被缓存，但缓存键包含完整查询参数
2. **大结果集**：非常大的查询结果会占用 Redis 内存，建议使用分页
3. **事务查询**：在事务中的查询仍会使用缓存，提交后才会触发清除钩子
4. **手动清除**：如需手动清除缓存，可调用 `clearModelCache(modelName)`
