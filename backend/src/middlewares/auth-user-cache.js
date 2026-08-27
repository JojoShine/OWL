function createAsyncKeyedCache({ ttlMs = 5_000, maxEntries = 500, now = Date.now } = {}) {
  const entries = new Map();

  const prune = () => {
    while (entries.size > maxEntries) {
      entries.delete(entries.keys().next().value);
    }
  };

  const get = async (key, loader) => {
    const cached = entries.get(key);
    if (cached && cached.expiresAt > now()) return cached.promise;
    if (cached) entries.delete(key);

    const promise = Promise.resolve(loader()).catch((error) => {
      if (entries.get(key)?.promise === promise) entries.delete(key);
      throw error;
    });
    entries.set(key, { promise, expiresAt: now() + ttlMs });
    prune();
    return promise;
  };

  const invalidate = (key) => entries.delete(key);
  const clear = () => entries.clear();

  return { get, invalidate, clear };
}

const authenticatedUserCache = createAsyncKeyedCache({
  ttlMs: Number(process.env.AUTH_USER_CACHE_TTL_MS) || 5_000,
  maxEntries: Number(process.env.AUTH_USER_CACHE_MAX_ENTRIES) || 500,
});

module.exports = { createAsyncKeyedCache, authenticatedUserCache };
