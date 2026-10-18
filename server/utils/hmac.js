const crypto = require('crypto');

function buildHmacMessage(payload) {
  return [
    payload.method,
    payload.path,
    payload.user_id,
    payload.account_id,
    payload.amount,
    payload.currency,
    payload.timestamp,
    payload.nonce,
    payload.request_id
  ].join('|');
}

function generateSignature(payload, secret) {
  const message = buildHmacMessage(payload);
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

function verifySignature(payload, secret) {
  const expected = generateSignature(payload, secret);
  const received = payload.signature || '';
  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = /^[0-9a-f]{64}$/i.test(received) ? Buffer.from(received, 'hex') : Buffer.alloc(0);
  return {
    valid: expectedBuffer.length === receivedBuffer.length && crypto.timingSafeEqual(expectedBuffer, receivedBuffer),
    expected,
    received
  };
}

module.exports = {
  buildHmacMessage,
  generateSignature,
  verifySignature
};
