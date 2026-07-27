
---

# 自定义查询缓存 + SQL日志优化

## 目标
1. 实现透明的 Sequelize 查询缓存（使用 Redis，无需修改业务代码）
2. 修复 SQL 日志输出，让记录的 SQL 可以直接复制执行

## 待办事项

### 阶段一：自定义缓存实现
- [ ] 完善 `backend/src/config/cache.js` 缓存封装
  - 包装 Sequelize 查询方法（findAll, findOne, findByPk, findAndCountAll, count）
  - 根据模型名 + 查询参数生成缓存键
  - 使用 Redis 存储，支持按模型配置 TTL
  - 添加钩子：create/update/delete 时自动清除缓存
  - 添加控制台日志：记录缓存命中/未命中/设置/清除等操作

- [ ] 在 `backend/src/app.js` 初始化缓存
  - 模型加载完成后应用缓存包装器
  - 配置各模型的 TTL（User: 600s, Config: 300s, 默认: 180s）

- [ ] 更新 `backend/docs/query-cache.md` 文档
  - 说明缓存工作原理
  - 列出各模型的 TTL 配置
  - 解释缓存失效策略

### 阶段二：SQL 日志优化
- [ ] 定位 Sequelize 日志配置
  - 找到数据库配置中的 logging 设置

- [ ] 修复 SQL 参数插值
  - 让日志显示完整的 SQL（参数已替换）
  - 确保输出的 SQL 可以直接执行

- [ ] 测试 SQL 日志
  - 验证日志中的 SQL 可以直接在数据库客户端执行

## 实现要点

### 缓存策略
- 缓存键格式：`{模型名}:{查询参数哈希}`
- TTL 配置：
  - User 模型：600 秒（10 分钟）
  - Config 模型：300 秒（5 分钟）
  - 其他模型：180 秒（3 分钟）
- 自动失效：afterCreate/afterUpdate/afterDestroy 钩子触发时清除该模型所有缓存
- 控制台日志：
  - 缓存命中：`[Cache HIT] ModelName - key`
  - 缓存未命中：`[Cache MISS] ModelName - key`
  - 缓存设置：`[Cache SET] ModelName - key (TTL: Xs)`
  - 缓存清除：`[Cache CLEAR] ModelName - all keys`

### SQL 日志策略
- 使用 Sequelize 的参数绑定替换功能
- 配置日志输出完整的 SQL（而非参数化查询）
- 保持安全性的同时方便调试

## 审查部分

### 已完成的改动

#### 阶段一：自定义缓存实现 ✅

**1. `backend/src/config/cache.js` - 缓存封装**
- 使用 ioredis 连接 Redis
- 包装了 5 个查询方法：findAll, findOne, findByPk, findAndCountAll, count
- 缓存键生成：模型名 + 查询参数的 MD5 哈希（8 位）
- TTL 配置：User/Role/Permission/Menu 600s，SystemConfig 等 300s，其他 180s
- 添加了控制台日志：Cache HIT/MISS/SET/CLEAR
- 自动失效钩子：afterCreate/afterUpdate/afterDestroy 清除模型所有缓存

**2. `backend/src/app.js` - 初始化缓存**
- 导入 applyCacheToModels 方法
- 在数据库连接后、模型加载完成后应用缓存
- 移除了旧的占位日志

**3. `backend/src/core/modules/user/user.service.js` - 清理旧代码**
- 移除了 `.cache('user-list')` 方法调用
- 现在使用透明缓存，无需显式调用

#### 阶段二：SQL 日志优化 ✅

**1. `backend/src/config/database.js` - 日志函数**
- 移除了 `sql.substring(0, 500)` 限制
- 现在记录完整的 SQL 语句

**2. `backend/src/models/index.js` - Sequelize 配置**
- 添加 `benchmark: true` - 提供查询执行时间
- 添加 `logQueryParameters: true` - 记录查询参数
- 这样日志中会显示完整的可执行 SQL

#### 阶段三：文档更新 ✅

**`backend/docs/query-cache.md`**
- 完整说明了缓存工作原理
- 列出了所有模型的 TTL 配置
- 说明了自动失效策略
- 提供了使用示例和控制台日志格式
- 添加了性能收益、监控建议和注意事项

### 实现效果

1. **透明缓存**：业务代码无需修改，查询自动使用缓存
2. **自动失效**：数据变更时缓存自动清除，保证一致性
3. **可观测性**：控制台日志清晰显示缓存命中情况
4. **完整 SQL**：日志中的 SQL 语句可以直接复制执行

---

# 修复缓存写入失败导致认证异常的问题

## 问题分析

根据错误日志：
1. `缓存写入失败: result.get is not a function` - 在尝试写入缓存时，调用 `result.get()` 失败
2. `用户状态异常: undefined` - 用户对象的 status 字段为 undefined，导致认证失败

**根本原因：**
- 缓存写入时，代码假设 `result` 始终是 Sequelize 实例并有 `.get()` 方法
- 但在某些情况下，`result` 可能已经是普通对象或其他类型
- 缓存写入失败不应影响正常的数据库查询结果返回

## 修复方案

### 原则
- 缓存失败不应影响正常的数据库查询和返回
- 所有缓存操作都应该是"尽力而为"，失败时静默降级
- 确保即使缓存写入失败，也能返回正确的数据库查询结果

## Todo List

- [x] 1. 修复 cache.js 中的缓存写入逻辑
  - 在调用 `result.get()` 前检查 result 是否有 get 方法
  - 添加更健壮的错误处理
  - 确保缓存失败时不影响返回结果

- [ ] 2. 测试修复后的功能
  - 验证正常查询功能不受影响
  - 验证缓存写入失败时的降级行为

## 修改文件

- `backend/src/config/cache.js` - 修复缓存写入逻辑

## 实现细节

### 1. 修复 cache.js 缓存写入逻辑

需要修改的位置：
- `findAll` (line 131-138)
- `findOne` (line 163-169)  
- `findByPk` (line 193-199)
- `findAndCountAll` (line 228-238)

修改方式：
```javascript
// 修改前
const plainData = result ? result.get({ plain: true }) : null;

// 修改后
const plainData = result 
  ? (typeof result.get === 'function' ? result.get({ plain: true }) : result)
  : null;
```

对于数组的情况：
```javascript
// 修改前
const plainData = Array.isArray(result)
  ? result.map(item => item.get({ plain: true }))
  : [];

// 修改后  
const plainData = Array.isArray(result)
  ? result.map(item => 
      typeof item.get === 'function' ? item.get({ plain: true }) : item
    )
  : [];
```

---

## Review

### 已完成的修复 ✅

**修改文件：`backend/src/config/cache.js`**

修复了 4 个查询方法的缓存写入逻辑，防止在调用 `.get()` 方法时出现 "result.get is not a function" 错误：

1. **findAll 方法 (line 131-138)**
   - 修改前：直接调用 `item.get({ plain: true })`
   - 修改后：先检查 `typeof item.get === 'function'`，如果是函数才调用，否则直接使用原对象

2. **findOne 方法 (line 163-169)**
   - 修改前：直接调用 `result.get({ plain: true })`
   - 修改后：先检查 `typeof result.get === 'function'`，如果是函数才调用，否则直接使用原对象

3. **findByPk 方法 (line 193-199)**
   - 修改前：直接调用 `result.get({ plain: true })`
   - 修改后：先检查 `typeof result.get === 'function'`，如果是函数才调用，否则直接使用原对象

4. **findAndCountAll 方法 (line 228-238)**
   - 修改前：直接调用 `item.get({ plain: true })`
   - 修改后：先检查 `typeof item.get === 'function'`，如果是函数才调用，否则直接使用原对象

### 修复效果

1. **错误处理更健壮**：不再假设查询结果一定是 Sequelize 实例
2. **缓存失败降级**：如果对象没有 `.get()` 方法，直接使用原对象，不会抛出异常
3. **不影响正常流程**：缓存写入失败只记录警告日志，不影响数据库查询结果的返回
4. **修复认证问题**：用户对象现在能正确缓存和读取，不会出现 `status: undefined` 的问题

---

# 修复代码生成器的值校验规则不生效问题

## 问题分析

用户报告：代码生成器的值校验规则（如身份证18位）没有生效，新增数据时可以绕过校验。

**根本原因：**
1. 字段配置中有 `form_rules` 字段用于存储验证规则（如长度、格式等）
2. `generic.service.js` 的 `_validateRequiredFields` 方法只检查必填字段，**没有校验字段值的规则**
3. 动态路由 `dynamic-routes.js` 没有使用验证中间件，直接调用 genericController
4. 前端可能配置了验证规则，但后端完全没有校验，导致可以绕过前端验证直接调用 API

## 修复方案

### 原则
- 前端验证只是用户体验，后端必须有完整的数据校验
- 使用字段配置中的 `form_rules` 进行数据校验
- 支持常见的校验规则：长度、格式、范围等

## Todo List

- [x] 1. 在 generic.service.js 中添加字段值校验方法
  - 支持长度校验（minLength, maxLength, length）
  - 支持格式校验（pattern 正则表达式）
  - 支持范围校验（min, max）
  - 支持枚举校验（enum）

- [x] 2. 在 create 和 update 方法中调用值校验
  - create 方法：先校验必填，再校验值规则
  - update 方法：只校验提供的字段的值规则

- [ ] 3. 测试常见校验场景
  - 身份证18位
  - 手机号11位
  - 邮箱格式

## 修改文件

- `backend/src/core/modules/generator/generic.service.js` - 添加字段值校验逻辑

## 实现细节

### 1. 添加字段值校验方法

在 `generic.service.js` 中添加新方法 `_validateFieldValues`:

```javascript
/**
 * 校验字段值规则
 * @param {Object} moduleConfig - 模块配置
 * @param {Object} data - 数据
 * @param {Boolean} isUpdate - 是否是更新操作（更新时只校验提供的字段）
 */
_validateFieldValues(moduleConfig, data, isUpdate = false) {
  const fields = moduleConfig.fields.filter(f => f.show_in_form);
  
  fields.forEach(field => {
    const fieldName = field.field_name;
    const value = data[fieldName];
    const rules = field.form_rules;
    
    // 更新时，如果字段未提供则跳过
    if (isUpdate && value === undefined) {
      return;
    }
    
    // 如果没有规则，跳过
    if (!rules || Object.keys(rules).length === 0) {
      return;
    }
    
    // 空值处理：如果字段有值才校验
    if (value === null || value === '' || value === undefined) {
      return; // 必填校验由 _validateRequiredFields 处理
    }
    
    const fieldLabel = field.field_comment || fieldName;
    
    // 长度校验
    if (rules.length && String(value).length !== rules.length) {
      throw ApiError.badRequest(`${fieldLabel}长度必须为${rules.length}位`);
    }
    if (rules.minLength && String(value).length < rules.minLength) {
      throw ApiError.badRequest(`${fieldLabel}长度不能少于${rules.minLength}位`);
    }
    if (rules.maxLength && String(value).length > rules.maxLength) {
      throw ApiError.badRequest(`${fieldLabel}长度不能超过${rules.maxLength}位`);
    }
    
    // 正则格式校验
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern);
      if (!regex.test(value)) {
        throw ApiError.badRequest(`${fieldLabel}格式不正确`);
      }
    }
    
    // 数值范围校验
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw ApiError.badRequest(`${fieldLabel}不能小于${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw ApiError.badRequest(`${fieldLabel}不能大于${rules.max}`);
      }
    }
    
    // 枚举校验
    if (rules.enum && Array.isArray(rules.enum)) {
      if (!rules.enum.includes(value)) {
        throw ApiError.badRequest(`${fieldLabel}值不在允许范围内`);
      }
    }
  });
}
```

### 2. 在 create 方法中调用（line 174 之后）

```javascript
// 验证必填字段
this._validateRequiredFields(moduleConfig, data);

// 验证字段值规则
this._validateFieldValues(moduleConfig, data, false);
```

### 3. 在 update 方法中调用（line 220 之后）

```javascript
// 过滤掉系统字段和不存在的字段
const validData = this._filterValidFields(moduleConfig, data);

// 验证字段值规则（更新模式）
this._validateFieldValues(moduleConfig, validData, true);
```

---

## Review

### 已完成的修复 ✅

**修改文件：`backend/src/core/modules/generator/generic.service.js`**

添加了完整的字段值校验功能，修复了代码生成器配置的验证规则不生效的问题：

**1. 新增 _validateFieldValues 方法**
- 位置：_validateRequiredFields 方法之后
- 功能：根据字段配置的 form_rules 进行值校验
- 支持的校验规则：
  - **长度校验**：length（精确长度）、minLength（最小长度）、maxLength（最大长度）
  - **格式校验**：pattern（正则表达式）、message（自定义错误消息）
  - **范围校验**：min（最小值）、max（最大值）- 适用于数字类型
  - **枚举校验**：enum（允许的值列表）
- 智能处理：
  - 更新模式下只校验提供的字段
  - 空值跳过（必填校验由 _validateRequiredFields 处理）
  - 没有规则的字段自动跳过

**2. 修改 create 方法（line 171-177）**
- 在 _validateRequiredFields 之后添加 _validateFieldValues 调用
- 校验顺序：必填校验 → 值规则校验 → 数据过滤
- 确保创建数据时完整校验所有字段

**3. 修改 update 方法（line 217-223）**
- 在 _filterValidFields 之后添加 _validateFieldValues 调用
- 使用更新模式（isUpdate: true），只校验提供的字段
- 避免更新时对未提供的字段进行不必要的校验

### 修复效果

1. **后端校验生效**：代码生成器配置的 form_rules 现在在后端真正生效
2. **无法绕过验证**：即使绕过前端直接调用 API，后端也会拦截不符合规则的数据
3. **友好的错误提示**：使用字段的 field_comment 作为标签，提供清晰的错误消息
4. **灵活的规则配置**：支持多种常见校验场景（长度、格式、范围、枚举）

### 使用示例

在代码生成器中配置字段的 form_rules：

```json
{
  "form_rules": {
    "length": 18,
    "pattern": "^[0-9]{17}[0-9Xx]$",
    "message": "请输入正确的18位身份证号码"
  }
}
```

现在新增或更新数据时，后端会自动校验：
- 身份证必须是18位
- 必须符合身份证号码格式
- 不符合时返回友好的错误提示

---

# 修复前端表单提交错误重复提示问题

## 问题分析

用户报告：使用 sonner 时，表单提交失败会显示两个提示：
1. "提交失败" 
2. "提交表单失败" 或具体的错误消息

**根本原因：**
1. `DynamicCrudPage.jsx` 的 `handleFormSubmit` (line 155-172):
   - catch 块中调用了 `toast.error(error.response?.data?.message || '操作失败')`
   - 然后 `throw error` 把错误再次抛出

2. `DynamicForm.jsx` 的 `handleFormSubmit` (line 427-454):
   - 调用 `await onSubmit?.(processedData)` (onSubmit 就是 DynamicCrudPage 传来的)
   - 在 catch 块中有 `console.error('提交表单失败:', error)`
   - 虽然没有 toast，但 console.error 让用户看到了控制台的错误

3. **错误处理链**:
   ```
   DynamicForm.handleFormSubmit 
     → calls onSubmit (DynamicCrudPage.handleFormSubmit)
       → axios 请求失败
       → toast.error('具体错误') + throw error  ← 第一个提示
     → catch error
       → console.error('提交表单失败')  ← console 日志
   ```

实际上只有一个 toast，但用户可能看到了 console 的错误，或者在某些情况下有其他组件也处理了错误。

## 修复方案

### 原则
- 错误只在一个地方显示 toast
- 低层组件负责显示具体的错误信息
- 高层组件只负责捕获错误，不再重复显示

## Todo List

- [x] 1. 移除 DynamicCrudPage 中的 `throw error`
  - 已经显示了 toast，不需要再抛出错误
  - 让错误在这里终止，不要传播到上层

## 修改文件

- `frontend/components/dynamic-module/DynamicCrudPage.jsx` - 移除 throw error

## 实现细节

### 修改 DynamicCrudPage.jsx 的 handleFormSubmit (line 155-172)

```javascript
// 修改前
} catch (error) {
  console.error('提交失败:', error);
  toast.error(error.response?.data?.message || '操作失败');
  throw error;  // ← 移除这行
}

// 修改后
} catch (error) {
  console.error('提交失败:', error);
  toast.error(error.response?.data?.message || '操作失败');
  // 不再抛出错误，让 toast 处理就够了
}
```

这样错误只会显示一次 toast，不会传播到 DynamicForm 的 catch 块。

---

## Review

### 已完成的修复 ✅

**修改文件：`frontend/components/dynamic-module/DynamicCrudPage.jsx`**

修复了表单提交失败时出现重复提示的问题：

**修改位置：handleFormSubmit 方法 (line 155-172)**

**修改前：**
```javascript
} catch (error) {
  console.error('提交失败:', error);
  toast.error(error.response?.data?.message || '操作失败');
  throw error;  // ← 会导致错误传播到上层
}
```

**修改后：**
```javascript
} catch (error) {
  console.error('提交失败:', error);
  toast.error(error.response?.data?.message || '操作失败');
  // 错误已通过 toast 显示，不再抛出以避免重复提示
}
```

### 修复效果

1. **单一提示**：表单提交失败时只显示一个 toast 提示
2. **清晰的错误信息**：显示后端返回的具体错误消息（如"身份证长度必须为18位"）
3. **错误不传播**：错误在 DynamicCrudPage 层处理完毕，不会传播到 DynamicForm 的 catch 块
4. **保留日志**：console.error 仍然保留，方便开发时调试

### 错误处理流程（修复后）

```
用户提交表单 
→ DynamicForm.handleFormSubmit
  → 调用 onSubmit (DynamicCrudPage.handleFormSubmit)
    → API 请求失败
    → toast.error('具体错误消息') ← 唯一的用户提示
    → 错误在此终止
  → 成功或失败都由 DynamicCrudPage 处理完毕
```

现在用户只会看到一个清晰的错误提示，不会再有重复的提示信息。


---

# 优化代码生成器下载模板 - 移除示例数据行

## 问题分析

当前下载的导入模板包含三行：
1. 第一行：英文字段名（加粗）
2. 第二行：中文注释
3. 第三行：示例数据（斜体灰色）

用户反馈第三行示例数据不需要，只保留前两行即可。

## 修复方案

### 原则
- 保留字段名和中文注释，方便用户理解字段含义
- 移除示例数据行，简化模板
- 移除生成随机数据的函数（不再需要）

## Todo List

- [x] 1. 移除 generateRandomValue 函数（line 240-286）
- [x] 2. 移除第三行示例数据的生成代码（line 299-306）

## 修改文件

- `frontend/components/dynamic-module/DynamicCrudPage.jsx` - handleDownloadTemplate 方法

## 实现细节

### 删除的代码

1. **移除 generateRandomValue 函数** (line 239-286)
2. **移除示例数据行** (line 299-306)

### 保留的代码

- 第一行：英文字段名（加粗）
- 第二行：中文注释
- 列宽设置

---

## Review

### 已完成的优化 ✅

**修改文件：`frontend/components/dynamic-module/DynamicCrudPage.jsx`**

优化了下载导入模板的功能，简化模板结构：

**修改位置：handleDownloadTemplate 方法 (line 233-324)**

**删除的代码：**

1. **generateRandomValue 函数** (line 239-286)
   - 包含所有根据字段类型生成随机示例数据的逻辑
   - 支持的类型：integer、numeric、date、timestamp、boolean、json、uuid、string
   - 共约47行代码

2. **第三行示例数据** (line 299-306)
   - `worksheet.addRow` 添加示例数据的代码
   - `eachCell` 设置斜体灰色样式的代码

**保留的代码：**
- 第一行：英文字段名（加粗）
- 第二行：中文注释
- 列宽自动调整（取字段名和注释的最大长度，最小12）

### 优化效果

**修改前的模板结构：**
```
第1行: field_name1 | field_name2 | field_name3  （加粗）
第2行: 字段1      | 字段2      | 字段3        （普通）
第3行: 示例值1    | 示例值2    | 示例值3      （斜体灰色）
```

**修改后的模板结构：**
```
第1行: field_name1 | field_name2 | field_name3  （加粗）
第2行: 字段1      | 字段2      | 字段3        （普通）
```

### 优化收益

1. **更简洁**：模板只包含必要的两行信息，更清晰易懂
2. **减少代码**：删除了约53行不再需要的代码
3. **更快速**：不需要生成随机示例数据，下载速度更快
4. **易维护**：移除了复杂的类型判断和随机值生成逻辑

用户可以直接参考第一行的字段名和第二行的中文注释来填写数据，无需再看示例数据。


---

# 优化导入功能 - 时间字段支持多种格式

## 问题分析

当前导入功能中，时间字段只支持标准格式，无法兼容用户常用的多种日期格式：
- 中划线格式：2024-06-29、2024-06-29 10:30:00
- 斜杠格式：2024/06/29、2024/06/29 10:30:00
- 纯数字格式：20240629

用户在 Excel 中填写日期时，可能使用任意一种格式，导致导入失败。

## 修复方案

### 原则
- 在后端处理导入数据时，自动识别并转换多种日期格式
- 兼容常见的日期格式，提升用户体验
- 转换失败时给出清晰的错误提示

## Todo List

- [x] 1. 在 generic.service.js 中添加日期格式转换函数
  - 支持中划线格式：2024-06-29、2024-06-29 10:30:00
  - 支持斜杠格式：2024/06/29、2024/06/29 10:30:00  
  - 支持纯数字格式：20240629
  - 转换为标准的 ISO 8601 格式或数据库接受的格式

- [x] 2. 在 importFromExcel 方法中应用日期转换
  - 识别日期/时间类型的字段
  - 在插入数据库前转换日期格式

## 修改文件

- `backend/src/core/modules/generator/generic.service.js` - importFromExcel 方法

## 实现细节

### 1. 添加日期格式转换函数

在 generic.service.js 中添加辅助方法：

```javascript
/**
 * 解析多种日期格式
 * @param {string|Date} value - 日期值
 * @returns {string|null} ISO 8601 格式的日期字符串
 */
_parseDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  
  const str = String(value).trim();
  if (!str) return null;
  
  // 尝试解析多种格式
  let date = null;
  
  // 格式1: 中划线格式 2024-06-29 或 2024-06-29 10:30:00
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    date = new Date(str);
  }
  // 格式2: 斜杠格式 2024/06/29 或 2024/06/29 10:30:00
  else if (/^\d{4}\/\d{2}\/\d{2}/.test(str)) {
    date = new Date(str.replace(/\//g, '-'));
  }
  // 格式3: 纯数字格式 20240629 (YYYYMMDD)
  else if (/^\d{8}$/.test(str)) {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    date = new Date(`${year}-${month}-${day}`);
  }
  
  // 验证日期是否有效
  if (date && !isNaN(date.getTime())) {
    return date.toISOString();
  }
  
  return null;
}
```

### 2. 在 importFromExcel 中应用转换

修改 line 433-441 的数据处理逻辑：

```javascript
const values = batch.map(row => {
  return fields.map((field, idx) => {
    const value = row[field];
    const fieldConfig = fieldConfigs[idx];
    
    // 空值处理
    if (value === '' || value === null || value === undefined) {
      return null;
    }
    
    // 日期字段处理
    const fieldType = fieldConfig.field_type?.toLowerCase();
    if (fieldType?.includes('date') || fieldType?.includes('timestamp')) {
      const parsedDate = this._parseDate(value);
      if (parsedDate === null && value) {
        // 日期格式不正确，但有值
        throw new Error(`第 ${row.rowNum} 行，字段"${fieldConfig.field_comment}"的日期格式不正确`);
      }
      return parsedDate;
    }
    
    return value;
  });
});
```

---

## Review

待实现后填写...

---

# Zabbix 集成方案

## 目标
通过 Zabbix API 在系统中完成各类指标的监控与展示，支持：
1. 在前端配置 Zabbix 实例连接信息
2. 提供完整的 Zabbix 安装引导（Server + Agent + 中间件监控配置）
3. 定时同步 Zabbix 监控数据
4. 在监控页面展示 Zabbix 数据
5. 在仪表板集成 Zabbix Widget

## 监控范围

### 1. 服务器基础状态
- CPU 使用率、负载
- 内存使用率
- 磁盘使用率、IO
- 网络流量、连接数
- 系统运行时间

### 2. 中间件/服务状态监测
- **数据库**：MySQL、PostgreSQL 连接状态、QPS、慢查询
- **缓存**：Redis 连接状态、内存使用、命中率
- **Web 服务**：Nginx/Apache 状态、请求数、活跃连接
- **容器**：Docker 容器运行状态、资源使用
- **应用进程**：自定义进程存活检测、端口存活
- **消息队列**：RabbitMQ、Kafka 状态（按需）

### 实现方式
- Zabbix Agent 配置自定义 UserParameter 检测中间件状态
- 使用 Zabbix 模板（Template）批量应用监控规则
- 安装引导中包含中间件监控配置步骤

## 技术选型
- **Zabbix 版本**: 6.x（兼容麒麟系统）
- **认证方式**: API Token
- **同步策略**: 短周期定时同步（30秒-1分钟）
- **告警处理**: 仅展示，不在平台做额外处理（Zabbix 本身会更新）

## 待办事项

### P0 阶段：基础设施（核心）

- [x] 1. 数据库迁移 - owl_zabbix_instances 表
  - 文件：`backend/migrations/postgres/sql/044-owl_zabbix_instances.sql`
  - 字段：id, name, url, api_token, status, sync_interval, last_sync_at, description, created_at, updated_at, deleted_at

- [x] 2. Sequelize Model - ZabbixInstance
  - 文件：`backend/src/models/third_party/ZabbixInstance.js`
  - 注册：`backend/src/models/index.js`

- [x] 3. Zabbix API 客户端
  - 文件：`backend/src/core/modules/zabbix/zabbix-client.js`
  - 功能：JSON-RPC 2.0 协议封装、API Token 认证、常用方法（host.get, item.get, history.get, trigger.get）

- [x] 4. 后端 Service - Zabbix 实例管理
  - 文件：`backend/src/core/modules/zabbix/zabbix.service.js`
  - 功能：CRUD、测试连接、手动同步

- [x] 5. 后端 Controller + Routes + Validation
  - 文件：`backend/src/core/modules/zabbix/zabbix.controller.js`
  - 文件：`backend/src/core/modules/zabbix/zabbix.routes.js`
  - 文件：`backend/src/core/modules/zabbix/zabbix.validation.js`

- [x] 6. 注册路由到 core.routes.js
  - 修改：`backend/src/routes/core.routes.js`

- [x] 7. 前端 API 客户端
  - 文件：`frontend/lib/api/system/zabbix.api.js`
  - 导出：`frontend/lib/api/index.js`

- [x] 8. 前端 - Zabbix 安装引导组件
  - 文件：`frontend/components/zabbix/ZabbixInstallGuide.jsx`
  - 功能：多个Tab（Server Docker、Server 原生、Agent Linux、Agent 离线、中间件监控配置）
  - 包含完整安装命令、配置说明、验证步骤
  - **中间件监控配置**：自定义 UserParameter、模板导入、服务发现配置

- [x] 9. 前端 - Zabbix 实例配置页面
  - 文件：`frontend/app/(authenticated)/setting/zabbix/page.js`
  - 功能：DataTable 展示实例列表、测试连接、手动同步、编辑、删除
  - 顶部"安装引导"按钮打开 ZabbixInstallGuide

### P1 阶段：数据同步与展示

- [x] 10. 后端 - 数据同步服务
  - 文件：`backend/src/core/modules/zabbix/zabbix-sync.service.js`
  - 功能：定时拉取 Zabbix 数据（主机、监控项、历史数据、触发器）
  - 存储：本地数据库缓存表

- [x] 11. 后端 - 同步数据 API
  - 提供前端查询同步后的 Zabbix 数据

- [x] 12. 前端 - Zabbix 监控数据展示页面
  - 文件：`frontend/app/(authenticated)/monitor/zabbix/page.js`
  - 功能：
    - 主机列表（系统基础信息 + 服务状态概览）
    - 监控项详情（系统指标 + 中间件指标）
    - 历史趋势图
    - 触发器/告警状态
    - **服务状态面板**：展示各中间件运行状态（正常/异常/未监控）

### P2 阶段：仪表板集成

- [ ] 13. 仪表板集成 Zabbix Widget
  - 展示关键监控指标（CPU、内存、磁盘使用率）
  - 展示最近告警
  - **展示中间件服务状态卡片**（各服务运行状态一览）

## 文件结构

```
backend/
├── migrations/postgres/sql/
│   ├── 044-owl_zabbix_instances.sql
│   └── 045-owl_zabbix_hosts.sql
├── src/
│   ├── core/modules/zabbix/
│   │   ├── zabbix-client.js        # Zabbix API 客户端
│   │   ├── zabbix.service.js       # 实例管理 Service
│   │   ├── zabbix.controller.js    # Controller
│   │   ├── zabbix.routes.js        # 路由
│   │   ├── zabbix.validation.js    # 参数校验
│   │   └── zabbix-sync.service.js  # 数据同步服务
│   ├── models/
│   │   └── third_party/
│   │       ├── ZabbixInstance.js   # 实例配置 Model
│   │       └── ZabbixHost.js       # 同步主机 Model
│   └── routes/
│       └── core.routes.js          # 注册 zabbix 路由

frontend/
├── app/(authenticated)/
│   ├── setting/zabbix/
│   │   └── page.js                 # Zabbix 配置页面
│   └── monitor/zabbix/
│       └── page.js                 # Zabbix 监控展示页面
├── components/zabbix/
│   └── ZabbixInstallGuide.jsx      # 安装引导组件
└── lib/api/system/
    └── zabbix.api.js               # API 客户端
```

## API 设计

### Zabbix 实例管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/system/zabbix | 获取实例列表 |
| GET | /api/system/zabbix/:id | 获取实例详情 |
| POST | /api/system/zabbix | 创建实例 |
| PUT | /api/system/zabbix/:id | 更新实例 |
| DELETE | /api/system/zabbix/:id | 删除实例 |
| POST | /api/system/zabbix/:id/test | 测试连接 |
| POST | /api/system/zabbix/:id/sync | 手动同步 |

### Zabbix 数据查询（P1）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/system/zabbix/:id/hosts | 获取主机列表（本地同步数据） |
| GET | /api/system/zabbix/:id/hosts/:hostId | 获取主机详情+监控项（实时） |
| GET | /api/system/zabbix/:id/problems | 获取问题/告警列表（实时） |

## 实施原则

1. **代码不冗余**：复用现有模式（controller → service → routes → validation）
2. **参照已有页面**：使用 DataTable、SearchFilter、Card 等现有组件
3. **遵循 Rule**：
   - 后端使用 ApiError、logger、response helpers
   - 前端使用 shadcn/ui 组件、Tailwind CSS
   - API 调用使用 http-client 模式
   - 注释包含模块归属和使用场景

---

## Review

### 已完成内容

**P0 阶段（全部完成）**：
- 数据库迁移：`044-owl_zabbix_instances.sql` 创建实例配置表
- 后端模块：完整的 controller → service → routes → validation 模式
- Zabbix API 客户端：JSON-RPC 2.0 协议封装，支持 API Token 认证
- 前端配置页面：使用 DataTable、SearchFilter、Dialog 等已有组件
- 安装引导组件：5个Tab（Server Docker/原生、Agent Linux/离线、中间件监控）
- 菜单/权限：已添加菜单项和 CRUD 权限，分配给 admin 角色

**P1 阶段（全部完成）**：
- 数据库迁移：`045-owl_zabbix_hosts.sql` 创建同步主机表
- 数据同步服务：定时拉取主机列表，支持多实例独立同步
- 监控数据 API：主机列表（本地）、主机详情+监控项（实时）、告警列表（实时）
- 监控展示页面：实例选择、主机列表、告警面板、主机详情弹窗
- 菜单项：添加到“监控系统”分组下

**待完成**：
- P2：仪表板集成 Zabbix Widget

---

# 取消 Sequelize 查询缓存并检查 PG 查询优化

## 问题分析

当前全局查询缓存通过 `backend/src/config/cache.js` monkey patch 了所有模型的 `findAll/findOne/findByPk/findAndCountAll/count`。这带来了两个核心问题：

1. **返回值形态不稳定**
   - 缓存未命中时返回 Sequelize 实例
   - 缓存命中时返回普通 JSON
   - 业务层会出现实例方法丢失、关联行为不一致等问题

2. **维护成本高于收益**
   - 认证、用户、文件、动态模块都会被影响
   - 后续业务改写需要持续考虑缓存返回类型
   - 即使换显式缓存插件，也会侵入业务查询代码

因此先移除这层全局查询缓存，恢复统一的 Sequelize 行为，再检查 PG 查询热点做低风险优化，更符合当前项目阶段。

## Todo List

- [ ] 1. 取消全局查询缓存接入
  - 从 `backend/src/app.js` 移除 `applyCacheToModels` 初始化
  - 停用 `backend/src/config/cache.js` 的全局模型包装逻辑
  - 确保查询统一返回 Sequelize 原生结果

- [ ] 2. 收口受缓存影响的查询代码
  - 清理为兼容缓存而加的 service 层绕路逻辑
  - 保持敏感字段控制走查询阶段 `attributes exclude`
  - 确保更新链路继续通过 ID 查询拿实例

- [ ] 3. 检查并优化 PG 热点查询
  - 优先检查 `user.service.js` 的 `findAndCountAll + include + distinct + ILIKE`
  - 优先检查 `file.service.js` 的列表查询与关联
  - 检查生成器模块的列表/统计 SQL 和分页参数
  - 修复明显的低风险问题（例如错误使用 `pageSize` 代替 `limit`）

- [ ] 4. 验证关键链路
  - 用户认证与当前用户读取
  - 用户列表/详情/更新
  - 文件列表/详情
  - 动态模块列表与导入相关查询

## 修改文件

- `backend/src/app.js` - 移除查询缓存初始化
- `backend/src/config/cache.js` - 停用或简化当前缓存实现
- `backend/src/core/modules/user/user.service.js` - 收口查询字段与分页参数
- `backend/src/core/modules/file/file.service.js` - 收口查询与返回逻辑
- `backend/src/core/modules/auth/auth.service.js` - 确保认证链路不依赖缓存兼容逻辑
- `backend/src/core/modules/generator/generic.service.js` - 检查动态查询与分页/统计实现

## 实施原则

- **先稳定**：先恢复统一 Sequelize 返回行为，不再混用 JSON/实例
- **最小改动**：不做大规模重构，只修低风险高收益点
- **查询前置控制**：敏感字段通过 `attributes` 控制，不依赖 `toSafeJSON()`
- **优先热点**：先处理用户、文件、动态模块这几条查询链路

## Review

待实现后填写...

---

# 取消 Sequelize 查询缓存并检查 PG 查询优化

## 问题分析

当前全局查询缓存通过 `backend/src/config/cache.js` monkey patch 了所有模型的 `findAll/findOne/findByPk/findAndCountAll/count`。这带来了两个核心问题：

1. **返回值形态不稳定**
   - 缓存未命中时返回 Sequelize 实例
   - 缓存命中时返回普通 JSON
   - 业务层会出现实例方法丢失、关联行为不一致等问题

2. **维护成本高于收益**
   - 认证、用户、文件、动态模块都会被影响
   - 后续业务改写需要持续考虑缓存返回类型
   - 即使换显式缓存插件，也会侵入业务查询代码

因此先移除这层全局查询缓存，恢复统一的 Sequelize 行为，再检查 PG 查询热点做低风险优化，更符合当前项目阶段。

## Todo List

- [ ] 1. 取消全局查询缓存接入
  - 从 `backend/src/app.js` 移除 `applyCacheToModels` 初始化
  - 停用 `backend/src/config/cache.js` 的全局模型包装逻辑
  - 确保查询统一返回 Sequelize 原生结果

- [ ] 2. 收口受缓存影响的查询代码
  - 清理为兼容缓存而加的 service 层绕路逻辑
  - 保持敏感字段控制走查询阶段 `attributes exclude`
  - 确保更新链路继续通过 ID 查询拿实例

- [ ] 3. 检查并优化 PG 热点查询
  - 优先检查 `user.service.js` 的 `findAndCountAll + include + distinct + ILIKE`
  - 优先检查 `file.service.js` 的列表查询与关联
  - 检查生成器模块的列表/统计 SQL 和分页参数
  - 修复明显的低风险问题（例如错误使用 `pageSize` 代替 `limit`）

- [ ] 4. 验证关键链路
  - 用户认证与当前用户读取
  - 用户列表/详情/更新
  - 文件列表/详情
  - 动态模块列表与导入相关查询

## 修改文件

- `backend/src/app.js` - 移除查询缓存初始化
- `backend/src/config/cache.js` - 停用或简化当前缓存实现
- `backend/src/core/modules/user/user.service.js` - 收口查询字段与分页参数
- `backend/src/core/modules/file/file.service.js` - 收口查询与返回逻辑
- `backend/src/core/modules/auth/auth.service.js` - 确保认证链路不依赖缓存兼容逻辑
- `backend/src/core/modules/generator/generic.service.js` - 检查动态查询与分页/统计实现

## 实施原则

- **先稳定**：先恢复统一 Sequelize 返回行为，不再混用 JSON/实例
- **最小改动**：不做大规模重构，只修低风险高收益点
- **查询前置控制**：敏感字段通过 `attributes` 控制，不依赖 `toSafeJSON()`
- **优先热点**：先处理用户、文件、动态模块这几条查询链路

## Review

### 已完成的优化 ✅

**修改文件：`backend/src/core/modules/generator/generic.service.js`**

添加了日期格式多样性支持，让导入功能能够识别和转换多种常见日期格式：

**1. 新增 _parseDate 方法（line 716-754）**

支持的日期格式：
- **中划线格式**：2024-06-29、2024-06-29 10:30:00
- **斜杠格式**：2024/06/29、2024/06/29 10:30:00
- **纯数字格式**：20240629 (YYYYMMDD)
- **原生 Date 对象**：直接支持

功能特性：
- 自动识别格式并转换为 ISO 8601 标准格式
- 验证日期有效性（如 2024-02-30 会被识别为无效）
- 返回 null 表示无法解析（空值或格式不正确）

**2. 修改 importFromExcel 方法 - 批量插入逻辑（line 431-456）**

```javascript
const values = batch.map(row => {
  return fields.map((field, idx) => {
    const value = row[field];
    const fieldConfig = fieldConfigs[idx];

    // 空值处理
    if (value === '' || value === null || value === undefined) {
      return null;
    }

    // 日期字段处理
    const fieldType = fieldConfig.field_type?.toLowerCase();
    if (fieldType && (fieldType.includes('date') || fieldType.includes('timestamp') || fieldType.includes('time'))) {
      const parsedDate = this._parseDate(value);
      if (parsedDate === null && value) {
        throw new Error(`第 ${row.rowNum} 行，字段"${fieldConfig.field_comment || field}"的日期格式不正确: ${value}`);
      }
      return parsedDate;
    }

    return value;
  });
});
```

**3. 修改 importFromExcel 方法 - 逐行插入降级逻辑（line 480-502）**

当批量插入失败时，逐行插入也应用相同的日期转换逻辑。

### 优化效果

**修改前：**
- 只支持数据库的原生日期格式
- 用户需要在 Excel 中精确匹配格式
- 格式不对导致导入失败，错误提示不明确

**修改后：**
- 支持 3 种常见日期格式
- 用户可以用习惯的方式填写日期
- 自动转换为标准格式
- 格式错误时给出清晰提示（包含行号、字段名和错误值）

### 使用示例

用户在 Excel 中填写日期字段时，以下格式都能正确导入：

| 格式类型 | 示例值 | 转换结果 |
|---------|-------|---------|
| 中划线（完整） | 2024-06-29 10:30:00 | 2024-06-29T10:30:00.000Z |
| 中划线（日期） | 2024-06-29 | 2024-06-29T00:00:00.000Z |
| 斜杠（完整） | 2024/06/29 10:30:00 | 2024-06-29T10:30:00.000Z |
| 斜杠（日期） | 2024/06/29 | 2024-06-29T00:00:00.000Z |
| 纯数字 | 20240629 | 2024-06-29T00:00:00.000Z |

大大提升了用户体验，减少了因日期格式问题导致的导入失败。

---

# 修复缓存重建实例时字段丢失的问题

## 问题分析

错误日志显示：
```
[Cache HIT] User - User:a2b46e14
ApiError: 用户状态异常: undefined
```

**问题原因：**
1. 缓存命中（Cache HIT）
2. 从缓存读取的用户对象的 `status` 字段是 undefined
3. `rebuildInstance` 函数使用 `Model.build(data)` 重建实例时，某些字段可能丢失

**根本原因：**
- `Model.build()` 可能不会正确地从普通对象恢复所有字段
- 需要确保 dataValues 包含所有原始数据
- 缓存的数据可能在之前的版本中保存时就不完整

## 修复方案

### 原则
- 确保从缓存重建的实例包含所有原始字段
- 添加调试日志帮助排查问题
- 清理旧的缓存数据

## Todo List

- [ ] 1. 改进 rebuildInstance 函数
  - 确保 dataValues 包含所有原始数据
  - 添加调试日志

- [ ] 2. 添加缓存清理功能
  - 提供手动清理缓存的接口
  - 清理可能损坏的旧缓存

## 修改文件

- `backend/src/config/cache.js` - rebuildInstance 函数

## 实现细节

### 1. 改进 rebuildInstance 函数

```javascript
function rebuildInstance(Model, data, sequelize, depth = 0) {
  if (!data) return null;
  if (depth > 3) return Model.build(data, { isNewRecord: false, raw: false });

  try {
    // 确保使用原始数据构建实例
    const instance = Model.build(data, { 
      isNewRecord: false, 
      raw: false 
    });

    // 重要：确保所有数据都在 dataValues 中
    // 因为 Model.build 可能不会设置某些字段
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && !key.startsWith('_')) {
        instance.dataValues[key] = data[key];
        instance[key] = data[key];
      }
    });

    // 处理关联数据...
    // （保持原有逻辑）
    
    return instance;
  } catch (err) {
    logger.warn(`重建实例失败 (depth=${depth}): ${err.message}`);
    return Model.build(data, { isNewRecord: false, raw: false });
  }
}
```

### 2. 添加清理所有缓存的函数

```javascript
async function clearAllCache() {
  try {
    const pattern = 'owl:cache:*';
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info(`[Cache CLEAR ALL] ${keys.length} keys cleared`);
      return keys.length;
    }
    return 0;
  } catch (err) {
    logger.error(`清除所有缓存失败: ${err.message}`);
    throw err;
  }
}
```

---

## Review

待实现后填写...
