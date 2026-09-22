const CryptoJS = require('crypto-js');

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
  return CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);
}

function verifySignature(payload, secret) {
  const expected = generateSignature(payload, secret);
  const received = payload.signature || '';
  return {
    valid: expected === received,
    expected,
    received
  };
}

module.exports = {
  buildHmacMessage,
  generateSignature,
  verifySignature
};
