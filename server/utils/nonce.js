const DEFAULT_NONCE_TTL_SECONDS = 300;

function nonceKey(userId, nonce) {
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  return namespace ? `used_nonce:${namespace}:${userId}:${nonce}` : `used_nonce:${userId}:${nonce}`;
}

function sqliteRun(db, sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (error) {
    if (error) return reject(error);
    resolve(this);
  }));
}

function sqliteGet(db, sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (error, row) => {
    if (error) return reject(error);
    resolve(row || null);
  }));
}

async function verifyNonce(store, userId, nonce, options = {}) {
  const backend = options.backend || 'redis';
  const ttlSeconds = Number(options.ttlSeconds || process.env.NONCE_TTL || DEFAULT_NONCE_TTL_SECONDS);
  const key = nonceKey(userId, nonce);
  let valid;
  let result;

  if (backend === 'redis') {
    const redisResult = await store.set(key, '1', { NX: true, EX: ttlSeconds });
    valid = redisResult === 'OK';
    result = valid ? 'SETNX_SUCCESS' : 'SETNX_FAILED';
  } else if (backend === 'sqlite') {
    await sqliteRun(store, 'DELETE FROM used_nonces WHERE expires_at <= ?', [Date.now()]);
    try {
      await sqliteRun(store, 'INSERT INTO used_nonces (user_id, nonce, expires_at) VALUES (?, ?, ?)', [userId, nonce, Date.now() + ttlSeconds * 1000]);
      valid = true;
    } catch (error) {
      if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) valid = false;
      else throw error;
    }
    result = valid ? 'SQLITE_INSERT_SUCCESS' : 'SQLITE_DUPLICATE';
  } else if (backend === 'memory') {
    const now = Date.now();
    for (const [entry, expiresAt] of store) if (expiresAt <= now) store.delete(entry);
    const memKey = `${process.env.NONCE_KEY_NAMESPACE || ''}\u0000${userId}\u0000${nonce}`;
    valid = !store.has(memKey);
    if (valid) store.set(memKey, now + ttlSeconds * 1000);
    result = valid ? 'MEMORY_INSERT_SUCCESS' : 'MEMORY_DUPLICATE';
  } else {
    throw new Error(`Unsupported nonce backend: ${backend}`);
  }

  return {
    valid,
    key,
    redisResult: result
  };
}

async function verifyNonceResilient(store, userId, nonce, options = {}) {
  try {
    return await verifyNonce(store, userId, nonce, options);
  } catch (error) {
    if ((options.failMode || 'fail-closed') === 'fail-open') return { valid: true, redisResult: 'STORE_ERROR_FAIL_OPEN', error };
    return { valid: false, redisResult: 'STORE_ERROR_FAIL_CLOSED', error };
  }
}

async function listNonceKeys(redisClient) {
  const keys = [];
  let cursor = 0;
  const namespace = process.env.NONCE_KEY_NAMESPACE;
  const pattern = namespace ? `used_nonce:${namespace}:*` : 'used_nonce:*';

  do {
    const reply = await redisClient.scan(cursor, {
      MATCH: pattern,
      COUNT: 100
    });
    cursor = Number(reply.cursor);
    keys.push(...reply.keys);
  } while (cursor !== 0);

  return keys.sort();
}

async function clearNonceKeys(redisClient) {
  const keys = await listNonceKeys(redisClient);
  if (keys.length > 0) {
    await redisClient.del(keys);
  }
  return keys;
}

module.exports = {
  NONCE_TTL_SECONDS: Number(process.env.NONCE_TTL || DEFAULT_NONCE_TTL_SECONDS),
  DEFAULT_NONCE_TTL_SECONDS,
  nonceKey,
  verifyNonce,
  verifyNonceResilient,
  sqliteRun,
  sqliteGet,
  listNonceKeys,
  clearNonceKeys
};
