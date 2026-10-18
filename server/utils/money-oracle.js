const crypto = require('crypto');

function payloadFingerprint(payload) {
  const stable = [
    payload.method, payload.path, payload.user_id, payload.account_id,
    payload.amount, payload.currency, payload.timestamp, payload.nonce,
    payload.request_id, payload.signature
  ].join('|');
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function computeMoneyIntegrity(transactions, authorizedPayloads = []) {
  const withdrawals = transactions.filter((row) => row.type === 'WITHDRAW' && row.status === 'SUCCESS');
  const totalDebited = withdrawals.reduce((sum, row) => sum + Number(row.amount), 0);
  const authorizedByFingerprint = new Map();
  for (const payload of authorizedPayloads) authorizedByFingerprint.set(payloadFingerprint(payload), Number(payload.amount));
  const authorizedTotal = [...authorizedByFingerprint.values()].reduce((sum, amount) => sum + amount, 0);
  const counts = new Map();
  const firstAmounts = new Map();
  for (const row of withdrawals) {
    const identity = row.payload_fingerprint || row.signature || `${row.user_id}|${row.request_id}|${row.amount}`;
    counts.set(identity, (counts.get(identity) || 0) + 1);
    firstAmounts.set(identity, Number(row.amount));
  }
  const duplicateDebitCount = [...counts.values()].reduce((sum, count) => sum + Math.max(0, count - 1), 0);
  const duplicateDebitAmount = [...counts.entries()].reduce((sum, [identity, count]) => sum + Math.max(0, count - 1) * firstAmounts.get(identity), 0);
  return {
    totalDebited,
    authorizedTotal,
    duplicateDebitAmount,
    duplicateDebitCount,
    integrityHolds: totalDebited <= authorizedTotal && duplicateDebitCount === 0
  };
}

module.exports = { payloadFingerprint, computeMoneyIntegrity };
