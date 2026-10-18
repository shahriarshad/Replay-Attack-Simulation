const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { timedRequest } = require('./lib/http');

const root = path.resolve(__dirname, '..');
const runTag = new Date().toISOString().replace(/[:.]/g, '-');
const output = path.join(__dirname, 'results', 'phase4-source-fixes', `race-session-final-${runTag}`);
const serverOutput = path.join(output, 'server.stdout.log');
const serverError = path.join(output, 'server.stderr.log');
fs.mkdirSync(output, { recursive: true });

function spawnLogged(script, cwd, env, stdoutPath, stderrPath) {
  const stdout = fs.openSync(stdoutPath, 'a');
  const stderr = fs.openSync(stderrPath, 'a');
  const child = spawn(process.execPath, [script], { cwd, env, stdio: ['ignore', stdout, stderr], windowsHide: true });
  child.once('exit', () => { fs.closeSync(stdout); fs.closeSync(stderr); });
  return child;
}
function waitExit(child) {
  return new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
}
async function stop(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([waitExit(child), new Promise((resolve) => setTimeout(resolve, 2000))]);
  if (child.exitCode === null && child.pid && process.platform === 'win32') {
    await new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
      killer.once('exit', resolve);
    });
  }
}
async function waitHealth(child, port) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Measured server exited early; inspect ${serverError}`);
    try {
      const response = await timedRequest(`http://127.0.0.1:${port}/api/health`);
      if (response.status === 200) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Measured server health timed out; inspect ${serverError}`);
}

async function main() {
  const port = 3110;
  const database = path.join(output, 'race-session.sqlite');
  const baseEnvironment = {
    ...process.env,
    PORT: String(port), HOST: '127.0.0.1', VIZ_PORT: '3111', VIZ_ENABLED: 'false', DEMO_MODE: 'false',
    LEGACY_SHARED_SECRET: 'false', ENABLE_DEMO_ROUTES: 'true',
    DEFENSE_HMAC: 'true', DEFENSE_TIMESTAMP: 'true', DEFENSE_NONCE: 'true', DEFENSE_REQUEST_ID: 'true',
    CHECK_ORDER: 'hmac,timestamp,nonce,request_id,balance',
    TIMESTAMP_PAST_WINDOW_SECONDS: '300', TIMESTAMP_FUTURE_WINDOW_SECONDS: '5',
    NONCE_BACKEND: 'redis', NONCE_TTL: '3600', NONCE_STORE_FAIL_MODE: 'fail-closed',
    NONCE_KEY_NAMESPACE: `f1-race-${runTag}`, REDIS_URL: 'redis://127.0.0.1:6379',
    SESSION_TTL: '3600', SQLITE_DB: database, EXPERIMENT_LOG: path.join(output, 'server-timings.csv'),
    CONFIG_ID: 'F1-session-all-defenses', SCENARIO_ID: 'race', RUN_ID: runTag
  };
  const server = spawnLogged('server.js', path.join(root, 'server'), baseEnvironment, serverOutput, serverError);
  try {
    await waitHealth(server, port);
    const raceEnvironment = {
      ...baseEnvironment, EXPERIMENT_API: `http://127.0.0.1:${port}`, RACE_DB_PATH: database,
      RACE_BATCHES: '1000', RACE_OUTPUT: output
    };
    const runner = spawnLogged('run-races.js', __dirname, raceEnvironment, path.join(output, 'race-runner.stdout.log'), path.join(output, 'race-runner.stderr.log'));
    const result = await waitExit(runner);
    if (result.code !== 0) throw new Error(`Race runner failed with exit ${result.code} (${result.signal || 'no signal'}); inspect ${output}`);
    process.stdout.write(`Session-mode F1 races completed. Raw output: ${output}\n`);
  } finally {
    await stop(server);
  }
}

main().catch((error) => { process.stderr.write(`${error.stack || error.message}\n`); process.exitCode = 1; });
