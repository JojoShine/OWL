function createAsyncTtlCache(loader, { ttlMs = 30_000, now = Date.now } = {}) {
  let value;
  let expiresAt = 0;
  let inFlight = null;

  const get = async () => {
    if (value !== undefined && now() < expiresAt) return value;
    if (inFlight) return inFlight;

    inFlight = Promise.resolve(loader())
      .then((nextValue) => {
        value = nextValue;
        expiresAt = now() + ttlMs;
        return value;
      })
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };

  const invalidate = () => {
    value = undefined;
    expiresAt = 0;
  };

  return { get, invalidate };
}

module.exports = { createAsyncTtlCache };
