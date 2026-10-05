const { SystemConfigService } = require('../../dist/nest/system-config/system-config.service');
const { success } = require('../../dist/nest/response');

describe('Prisma system config compatibility', () => {
  const row = { id: 1n, system_name: 'OWL', createdAt: new Date('2026-01-01'), updatedAt: new Date('2026-01-01'), deletedAt: null };
  let prisma;
  let service;
  beforeEach(() => {
    prisma = { owl_system_configs: { findFirst: jest.fn().mockResolvedValue(row), create: jest.fn().mockResolvedValue(row), update: jest.fn().mockImplementation(async ({ data }) => ({ ...row, ...data })) } };
    service = new SystemConfigService(prisma);
  });
  it('reads the live singleton and preserves PostgreSQL BIGINT and timestamp response types', async () => {
    const result = success(await service.getConfig(), '获取系统配置成功');
    expect(prisma.owl_system_configs.findFirst).toHaveBeenCalledWith({ where: { id: 1n, deletedAt: null } });
    expect(result.data.id).toBe('1');
    expect(result.data.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
  it('creates defaults only if the config is missing', async () => {
    prisma.owl_system_configs.findFirst.mockResolvedValueOnce(null);
    await service.getConfig();
    expect(prisma.owl_system_configs.create).toHaveBeenCalledWith({ data: expect.objectContaining({ id: 1n, company_name: 'Owl Platform' }) });
  });
  it('keeps editable fields but rejects metadata replacement and refreshes updatedAt', async () => {
    await service.updateConfig({ id: 99, system_name: '新版', deletedAt: new Date(), unknown: true }, 'user-id');
    expect(prisma.owl_system_configs.update).toHaveBeenCalledWith({ where: { id: 1n }, data: { system_name: '新版', created_by: 'user-id', updatedAt: expect.any(Date) } });
  });
  it('rejects malformed settings and invalid enum values', async () => {
    for (const body of [null, [], 'bad', { theme_mode: 'invalid' }, { enable_theme_switch: 'false' }]) {
      await expect(service.updateConfig(body, 'user-id')).rejects.toMatchObject({ status: 400 });
    }
    expect(prisma.owl_system_configs.update).not.toHaveBeenCalled();
  });
});
