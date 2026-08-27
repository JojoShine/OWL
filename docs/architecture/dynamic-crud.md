# 动态 CRUD 渲染架构

## 概述

这是一套通用的CRUD组件，用于根据代码生成器生成的配置动态渲染页面，实现真正的配置驱动开发。

## 组件结构

```
dynamic-module/
├── DynamicCrudPage.jsx    # 主页面组件（集成所有功能）
├── DynamicTable.jsx        # 动态表格组件
├── DynamicForm.jsx         # 动态表单组件
├── DynamicFilters.jsx      # 动态筛选组件
├── index.js                # 统一导出
└── README.md               # 说明文档
```

## 使用方式

### 1. 在动态路由中使用

```jsx
import { DynamicCrudPage } from '@/components/dynamic-module/DynamicCrudPage';

export default function DynamicModulePage() {
  const [config, setConfig] = useState(null);

  // 从后端加载配置
  useEffect(() => {
    // ... 加载配置逻辑
  }, []);

  return <DynamicCrudPage config={config} />;
}
```

### 2. 配置格式

```javascript
{
  moduleName: "Product",          // 模块名称
  modulePath: "products",         // 模块路径
  description: "产品管理",         // 模块描述

  // API端点配置
  api: {
    list: "/api/products",
    create: "/api/products",
    update: "/api/products/:id",
    delete: "/api/products/:id",
    export: "/api/products/export"
  },

  // 权限配置
  permissions: {
    read: "products:read",
    create: "products:create",
    update: "products:update",
    delete: "products:delete"
  },

  // 字段配置
  fields: [
    {
      name: "name",                    // 字段名
      label: "产品名称",                // 字段标签
      type: "string",                  // 字段类型

      // 搜索配置
      isSearchable: true,              // 是否可搜索
      searchType: "like",              // 搜索类型: exact/like/range
      searchComponent: "input",        // 搜索组件: input/select/number

      // 列表显示配置
      showInList: true,                // 是否在列表显示
      listSort: 1,                     // 列表显示顺序
      listWidth: "150px",              // 列宽度
      listAlign: "left",               // 对齐方式: left/center/right

      // 格式化配置
      formatType: "date",              // 格式化类型: date/money/enum/boolean/mask
      formatOptions: {},               // 格式化选项

      // 表单配置
      showInForm: true,                // 是否在表单显示
      formComponent: "input",          // 表单组件: input/textarea/select/switch/number
      readonly: false,                 // 是否只读
      placeholder: "请输入产品名称",    // 占位符

      // 验证规则
      rules: {
        required: true,                // 是否必填
        min: 1,                        // 最小长度/值
        max: 100,                      // 最大长度/值
        pattern: "^[a-zA-Z0-9]+$",    // 正则表达式
        email: false                   // 是否为邮箱
      }
    }
  ],

  // 功能开关
  features: {
    create: true,                      // 是否支持新增
    update: true,                      // 是否支持编辑
    delete: true,                      // 是否支持删除
    batchDelete: true,                 // 是否支持批量删除
    export: false                      // 是否支持导出
  }
}
```

## 组件功能

### DynamicCrudPage

主容器组件，提供完整的CRUD功能：

- ✅ 页面标题和描述
- ✅ 新增按钮（权限控制）
- ✅ 批量删除按钮
- ✅ 筛选功能
- ✅ 数据表格
- ✅ 分页功能
- ✅ 表单对话框
- ✅ 删除确认对话框

### DynamicTable

动态表格组件：

- ✅ 根据配置动态生成列
- ✅ 字段格式化（日期、金额、枚举、布尔、脱敏）
- ✅ 批量选择
- ✅ 编辑/删除操作按钮
- ✅ 响应式列宽和对齐
- ✅ 空数据和加载状态

### DynamicForm

动态表单组件：

- ✅ 根据配置动态生成表单字段
- ✅ 支持多种输入组件（Input, Textarea, Select, Switch）
- ✅ 自动生成验证规则（基于 react-hook-form + zod）
- ✅ 必填标识
- ✅ 错误提示
- ✅ 新增/编辑模式

### DynamicFilters

动态筛选组件：

- ✅ 根据可搜索字段生成筛选条件
- ✅ 支持多种输入组件（Input, Select, Number）
- ✅ 响应式网格布局
- ✅ 搜索和重置按钮
- ✅ Enter键快捷搜索

## 支持的字段类型

| 字段类型 | 表单组件 | 格式化显示 |
|---------|---------|----------|
| string  | Input   | 字符串截断 |
| text    | Textarea | 字符串截断 |
| number  | Input(number) | 数字 |
| boolean | Switch  | Badge（是/否） |
| date    | DatePicker | 日期时间格式化 |
| enum    | Select  | Badge（枚举映射） |

## 格式化类型

### date - 日期格式化
```javascript
formatType: "date"
// 输出: 2025/10/20 15:30:45
```

### money - 金额格式化
```javascript
formatType: "money"
// 输出: ¥1,234.56
```

### enum - 枚举映射
```javascript
formatType: "enum",
formatOptions: {
  enumMap: {
    active: { label: "启用", variant: "default" },
    inactive: { label: "禁用", variant: "secondary" }
  }
}
```

### boolean - 布尔值
```javascript
formatType: "boolean"
// 输出: Badge（是/否）
```

### mask - 脱敏处理
```javascript
formatType: "mask",
formatOptions: {
  maskType: "phone"  // 或 "email"
}
// 输出: 138****5678
```

## 测试说明

### 1. 使用代码生成器生成测试模块

1. 访问 `/generator` 代码生成器页面
2. 选择一个测试表（如 test_products）
3. 配置字段和功能
4. 点击"生成代码"
5. 查看生成历史

### 2. 访问生成的模块

1. 检查侧边栏是否出现新菜单
2. 点击菜单访问动态生成的页面
3. 测试所有CRUD功能

### 3. 验证功能

- [ ] 筛选功能正常工作
- [ ] 列表数据正常显示
- [ ] 分页功能正常
- [ ] 新增数据成功
- [ ] 编辑数据成功
- [ ] 删除数据成功
- [ ] 批量删除成功
- [ ] 字段格式化正确
- [ ] 表单验证正常
- [ ] 权限控制有效

## 技术栈

- **React** - UI 框架
- **Next.js App Router** - 路由系统
- **shadcn/ui** - UI 组件库
- **react-hook-form** - 表单管理
- **zod** - 数据验证
- **Tailwind CSS** - 样式系统
- **lucide-react** - 图标库
- **sonner** - 消息提示

## 注意事项

1. **权限控制**: 当前权限控制是简化版本，需要集成真实的权限系统
2. **API响应格式**: 组件会自动适配多种响应格式（items/data, pagination/total）
3. **字段验证**: 验证规则基于字段的 `rules` 配置自动生成
4. **批量删除**: 目前是逐个删除，后端可以优化为批量API
5. **导出功能**: 暂未实现，需要后续添加

## 扩展开发

### 添加新的字段类型

在 `DynamicForm.jsx` 的 `renderFormField` 方法中添加新的 case：

```javascript
case 'date-picker':
  return <DatePicker {...props} />;
```

### 添加新的格式化类型

在 `DynamicTable.jsx` 的 `formatFieldValue` 方法中添加新的 case：

```javascript
case 'custom':
  return customFormatter(value, field.formatOptions);
```

### 自定义样式

所有组件使用 Tailwind CSS 类名，可以通过修改类名自定义样式。

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT
