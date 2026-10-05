const { MaskingService } = require('../../dist/nest/data-security/masking.service');
const { createDataMasking } = require('../../dist/shared/http/dataMasking');
function respond(middleware, data, user = { id: 'viewer' }) {
  return new Promise(resolve => {
    const res = { json: resolve };
    middleware({ user, path: '/records' }, res, () => res.json({ success: true, data }));
  });
}
it('masks Prisma results and reloads configuration after invalidation', async () => {
  const fields = jest.fn().mockResolvedValue([{ field_name: 'phone', mask_type: 'phone', mask_rule: null }]);
  const masking = new MaskingService({ owl_sensitive_fields: { findMany: fields } });
  const data = { id: 'record', phone: '13812345678' };
  expect((await respond(masking.middleware, data)).data.phone).not.toBe(data.phone);
  expect((await respond(masking.middleware, { items: [data], total: 1 })).data.items[0].phone).not.toBe(data.phone);
  expect(fields).toHaveBeenCalledTimes(1);
  expect(fields).toHaveBeenCalledWith(expect.objectContaining({ where: { deletedAt: null, is_active: true } }));
  fields.mockResolvedValue([]); masking.invalidate();
  expect((await respond(masking.middleware, data)).data.phone).toBe(data.phone);
  expect(fields).toHaveBeenCalledTimes(2);
});
it('applies plain access only to granted records and bypasses public responses', async () => {
  const grants = { checkPlainAccessPermissions: jest.fn().mockResolvedValue(new Set(['phone:allowed'])) };
  const loadFields = jest.fn().mockResolvedValue([{ field_name: 'phone', mask_type: 'phone' }]);
  const middleware = createDataMasking({ loadFields, plainAccessService: grants })();
  const rows = [{ id: 'allowed', phone: '13812345678' }, { id: 'denied', phone: '13812345678' }];
  const { data } = await respond(middleware, rows);
  expect(data[0].phone).toBe(rows[0].phone); expect(data[1].phone).not.toBe(rows[1].phone);
  expect((await respond(middleware, rows, null)).data).toEqual(rows);
  expect(grants.checkPlainAccessPermissions).toHaveBeenCalledTimes(1);
});
