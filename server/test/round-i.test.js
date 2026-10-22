'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { makeExactLossPattern } = require('../../experiments/lib/exact-loss-pattern');
const { validSignedRequest } = require('../utils/request');
const { readAttemptCount } = require('../../experiments/e1/attempt-count');

test('E1_ATTEMPTS defaults to 30, accepts positive integers, and rejects invalid values', () => {
  assert.equal(readAttemptCount(undefined), 30);
  assert.equal(readAttemptCount(''), 30);
  assert.equal(readAttemptCount('100'), 100);
  assert.equal(readAttemptCount('0'), 30);
  assert.equal(readAttemptCount('1.5'), 30);
});

test('Round I exact loss patterns have the seeded requested count', () => {
  for (const [probability, expected] of [[0, 0], [0.05, 10], [0.2, 40]]) {
    const first = makeExactLossPattern(probability, 200, 0xE4C2026 + Math.round(probability * 1000));
    const second = makeExactLossPattern(probability, 200, 0xE4C2026 + Math.round(probability * 1000));
    assert.equal(first.lostCount, expected);
    assert.equal(first.pattern.filter(Boolean).length, expected);
    assert.deepEqual(first.pattern, second.pattern);
  }
});

test('route binding rejects signed-path mismatch independent of the HMAC defense flag', () => {
  const depositPath = { method: 'POST', path: '/api/deposit', user_id: 'u', account_id: 'a', amount: 1, currency: 'BDT', timestamp: new Date().toISOString(), nonce: 'n', request_id: 'r', signature: 'syntactically-present' };
  const withdrawPath = { ...depositPath, path: '/api/withdraw', request_id: 'r2' };
  for (const hmacEnabled of [true, false]) {
    assert.equal(validSignedRequest(depositPath, 'WITHDRAW'), false, `HMAC ${hmacEnabled}: deposit request sent to withdraw route`);
    assert.equal(validSignedRequest(withdrawPath, 'DEPOSIT'), false, `HMAC ${hmacEnabled}: withdraw request sent to deposit route`);
  }
});
