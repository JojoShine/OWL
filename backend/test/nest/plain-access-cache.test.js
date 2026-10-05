jest.mock('../../dist/shared/config/redis', () => ({
  redisClient: { mGet: jest.fn() },
  isRedisAvailable: jest.fn(() => true),
}));
jest.mock('../../dist/shared/config/logger', () => ({
  logger: { error: jest.fn(), info: jest.fn() },
  operationLogger: { info: jest.fn() },
  databaseAccessLogger: { info: jest.fn() },
}));

const { redisClient, isRedisAvailable } = require('../../dist/shared/config/redis');
const service = new (require('../../dist/shared/utils/plain-access-cache'))();

describe('plain access batch checks', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deduplicates checks into one Redis mGet call', async () => {
    redisClient.mGet.mockResolvedValue([null, JSON.stringify({ expiresAt: 'later' })]);

    const result = await service.checkPlainAccessPermissions('u1', '*', [
      { fieldName: 'phone', recordId: 'r1' },
      { fieldName: 'phone', recordId: 'r1' },
      { fieldName: 'email', recordId: 'r2' },
    ]);

    expect(redisClient.mGet).toHaveBeenCalledTimes(1);
    expect(redisClient.mGet).toHaveBeenCalledWith([
      'plain_access:u1:*:phone:r1',
      'plain_access:u1:*:email:r2',
    ]);
    expect(result.has('phone:r1')).toBe(false);
    expect(result.has('email:r2')).toBe(true);
  });

  it('returns an empty set without Redis access when unavailable', async () => {
    isRedisAvailable.mockReturnValueOnce(false);
    await expect(service.checkPlainAccessPermissions('u1', '*', [
      { fieldName: 'phone', recordId: 'r1' },
    ])).resolves.toEqual(new Set());
    expect(redisClient.mGet).not.toHaveBeenCalled();
  });
});
