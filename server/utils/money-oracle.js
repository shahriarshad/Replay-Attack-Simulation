const crypto = require('crypto');

function payloadFingerprint(payload) {
  const stable = [
    payload.method, payload.path, payload.user_id, payload.account_id,
    payload.amount, payload.currency, payload.timestamp, payload.nonce,
    payload.request_id, payload.signature
  ].join('|');
  return crypto.createHash('sha256').update(stable).digest('hex');
}

function computeMoneyIntegrity(ledgerRows, authorizedIntents = []) {
  const authorized = new Map(authorizedIntents.map((intent) => [String(intent.request_id), {
    amount: Number(intent.amount), type: String(intent.type)
  }]));
  const debits = ledgerRows.filter((row) => row.status === 'SUCCESS' && row.type === 'WITHDRAW');
  const byRequestId = new Map();
  let unauthorizedDebitAmount = 0;
  let totalDebited = 0;
  for (const row of debits) {
    const amount = Number(row.amount);
    totalDebited += amount;
    const intent = authorized.get(String(row.request_id));
    if (!intent || intent.amount !== amount || intent.type !== 'WITHDRAW') unauthorizedDebitAmount += amount;
    const rows = byRequestId.get(String(row.request_id)) || [];
    rows.push(row);
    byRequestId.set(String(row.request_id), rows);
  }
  let duplicateDebitCount = 0;
  let duplicateDebitAmount = 0;
  let delayedExecutionCount = 0;
  let delayedExecutionAmount = 0;
  for (const rows of byRequestId.values()) {
    for (const duplicate of rows.slice(1)) {
      duplicateDebitCount += 1;
      duplicateDebitAmount += Number(duplicate.amount);
    }
  }
  const failedByRequestId = new Map();
  for (const row of ledgerRows) {
    if (row.status !== 'FAILED') continue;
    const key = String(row.request_id);
    const list = failedByRequestId.get(key) || [];
    list.push(Number(row.id ?? -Infinity));
    failedByRequestId.set(key, list);
  }
  for (const row of debits) {
    const failedIds = failedByRequestId.get(String(row.request_id)) || [];
    if (failedIds.some((id) => id < Number(row.id ?? Infinity))) {
      delayedExecutionCount += 1;
      delayedExecutionAmount += Number(row.amount);
    }
  }
  return {
    duplicate_debit_count: duplicateDebitCount,
    duplicate_debit_amount: duplicateDebitAmount,
    unauthorized_debit_amount: unauthorizedDebitAmount,
    delayed_execution_count: delayedExecutionCount,
    delayed_execution_amount: delayedExecutionAmount,
    total_debited: totalDebited,
    integrity_holds: duplicateDebitCount === 0 && unauthorizedDebitAmount === 0
  };
}

module.exports = { payloadFingerprint, computeMoneyIntegrity };
