function getStartupWarnings({ nonceTtl, pastWindow, futureWindow, host, enableDemoRoutes }) {
  const warnings = [];
  if (Number(nonceTtl) < Number(pastWindow) + Number(futureWindow)) {
    warnings.push(`NONCE_TTL (${nonceTtl}s) is shorter than the combined timestamp window (${Number(pastWindow) + Number(futureWindow)}s).`);
  }
  if (host === '0.0.0.0' && enableDemoRoutes) {
    warnings.push('ENABLE_DEMO_ROUTES is enabled while HOST=0.0.0.0; demo reset/crash routes are exposed on all interfaces.');
  }
  return warnings;
}

module.exports = { getStartupWarnings };
