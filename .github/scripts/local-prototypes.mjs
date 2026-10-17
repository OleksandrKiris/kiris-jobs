import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Explicit ownership boundary: never discover arbitrary folders or user data.
export const MODULES = Object.freeze([
  { id: 'coordinator', path: 'coordinator-demo', owner: 9 },
  { id: 'shift-duration', path: 'offline-tools/shift-duration', owner: 11 }
]);
const inside = (root, target) => {
  const rel = relative(root, target);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
};
function checkedPath(root, path) {
  const absolute = join(root, path);
  assert.ok(inside(root, realpathSync(absolute)), `Path escapes checkout: ${path}`);
  for (let current = absolute; current !== root; current = dirname(current)) {
    assert.equal(lstatSync(current).isSymbolicLink(), false, `Symlink not accepted: ${path}`);
  }
  return absolute;
}
export function modules(root) {
  root = realpathSync(root);
  return MODULES.filter(module => existsSync(join(root, module.path))).map(module => {
    const dir = checkedPath(root, module.path);
    assert.ok(lstatSync(dir).isDirectory(), `Not a module directory: ${module.path}`);
    return module;
  });
}
export function run(root, phase, env = process.env, execute = execFileSync) {
  root = realpathSync(root);
  assert.ok(['unit', 'browser'].includes(phase), 'Phase must be unit or browser');
  const selected = modules(root);
  const results = [];
  if (phase === 'browser') {
    assert.equal(env.GITHUB_ACTIONS, 'true', 'Browser phase is CI-only; no local preview/browser launch');
    for (const key of ['TESTED_HEAD', 'TESTED_BASE']) assert.match(env[key] || '', /^[0-9a-f]{40}$/, key);
    assert.ok(env.PLAYWRIGHT_PACKAGE && env.PROTOTYPE_REPORT_ROOT, 'Existing browser package and separate report root required');
    const reportRoot = resolve(env.PROTOTYPE_REPORT_ROOT);
    mkdirSync(reportRoot, { recursive: true });
    assert.equal(inside(root, realpathSync(reportRoot)), false, 'Evidence must remain outside checkout/Pages');
  }
  let failure;
  try {
    for (const module of selected) {
      const script = `${module.path}/${phase === 'unit' ? 'test.cjs' : 'browser-acceptance.mjs'}`;
      assert.ok(existsSync(join(root, script)), `Owner ${module.owner}: missing ${script}; acceptance is NOT complete`);
      checkedPath(root, script);
      const reportDir = phase === 'browser' ? join(resolve(env.PROTOTYPE_REPORT_ROOT), module.id) : null;
      const args = phase === 'unit' ? ['--test', script] : [script];
      execute(process.execPath, args, { cwd: root, stdio: 'inherit', timeout: phase === 'unit' ? 120000 : 240000,
        env: { ...env, ...(reportDir ? { BROWSER_REPORT: reportDir } : {}) } });
      if (reportDir) {
        const evidence = JSON.parse(readFileSync(join(reportDir, 'acceptance.json'), 'utf8'));
        assert.equal(evidence.status, 'passed', `${module.id}: browser evidence must pass`);
        assert.equal(evidence.head, env.TESTED_HEAD, `${module.id}: stale head`);
        assert.equal(evidence.base, env.TESTED_BASE, `${module.id}: stale base`);
        assert.ok(typeof evidence.browser === 'string' && evidence.browser.length, 'Browser version required');
        assert.ok(Array.isArray(evidence.scenarios) && evidence.scenarios.length &&
          evidence.scenarios.every(row => row.status === 'passed'), 'Named passing scenarios required');
        assert.ok(Array.isArray(evidence.resources) && evidence.resources.length &&
          evidence.resources.every(row => typeof row.path === 'string' && /^[0-9a-f]{64}$/.test(row.sha256)), 'Exact runtime hashes required');
      }
      results.push({ ...module, phase, status: 'passed' });
    }
  } catch (error) { failure = error; }
  const summary = { phase, head: env.TESTED_HEAD || null, base: env.TESTED_BASE || null,
    status: failure ? 'failed' : selected.length ? 'passed' : 'not-applicable',
    modules: results, expected: selected.map(module => module.id), error: failure?.message || null };
  if (phase === 'browser') writeFileSync(join(resolve(env.PROTOTYPE_REPORT_ROOT), 'summary.json'), JSON.stringify(summary, null, 2));
  if (failure) throw failure;
  return summary;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(run(resolve(dirname(fileURLToPath(import.meta.url)), '../..'), process.argv[2]), null, 2));
}
