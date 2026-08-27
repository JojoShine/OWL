const { createAsyncTtlCache } = require('./dataMasking.cache');

describe('data masking metadata cache', () => {
  it('reuses one in-flight and resolved load until invalidated', async () => {
    let resolveLoad;
    const loader = jest.fn(() => new Promise((resolve) => { resolveLoad = resolve; }));
    const cache = createAsyncTtlCache(loader, { ttlMs: 60_000 });

    const first = cache.get();
    const second = cache.get();
    expect(loader).toHaveBeenCalledTimes(1);

    resolveLoad([{ field_name: 'phone' }]);
    await expect(first).resolves.toEqual([{ field_name: 'phone' }]);
    await expect(second).resolves.toEqual([{ field_name: 'phone' }]);
    await cache.get();
    expect(loader).toHaveBeenCalledTimes(1);

    cache.invalidate();
    loader.mockResolvedValueOnce([{ field_name: 'email' }]);
    await expect(cache.get()).resolves.toEqual([{ field_name: 'email' }]);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not retain a rejected load', async () => {
    const loader = jest.fn()
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce([]);
    const cache = createAsyncTtlCache(loader, { ttlMs: 60_000 });

    await expect(cache.get()).rejects.toThrow('temporary');
    await expect(cache.get()).resolves.toEqual([]);
    expect(loader).toHaveBeenCalledTimes(2);
  });
});
