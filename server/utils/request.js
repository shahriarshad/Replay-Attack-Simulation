function validSignedRequest(payload, type) {
  if (!payload || typeof payload !== 'object') return false;
  const fields = ['method', 'path', 'user_id', 'account_id', 'currency', 'timestamp', 'nonce', 'request_id'];
  if (fields.some((field) => typeof payload[field] !== 'string' || /[|\x00-\x1f\x7f]/.test(payload[field]))) return false;
  return payload.method === 'POST'
    && payload.path === `/api/${type.toLowerCase()}`
    && payload.user_id.length > 0
    && payload.account_id.length > 0
    && payload.currency.length > 0
    && payload.nonce.length > 0
    && payload.request_id.length > 0
    && Number.isSafeInteger(payload.amount)
    && payload.amount > 0
    && Number.isFinite(Date.parse(payload.timestamp));
}

module.exports = { validSignedRequest };
