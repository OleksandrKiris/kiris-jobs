import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix, win32 } from 'node:path';
import { inside, modules, run } from './local-prototypes.mjs';

for (const [name, api, root] of [['Windows', win32, 'C:\\fixture\\checkout'], ['POSIX', posix, '/fixture/checkout']]) {
  test(`${name} containment rejects parents and siblings without rejecting children`, () => {
    assert.equal(inside(root, root, api), true);
    assert.equal(inside(root, api.join(root, 'report'), api), true);
    assert.equal(inside(root, api.join(root, '..notes', 'report'), api), true);
    assert.equal(inside(root, api.dirname(root), api), false);
    assert.equal(inside(root, api.join(api.dirname(root), 'evidence'), api), false);
    assert.equal(inside(root, `${root}-other`, api), false);
  });
}
test('Windows containment rejects another drive and UNC share', () => {
  assert.equal(inside('C:\\fixture\\checkout', 'D:\\evidence', win32), false);
  assert.equal(inside('\\\\server\\share\\checkout', '\\\\server\\other\\evidence', win32), false);
});

function fixture(t) {
  const temp = mkdtempSync(join(tmpdir(), 'primserv-ci-fixture-'));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const root = join(temp, 'checkout'); mkdirSync(root);
  const write = (path, value = '// fixture') => { const full = join(root, path); mkdirSync(dirname(full), { recursive: true }); writeFileSync(full, value); };
  const env = { GITHUB_ACTIONS: 'true', TESTED_HEAD: 'a'.repeat(40), TESTED_BASE: 'b'.repeat(40),
    PLAYWRIGHT_PACKAGE: '/existing/fixture-package', PROTOTYPE_REPORT_ROOT: join(temp, 'evidence') };
  return { root, temp, write, env };
}
test('absent prototypes are not-applicable, not invented browser acceptance', t => {
  const f = fixture(t); f.write('unrelated/private.txt');
  assert.deepEqual(modules(f.root), []);
  assert.equal(run(f.root, 'unit', {}, () => assert.fail('must not execute')).status, 'not-applicable');
  assert.equal(run(f.root, 'browser', f.env, () => assert.fail('must not execute')).status, 'not-applicable');
});
test('only registered modules execute their own unit tests in order', t => {
  const f = fixture(t); f.write('coordinator-demo/test.cjs'); f.write('offline-tools/shift-duration/test.cjs');
  const calls = []; const result = run(f.root, 'unit', {}, (_cmd, args, options) => calls.push({ args, cwd: options.cwd }));
  assert.deepEqual(calls.map(c => c.args), [['--test', 'coordinator-demo/test.cjs'], ['--test', 'offline-tools/shift-duration/test.cjs']]);
  assert.ok(calls.every(c => c.cwd === f.root)); assert.equal(result.modules.length, 2);
});
for (const phase of ['unit', 'browser']) test(`existing module without ${phase} script fails explicitly`, t => {
  const f = fixture(t); f.write('coordinator-demo/index.html');
  assert.throws(() => run(f.root, phase, f.env), /Owner 9: missing/);
});
test('nonzero tests abort and do not run the next module', t => {
  const f = fixture(t); f.write('coordinator-demo/test.cjs'); f.write('offline-tools/shift-duration/test.cjs'); let count = 0;
  assert.throws(() => run(f.root, 'unit', {}, () => { count++; throw Error('test failed'); }), /test failed/);
  assert.equal(count, 1);
});
test('browser cannot run locally or without exact head/base', t => {
  const f = fixture(t);
  assert.throws(() => run(f.root, 'browser', { ...f.env, GITHUB_ACTIONS: 'false' }), /CI-only/);
  assert.throws(() => run(f.root, 'browser', { ...f.env, TESTED_HEAD: 'main' }), /TESTED_HEAD/);
});
test('symlinked modules and scripts are rejected', t => {
  const f = fixture(t); const target = join(f.temp, 'outside'); mkdirSync(target);
  symlinkSync(target, join(f.root, 'coordinator-demo'));
  assert.throws(() => modules(f.root), /escapes|Symlink/);
  rmSync(join(f.root, 'coordinator-demo')); f.write('coordinator-demo/index.html');
  f.write('outside-test.cjs'); symlinkSync(join(f.root, 'outside-test.cjs'), join(f.root, 'coordinator-demo/test.cjs'));
  assert.throws(() => run(f.root, 'unit'), /Symlink/);
});
test('reports cannot enter checkout or Pages payload', t => {
  const f = fixture(t);
  assert.throws(() => run(f.root, 'browser', { ...f.env, PROTOTYPE_REPORT_ROOT: join(f.root, 'report') }), /outside checkout/);
});
for (const mode of ['valid', 'stale', 'failed', 'missing']) test(`browser evidence ${mode}`, t => {
  const f = fixture(t); f.write('offline-tools/shift-duration/browser-acceptance.mjs');
  const execute = (_cmd, args, options) => {
    assert.deepEqual(args, ['offline-tools/shift-duration/browser-acceptance.mjs']);
    assert.equal(options.env.PLAYWRIGHT_PACKAGE, f.env.PLAYWRIGHT_PACKAGE);
    if (mode === 'missing') return;
    mkdirSync(options.env.BROWSER_REPORT, { recursive: true });
    writeFileSync(join(options.env.BROWSER_REPORT, 'acceptance.json'), JSON.stringify({
      status: mode === 'failed' ? 'failed' : 'passed', head: mode === 'stale' ? 'c'.repeat(40) : f.env.TESTED_HEAD,
      base: f.env.TESTED_BASE, browser: 'Fixture, not real browser evidence',
      scenarios: [{ name: 'fixture', status: 'passed' }], resources: [{ path: 'fixture.html', sha256: 'd'.repeat(64) }]
    }));
  };
  if (mode === 'valid') assert.equal(run(f.root, 'browser', f.env, execute).status, 'passed');
  else assert.throws(() => run(f.root, 'browser', f.env, execute));
  const summary = JSON.parse(readFileSync(join(f.env.PROTOTYPE_REPORT_ROOT, 'summary.json')));
  assert.equal(summary.status, mode === 'valid' ? 'passed' : 'failed');
});
