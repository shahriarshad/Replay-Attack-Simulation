function readAttemptCount(value = process.env.E1_ATTEMPTS) {
  if (value === undefined || value === '') return 30;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 30;
}

module.exports = { readAttemptCount };
