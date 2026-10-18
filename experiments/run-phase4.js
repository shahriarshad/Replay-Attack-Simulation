const { spawnSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const steps = [
  [process.execPath, ['experiments/e1/run.js']],
  [process.execPath, ['experiments/e1/finalize-oracle-summary.js']],
  [process.execPath, ['experiments/e2/run.js']],
  ['python', ['experiments/render-pack-a.py']],
  [process.execPath, ['experiments/write-results-pack.js']]
];

for (const [command, args] of steps) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
