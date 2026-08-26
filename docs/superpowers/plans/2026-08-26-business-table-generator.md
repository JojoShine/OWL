# Business Table Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a safe visual flow that creates a new `biz_` PostgreSQL table, initializes its generator configuration atomically, opens that configuration for editing, and replaces the API-key dialog's native date input with the system date picker.

**Architecture:** A focused generator service owns business-table validation and DDL construction from an allow-listed schema definition. The service creates the table and generator configuration in one Sequelize transaction; existing database-reader and configuration services gain optional transaction propagation so the uncommitted table is visible on the same connection. A dedicated frontend dialog collects table and field definitions, while the existing generator page coordinates refresh and configuration editing.

**Tech Stack:** Express 4, Sequelize 6, PostgreSQL, Joi, Jest, Next.js 16, React 19, Radix UI, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-26-business-table-generator-design.md`

## Global Constraints

- Only new tables are supported; existing tables cannot be modified, renamed, truncated, or deleted.
- Every created table name starts with `biz_`; the request supplies only the suffix.
- The API never accepts raw DDL or arbitrary PostgreSQL type expressions.
- Identifiers use lowercase letters, digits, and underscores and start with a letter.
- Every table gets the fixed UUID primary key and six audit fields from the spec.
- At least one editable business field is required.
- Creation and configuration initialization succeed or roll back together.
- Existing unrelated working-tree changes, especially logs and `frontend/package-lock.json`, remain untouched.

---

### Task 1: Business table definition and atomic creation

**Files:**
- Create: `backend/src/core/modules/generator/business-table.service.js`
- Create: `backend/src/core/modules/generator/business-table.service.test.js`
- Modify: `backend/src/core/modules/generator/db-reader.service.js`
- Modify: `backend/src/core/modules/generator/module-config.service.js`

**Interfaces:**
- Produces: `businessTableService.createBusinessTable(definition, userId): Promise<{ tableName, moduleConfig }>`.
- Produces: `businessTableService.normalizeDefinition(definition): NormalizedDefinition` for unit testing and controller use.
- Changes: database-reader structure methods accept an optional `{ transaction }` options object.
- Changes: `moduleConfigService.initializeModuleConfig(tableName, { transaction, userId } = {})` creates all generator rows on the supplied transaction.

- [ ] **Step 1: Add focused failing service tests**

Create Jest cases that assert:

```js
expect(normalizeDefinition({ table_name: 'customer', fields: validFields }).tableName)
  .toBe('biz_customer');
expect(() => normalizeDefinition({ table_name: 'owl_user', fields: validFields }))
  .toThrow('业务表名');
expect(() => normalizeDefinition({ table_name: 'customer', fields: [{ name: 'created_at', type: 'string' }] }))
  .toThrow('系统字段');
expect(() => normalizeDefinition({ table_name: 'customer', fields: [{ name: 'payload', type: 'sql' }] }))
  .toThrow('字段类型');
```

Mock `db.sequelize.transaction`, `queryInterface.createTable`, `addConstraint`, `addIndex`, and `moduleConfigService.initializeModuleConfig`. Verify all calls receive the same transaction, duplicate tables produce HTTP 409, and initialization failure calls rollback without commit.

- [ ] **Step 2: Run the service test once and confirm the missing module failure**

Run: `cd backend && npx jest src/core/modules/generator/business-table.service.test.js --runInBand`

Expected: FAIL because `business-table.service.js` does not exist.

- [ ] **Step 3: Implement normalization and allow-listed PostgreSQL mapping**

Implement constants for reserved audit fields and supported types. Convert only these logical types:

```js
string -> DataTypes.STRING(length || 255)
text -> DataTypes.TEXT
integer -> DataTypes.INTEGER
bigint -> DataTypes.BIGINT
decimal -> DataTypes.DECIMAL(precision, scale)
boolean -> DataTypes.BOOLEAN
date -> DataTypes.DATEONLY
datetime -> DataTypes.DATE
json -> DataTypes.JSONB
```

Validate identifiers, duplicate fields, string length `1..2000`, decimal precision `1..38`, scale `0..precision`, type-compatible defaults, and at least one business field. Generate `id`, `created_by`, `updated_by`, `deleted_by`, `created_at`, `updated_at`, and `deleted_at` only on the server.

- [ ] **Step 4: Implement one-transaction creation and transaction propagation**

Within `createBusinessTable`, use one managed or explicit transaction for table existence checking, `createTable`, comments/constraints/indexes, and module initialization. Pass `{ transaction }` through `tableExists`, `getTableStructure`, `getTableColumns`, `getTableIndexes`, `getPrimaryKeys`, and `getForeignKeys`; every `sequelize.query` and model `create/find` in this flow must receive it.

Set `created_by: userId` on the generated module and generated fields. Return the fully loaded module configuration using the same transaction before commit.

- [ ] **Step 5: Run the service tests**

Run: `cd backend && npx jest src/core/modules/generator/business-table.service.test.js --runInBand`

Expected: all business-table service cases pass.

- [ ] **Step 6: Commit the backend service unit**

```bash
git add backend/src/core/modules/generator/business-table.service.js backend/src/core/modules/generator/business-table.service.test.js backend/src/core/modules/generator/db-reader.service.js backend/src/core/modules/generator/module-config.service.js
git commit -m "feat: add atomic business table creation"
```

---

### Task 2: Protected generator API endpoint

**Files:**
- Modify: `backend/src/core/modules/generator/generator.validation.js`
- Modify: `backend/src/core/modules/generator/generator.controller.js`
- Modify: `backend/src/core/modules/generator/generator.routes.js`
- Create: `backend/src/core/modules/generator/business-table.controller.test.js`

**Interfaces:**
- Consumes: `businessTableService.createBusinessTable(req.body, req.user.id)`.
- Produces: `POST /api/generator/business-tables`, protected by authentication and `generator:create`.
- Response data: `{ tableName: string, moduleConfig: GeneratedModuleWithFields }`.

- [ ] **Step 1: Add failing controller/validation tests**

Test that a valid body calls the service with the authenticated user ID and returns status 201. Test Joi rejection for uppercase identifiers, missing fields, duplicate field names, invalid string length, invalid decimal scale, and unsupported types.

- [ ] **Step 2: Run the focused API test once**

Run: `cd backend && npx jest src/core/modules/generator/business-table.controller.test.js --runInBand`

Expected: FAIL because the controller action and validation schema are absent.

- [ ] **Step 3: Add the request schema**

Add `createBusinessTable` with:

```js
table_name: /^[a-z][a-z0-9_]{0,58}$/
table_comment: optional string, max 255
fields: array length 1..100
field.name: /^[a-z][a-z0-9_]{0,62}$/
field.type: enum of `string`, `text`, `integer`, `bigint`, `decimal`, `boolean`, `date`, `datetime`, `json`
field.comment: optional string, max 255
field.nullable, field.unique, field.indexed: boolean
field.length, field.precision, field.scale: bounded integer
field.default_value: optional string|number|boolean|null
field.default_current_time: optional boolean
```

Keep semantic validation in the service so direct callers and HTTP callers share the same safety boundary.

- [ ] **Step 4: Add controller and route**

Add `createBusinessTable` to the controller, call the service, and respond with the shared `success` helper using status 201. Register `POST /business-tables` before parameterized table routes, with `checkPermission('generator', 'create')` and the new validation.

- [ ] **Step 5: Run the backend focused tests and syntax check**

Run:

```bash
cd backend
npx jest src/core/modules/generator/business-table.service.test.js src/core/modules/generator/business-table.controller.test.js --runInBand
node --check src/core/modules/generator/generator.controller.js
node --check src/core/modules/generator/generator.routes.js
node --check src/core/modules/generator/generator.validation.js
```

Expected: tests pass and every syntax check exits 0.

- [ ] **Step 6: Commit the API unit**

```bash
git add backend/src/core/modules/generator/generator.validation.js backend/src/core/modules/generator/generator.controller.js backend/src/core/modules/generator/generator.routes.js backend/src/core/modules/generator/business-table.controller.test.js
git commit -m "feat: expose business table creation API"
```

---

### Task 3: Visual business-table dialog and automatic config opening

**Files:**
- Create: `frontend/components/generator/BusinessTableDialog.jsx`
- Create: `frontend/components/generator/BusinessTableDialog.test.jsx`
- Modify: `frontend/components/generator/TablesSection.jsx`
- Modify: `frontend/components/generator/index.js`
- Modify: `frontend/app/(authenticated)/generator/page.js`
- Modify: `frontend/lib/api/system/generator.api.js`
- Modify: `frontend/vitest.config.js`

**Interfaces:**
- Produces: `generatorApi.createBusinessTable(definition)`.
- Produces: `<BusinessTableDialog open onOpenChange onCreated />`; `onCreated(moduleConfig, tableName)` runs after the API succeeds.
- Changes: `TablesSection` receives `onCreateTable` and displays “新建业务表” next to refresh.

- [ ] **Step 1: Add failing dialog behavior tests**

Cover these visible behaviors:

```jsx
expect(screen.getByText('biz_')).toBeVisible();
expect(screen.getByText('系统将自动添加主键与审计字段')).toBeVisible();
expect(screen.getByRole('button', { name: '创建业务表' })).toBeDisabled();
```

Fill a table suffix and one field, select a supported type, submit, then assert `generatorApi.createBusinessTable` receives no raw SQL and `onCreated` receives the returned module configuration. Add a case showing duplicate/reserved field validation without sending a request.

- [ ] **Step 2: Run the dialog test once**

Run: `cd frontend && npm run test:ui -- components/generator/BusinessTableDialog.test.jsx`

Expected: FAIL because the dialog does not exist.

- [ ] **Step 3: Build the focused dialog**

Use existing `Dialog`, `Input`, `Select`, `Checkbox`, `Button`, and lightweight table/list primitives. Start with one empty field row; support add, delete, and move up/down. Show length only for `string`, precision/scale only for `decimal`, and current-time only for `datetime`. Keep automatic fields read-only in an informational block.

Disable submit until table suffix and all field names/types are valid. Display backend error messages through the existing toast pattern, and prevent duplicate submission with a local submitting flag.

- [ ] **Step 4: Connect table creation to the generator page**

Add the API method and toolbar action. On success:

1. close the business-table dialog;
2. refresh the table query;
3. store `moduleConfig` and its `fields` in the existing configuration state;
4. switch to the `configs` tab;
5. open the existing `ConfigDialog` immediately.

Do not automatically generate or publish code.

- [ ] **Step 5: Run the dialog test and frontend lint**

Run:

```bash
cd frontend
npm run test:ui -- components/generator/BusinessTableDialog.test.jsx
npx eslint components/generator/BusinessTableDialog.jsx components/generator/TablesSection.jsx 'app/(authenticated)/generator/page.js' lib/api/system/generator.api.js
```

Expected: dialog tests pass and ESLint reports zero errors.

- [ ] **Step 6: Commit the frontend business-table flow**

```bash
git add frontend/components/generator/BusinessTableDialog.jsx frontend/components/generator/BusinessTableDialog.test.jsx frontend/components/generator/TablesSection.jsx frontend/components/generator/index.js 'frontend/app/(authenticated)/generator/page.js' frontend/lib/api/system/generator.api.js frontend/vitest.config.js
git commit -m "feat: add visual business table builder"
```

---

### Task 4: System date picker in API-key dialog and final verification

**Files:**
- Modify: `frontend/app/(authenticated)/setting/api-builder/keys/page.js`
- Create: `frontend/app/(authenticated)/setting/api-builder/keys/page.test.jsx`

**Interfaces:**
- Consumes: existing `DatePicker({ value, onChange, placeholder })`, whose `onChange` receives `{ target: { value: 'YYYY-MM-DD' } }`.
- Preserves: `formData.expires_at` as a `YYYY-MM-DD` string and the existing ISO conversion in `save()`.

- [ ] **Step 1: Add a focused failing UI contract test**

Mock the system date picker and assert that opening “创建密钥” renders the mocked picker with placeholder “选择有效期（可选）”, while no `input[type="date"]` is present.

- [ ] **Step 2: Run the date-picker test once**

Run: `cd frontend && npm run test:ui -- 'app/(authenticated)/setting/api-builder/keys/page.test.jsx'`

Expected: FAIL because the page still renders a native date input.

- [ ] **Step 3: Replace the native input**

Import `DatePicker`, pass `formData.expires_at`, and update state from `event.target.value`. Keep the control at system input height and preserve edit/create behavior.

- [ ] **Step 4: Run one consolidated verification**

Run:

```bash
cd backend
npx jest src/core/modules/generator/business-table.service.test.js src/core/modules/generator/business-table.controller.test.js --runInBand
find src/core/modules/generator -name '*.js' -print0 | xargs -0 -n1 node --check
cd ../frontend
npm run test:ui -- components/generator/BusinessTableDialog.test.jsx 'app/(authenticated)/setting/api-builder/keys/page.test.jsx'
npx eslint components/generator/BusinessTableDialog.jsx components/generator/TablesSection.jsx 'app/(authenticated)/generator/page.js' 'app/(authenticated)/setting/api-builder/keys/page.js' lib/api/system/generator.api.js
npm run build
```

Expected: focused tests pass, syntax checks pass, ESLint has zero errors, and the production build exits 0.

- [ ] **Step 5: Commit the date picker and final integration**

```bash
git add 'frontend/app/(authenticated)/setting/api-builder/keys/page.js' 'frontend/app/(authenticated)/setting/api-builder/keys/page.test.jsx'
git commit -m "fix: use system date picker for API keys"
```
