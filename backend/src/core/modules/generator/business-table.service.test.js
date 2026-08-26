jest.mock('../../../models', () => ({
  sequelize: {
    transaction: jest.fn(),
    getQueryInterface: jest.fn(),
  },
}));
jest.mock('./db-reader.service', () => ({ tableExists: jest.fn() }));
jest.mock('./module-config.service', () => ({ initializeModuleConfig: jest.fn() }));

const db = require('../../../models');
const dbReaderService = require('./db-reader.service');
const moduleConfigService = require('./module-config.service');
const service = require('./business-table.service');

const validFields = [{ name: 'customer_name', type: 'string', nullable: false }];

describe('businessTableService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes the required biz_ prefix', () => {
    expect(service.normalizeDefinition({ table_name: 'customer', fields: validFields }).tableName)
      .toBe('biz_customer');
  });

  it.each([
    [{ table_name: 'biz_customer', fields: validFields }, 'biz_ 后面的名称'],
    [{ table_name: 'customer', fields: [{ name: 'created_at', type: 'string' }] }, '系统字段'],
    [{ table_name: 'customer', fields: [{ name: 'payload', type: 'sql' }] }, '字段类型'],
    [{ table_name: 'customer', fields: [...validFields, ...validFields] }, '重复'],
  ])('rejects an unsafe definition', (definition, message) => {
    expect(() => service.normalizeDefinition(definition)).toThrow(message);
  });

  it('creates the table and configuration on the same transaction', async () => {
    const transaction = { id: 'tx' };
    const queryInterface = {
      createTable: jest.fn().mockResolvedValue(undefined),
      addConstraint: jest.fn().mockResolvedValue(undefined),
      addIndex: jest.fn().mockResolvedValue(undefined),
    };
    db.sequelize.transaction.mockImplementation((callback) => callback(transaction));
    db.sequelize.getQueryInterface.mockReturnValue(queryInterface);
    dbReaderService.tableExists.mockResolvedValue(false);
    moduleConfigService.initializeModuleConfig.mockResolvedValue({ id: 'module-1', fields: [] });

    const result = await service.createBusinessTable({
      table_name: 'customer',
      fields: [{ ...validFields[0], unique: true }],
    }, 'user-1');

    expect(dbReaderService.tableExists).toHaveBeenCalledWith('biz_customer', { transaction });
    expect(queryInterface.createTable).toHaveBeenCalledWith(
      'biz_customer',
      expect.objectContaining({ id: expect.any(Object), customer_name: expect.any(Object), deleted_at: expect.any(Object) }),
      expect.objectContaining({ transaction })
    );
    expect(queryInterface.addConstraint).toHaveBeenCalledWith(
      'biz_customer',
      expect.objectContaining({ fields: ['customer_name'], type: 'unique', transaction })
    );
    expect(moduleConfigService.initializeModuleConfig).toHaveBeenCalledWith(
      'biz_customer',
      { transaction, userId: 'user-1' }
    );
    expect(result.tableName).toBe('biz_customer');
  });

  it('rejects an existing business table without creating anything', async () => {
    const transaction = { id: 'tx' };
    const queryInterface = { createTable: jest.fn() };
    db.sequelize.transaction.mockImplementation((callback) => callback(transaction));
    db.sequelize.getQueryInterface.mockReturnValue(queryInterface);
    dbReaderService.tableExists.mockResolvedValue(true);

    await expect(service.createBusinessTable({ table_name: 'customer', fields: validFields }, 'user-1'))
      .rejects.toMatchObject({ statusCode: 409 });
    expect(queryInterface.createTable).not.toHaveBeenCalled();
  });
});
