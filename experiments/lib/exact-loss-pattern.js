'use strict';
function makeExactLossPattern(probability, trials = 200, seed = 0xE4C2026) {
  if (!(probability >= 0 && probability <= 1)) throw new RangeError('probability must be within [0,1]');
  if (!Number.isSafeInteger(trials) || trials <= 0) throw new RangeError('trials must be a positive safe integer');
  let state = seed >>> 0;
  const indices = Array.from({ length: trials }, (_, i) => i);
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 0x100000000; };
  for (let i = indices.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const lostCount = Math.round(probability * trials);
  const pattern = Array(trials).fill(false);
  for (const index of indices.slice(0, lostCount)) pattern[index] = true;
  return { pattern, seed: seed >>> 0, lostCount, algorithm: 'seeded Fisher-Yates exact-count' };
}
module.exports = { makeExactLossPattern };
