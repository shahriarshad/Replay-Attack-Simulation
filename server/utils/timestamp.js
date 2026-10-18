function isTimestampWithinWindow(timestamp, checkedAtMs, pastWindowSeconds, futureWindowSeconds) {
  const timestampMs = Date.parse(timestamp);
  if (!Number.isFinite(timestampMs)) return false;
  const ageSeconds = (checkedAtMs - timestampMs) / 1000;
  return ageSeconds >= -futureWindowSeconds && ageSeconds <= pastWindowSeconds;
}

module.exports = { isTimestampWithinWindow };
