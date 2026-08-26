const crypto = require('crypto');
const { DataTypes, literal } = require('sequelize');
const db = require('../../../models');
const ApiError = require('../../../utils/ApiError');
const dbReaderService = require('./db-reader.service');
const moduleConfigService = require('./module-config.service');

const IDENTIFIER_PATTERN = /^[a-z][a-z0-9_]*$/;
const SYSTEM_FIELDS = new Set([
  'id',
  'created_by',
  'updated_by',
  'deleted_by',
  'created_at',
  'updated_at',
  'deleted_at',
]);
const SUPPORTED_TYPES = new Set([
  'string',
  'text',
  'integer',
  'bigint',
  'decimal',
  'boolean',
  'date',
  'datetime',
  'json',
]);

function badRequest(message) {
  throw ApiError.badRequest(message);
}

function normalizeIdentifier(value, label, maxLength) {
  const normalized = String(value || '').trim();
  if (!IDENTIFIER_PATTERN.test(normalized) || normalized.length > maxLength) {
    badRequest(`${label}只能使用小写字母、数字和下划线，并以字母开头`);
  }
  return normalized;
}

function normalizeDefaultValue(field) {
  if (field.default_current_time) {
    if (field.type !== 'datetime') badRequest(`字段 ${field.name} 仅日期时间类型支持当前时间默认值`);
    return literal('CURRENT_TIMESTAMP');
  }

  const value = field.default_value;
  if (value === undefined || value === null || value === '') return undefined;

  if (['string', 'text'].includes(field.type)) return String(value);
  if (['integer', 'bigint'].includes(field.type)) {
    if (!/^-?\d+$/.test(String(value))) badRequest(`字段 ${field.name} 的默认值必须为整数`);
    return field.type === 'integer' ? Number(value) : String(value);
  }
  if (field.type === 'decimal') {
    if (!/^-?\d+(\.\d+)?$/.test(String(value))) badRequest(`字段 ${field.name} 的默认值必须为数字`);
    return String(value);
  }
  if (field.type === 'boolean') {
    if (typeof value !== 'boolean') badRequest(`字段 ${field.name} 的默认值必须为布尔值`);
    return value;
  }
  if (field.type === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) badRequest(`字段 ${field.name} 的默认值必须为日期`);
    return String(value);
  }
  if (field.type === 'datetime') {
    if (Number.isNaN(Date.parse(value))) badRequest(`字段 ${field.name} 的默认值必须为日期时间`);
    return new Date(value);
  }
  if (field.type === 'json') {
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      badRequest(`字段 ${field.name} 的默认值必须为有效 JSON`);
    }
  }
  return undefined;
}

function normalizeField(input) {
  const name = normalizeIdentifier(input.name, '字段名', 63);
  if (SYSTEM_FIELDS.has(name)) badRequest(`字段 ${name} 与系统字段重名`);
  if (!SUPPORTED_TYPES.has(input.type)) badRequest(`字段 ${name} 使用了不支持的字段类型`);

  const field = {
    name,
    type: input.type,
    comment: String(input.comment || '').trim().slice(0, 255),
    nullable: input.nullable !== false,
    unique: input.unique === true,
    indexed: input.indexed === true,
    default_value: input.default_value,
    default_current_time: input.default_current_time === true,
  };

  if (field.type === 'string') {
    field.length = Number(input.length || 255);
    if (!Number.isInteger(field.length) || field.length < 1 || field.length > 2000) {
      badRequest(`字段 ${name} 的长度必须在 1 到 2000 之间`);
    }
  }

  if (field.type === 'decimal') {
    field.precision = Number(input.precision || 10);
    field.scale = Number(input.scale ?? 2);
    if (!Number.isInteger(field.precision) || field.precision < 1 || field.precision > 38) {
      badRequest(`字段 ${name} 的精度必须在 1 到 38 之间`);
    }
    if (!Number.isInteger(field.scale) || field.scale < 0 || field.scale > field.precision) {
      badRequest(`字段 ${name} 的小数位必须在 0 到精度之间`);
    }
  }

  field.defaultValue = normalizeDefaultValue(field);
  return field;
}

function normalizeDefinition(definition = {}) {
  const suffix = normalizeIdentifier(definition.table_name, '业务表名', 59);
  if (suffix.startsWith('biz_') || suffix.startsWith('owl_')) {
    badRequest('业务表名只需填写 biz_ 后面的名称');
  }

  if (!Array.isArray(definition.fields) || definition.fields.length === 0) {
    badRequest('请至少添加一个业务字段');
  }
  if (definition.fields.length > 100) badRequest('单张业务表最多支持 100 个业务字段');

  const fields = definition.fields.map(normalizeField);
  const names = new Set();
  for (const field of fields) {
    if (names.has(field.name)) badRequest(`字段 ${field.name} 重复`);
    names.add(field.name);
  }

  return {
    tableName: `biz_${suffix}`,
    tableComment: String(definition.table_comment || '').trim().slice(0, 255),
    fields,
  };
}

function dataTypeFor(field) {
  const mapping = {
    string: () => DataTypes.STRING(field.length),
    text: () => DataTypes.TEXT,
    integer: () => DataTypes.INTEGER,
    bigint: () => DataTypes.BIGINT,
    decimal: () => DataTypes.DECIMAL(field.precision, field.scale),
    boolean: () => DataTypes.BOOLEAN,
    date: () => DataTypes.DATEONLY,
    datetime: () => DataTypes.DATE,
    json: () => DataTypes.JSONB,
  };
  return mapping[field.type]();
}

function buildColumns(definition) {
  const columns = {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      allowNull: false,
      defaultValue: literal('gen_random_uuid()'),
      comment: '主键',
    },
  };

  for (const field of definition.fields) {
    columns[field.name] = {
      type: dataTypeFor(field),
      allowNull: field.nullable,
      ...(field.defaultValue !== undefined ? { defaultValue: field.defaultValue } : {}),
      ...(field.comment ? { comment: field.comment } : {}),
    };
  }

  Object.assign(columns, {
    created_by: { type: DataTypes.UUID, allowNull: true, comment: '创建人' },
    updated_by: { type: DataTypes.UUID, allowNull: true, comment: '更新人' },
    deleted_by: { type: DataTypes.UUID, allowNull: true, comment: '删除人' },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP'), comment: '创建时间' },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: literal('CURRENT_TIMESTAMP'), comment: '更新时间' },
    deleted_at: { type: DataTypes.DATE, allowNull: true, comment: '删除时间' },
  });
  return columns;
}

function databaseObjectName(prefix, tableName, fieldName) {
  const base = `${prefix}_${tableName}_${fieldName}`;
  if (base.length <= 63) return base;
  const hash = crypto.createHash('sha1').update(base).digest('hex').slice(0, 8);
  return `${base.slice(0, 54)}_${hash}`;
}

async function createBusinessTable(definition, userId) {
  const normalized = normalizeDefinition(definition);
  return db.sequelize.transaction(async (transaction) => {
    if (await dbReaderService.tableExists(normalized.tableName, { transaction })) {
      throw ApiError.conflict(`业务表 ${normalized.tableName} 已存在`);
    }

    const queryInterface = db.sequelize.getQueryInterface();
    await queryInterface.createTable(
      normalized.tableName,
      buildColumns(normalized),
      { transaction, comment: normalized.tableComment || undefined }
    );

    for (const field of normalized.fields) {
      if (field.unique) {
        await queryInterface.addConstraint(normalized.tableName, {
          fields: [field.name],
          type: 'unique',
          name: databaseObjectName('uq', normalized.tableName, field.name),
          transaction,
        });
      } else if (field.indexed) {
        await queryInterface.addIndex(normalized.tableName, [field.name], {
          name: databaseObjectName('idx', normalized.tableName, field.name),
          transaction,
        });
      }
    }

    const moduleConfig = await moduleConfigService.initializeModuleConfig(normalized.tableName, {
      transaction,
      userId,
    });

    return { tableName: normalized.tableName, moduleConfig };
  });
}

module.exports = {
  createBusinessTable,
  normalizeDefinition,
  buildColumns,
  SUPPORTED_TYPES,
};
