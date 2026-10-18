const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('child_process');
const path = require('path');

test('demo reset and nonce-crash routes are absent when ENABLE_DEMO_ROUTES=false', () => {
  const code = `const {app,db}=require('./core'); const paths=app._router.stack.filter(x=>x.route).map(x=>x.route.path); const ok=!paths.includes('/api/reset')&&!paths.includes('/api/demo/nonce-crash'); db.close(()=>process.exit(ok?0:1));`;
  const result = spawnSync(process.execPath, ['-e', code], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, ENABLE_DEMO_ROUTES: 'false', SQLITE_DB: path.join(require('os').tmpdir(), `route-gating-${process.pid}.sqlite`) }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('test fault route is absent unless ENABLE_TEST_FAULT_ROUTE=true', () => {
  const code = `const {app,db}=require('./core'); const paths=app._router.stack.filter(x=>x.route).map(x=>x.route.path); const ok=!paths.includes('/__test/fault/nonce-store')&&!paths.includes('/__test/profile/flush'); db.close(()=>process.exit(ok?0:1));`;
  const result = spawnSync(process.execPath, ['-e', code], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, ENABLE_TEST_FAULT_ROUTE: 'false', SQLITE_DB: path.join(require('os').tmpdir(), `route-fault-gating-${process.pid}.sqlite`) }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});

test('event-loop profile flush route requires both the test route and profile flags', () => {
  const code = `const {app,db}=require('./core'); const paths=app._router.stack.filter(x=>x.route).map(x=>x.route.path); const ok=paths.includes('/__test/profile/flush'); db.close(()=>process.exit(ok?0:1));`;
  const result = spawnSync(process.execPath, ['-e', code], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, ENABLE_TEST_FAULT_ROUTE: 'true', EXPERIMENT_PROFILE: 'true', SQLITE_DB: path.join(require('os').tmpdir(), `route-profile-gating-${process.pid}.sqlite`) }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
