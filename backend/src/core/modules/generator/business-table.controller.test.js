jest.mock('./business-table.service', () => ({ createBusinessTable: jest.fn() }));

const businessTableService = require('./business-table.service');
const controller = require('./generator.controller');
const validation = require('./generator.validation');

describe('business table generator API', () => {
  it('creates a business table for the authenticated user', async () => {
    const result = { tableName: 'biz_customer', moduleConfig: { id: 'module-1' } };
    businessTableService.createBusinessTable.mockResolvedValue(result);
    const req = { body: { table_name: 'customer', fields: [] }, user: { id: 'user-1' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    const next = jest.fn();

    await controller.createBusinessTable(req, res, next);

    expect(businessTableService.createBusinessTable).toHaveBeenCalledWith(req.body, 'user-1');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, data: result }));
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects unsupported field types in the request schema', () => {
    const { error } = validation.createBusinessTable.body.validate({
      table_name: 'customer',
      fields: [{ name: 'payload', type: 'sql' }],
    });
    expect(error).toBeTruthy();
  });
});
