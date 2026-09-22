const NONCE_TTL_SECONDS = 300;

function nonceKey(userId, nonce) {
  return `used_nonce:${userId}:${nonce}`;
}

async function verifyNonce(redisClient, userId, nonce) {
  const key = nonceKey(userId, nonce);
  const result = await redisClient.set(key, '1', {
    NX: true,
    EX: NONCE_TTL_SECONDS
  });

  return {
    valid: result === 'OK',
    key,
    redisResult: result === 'OK' ? 'SETNX_SUCCESS' : 'SETNX_FAILED'
  };
}

async function listNonceKeys(redisClient) {
  const keys = [];
  let cursor = 0;

  do {
    const reply = await redisClient.scan(cursor, {
      MATCH: 'used_nonce:*',
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
  NONCE_TTL_SECONDS,
  nonceKey,
  verifyNonce,
  listNonceKeys,
  clearNonceKeys
};
