const { createAsyncKeyedCache } = require('./auth-user-cache');

describe('authenticated user cache', () => {
  it('coalesces repeated loads per user and supports invalidation', async () => {
    const loader = jest.fn().mockResolvedValue({ id: 'u1', status: 'active' });
    const cache = createAsyncKeyedCache({ ttlMs: 60_000, maxEntries: 10 });

    const [first, second] = await Promise.all([
      cache.get('u1', loader),
      cache.get('u1', loader),
    ]);
    expect(first).toEqual(second);
    expect(loader).toHaveBeenCalledTimes(1);

    cache.invalidate('u1');
    await cache.get('u1', loader);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('evicts the oldest entry when bounded capacity is reached', async () => {
    const cache = createAsyncKeyedCache({ ttlMs: 60_000, maxEntries: 2 });
    const loader = jest.fn((id) => Promise.resolve({ id }));
    await cache.get('u1', () => loader('u1'));
    await cache.get('u2', () => loader('u2'));
    await cache.get('u3', () => loader('u3'));
    await cache.get('u1', () => loader('u1'));
    expect(loader).toHaveBeenCalledTimes(4);
  });
});
