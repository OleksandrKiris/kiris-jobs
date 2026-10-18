import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { assertToolManifest, JOINT_TOOL_TRANSITION, publishedToolBytes, TOOL_FILES } from './coordinator-refresh.mjs';

test('all five pinned bodies are required; each truncated/mixed body is rejected', () => {
  const files = new Map(TOOL_FILES.map(name => [name, Buffer.from('complete source ' + name)]));
  const hashes = Object.fromEntries([...files].map(([name, bytes]) =>
    [name, createHash('sha256').update(bytes).digest('hex')]));
  assertToolManifest(files, hashes);
  for (const name of TOOL_FILES) {
    const incomplete = new Map(files); incomplete.delete(name);
    assert.throws(() => assertToolManifest(incomplete, hashes));
    const mixed = new Map(files); mixed.set(name, files.get(name).subarray(1));
    assert.throws(() => assertToolManifest(mixed, hashes), /Pinned source hash/);
  }
  assert.throws(() => assertToolManifest(new Map([...files, ['extra.js', Buffer.from('x')]]), hashes));
});

test('joint gate pins distinct full commits and every file hash; Git reads remain CI-only', () => {
  assert.equal(JOINT_TOOL_TRANSITION.published.ref, '62cb57883e617d67e54d8ba5b280f616ca651848');
  assert.equal(JOINT_TOOL_TRANSITION.target.ref, 'c896d09da3901be3b6bbec92c1aa1bcbfb0b8e15');
  for (const source of [JOINT_TOOL_TRANSITION.published, JOINT_TOOL_TRANSITION.target]) {
    assert.match(source.ref, /^[a-f0-9]{40}$/);
    assert.deepEqual(Object.keys(source.hashes).sort(), [...TOOL_FILES].sort());
    for (const sha of Object.values(source.hashes)) assert.match(sha, /^[a-f0-9]{64}$/);
  }
  assert.notEqual(JOINT_TOOL_TRANSITION.published.hashes['app.js'], JOINT_TOOL_TRANSITION.target.hashes['app.js']);
  const previous = process.env.GITHUB_ACTIONS;
  try {
    delete process.env.GITHUB_ACTIONS;
    assert.throws(() => publishedToolBytes(), /authorized CI runner/);
  } finally {
    if (previous === undefined) delete process.env.GITHUB_ACTIONS;
    else process.env.GITHUB_ACTIONS = previous;
  }
});

// Regression87: exercise the real publisher on isolated, fictional Git trees.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { buildArtifact, coordinatorRuntime } from '../../scripts/build-pages-artifact.mjs';
import { captureStagedPublication, captureCurrentToolTarget, gitPublication, publicationReuse, selectToolTarget, toolInput, assertFullCurrentResult, transitionForTarget } from './catalogue-scope.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
function publicationFixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'primserv-scope-regression-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const source = join(root, 'source'); mkdirSync(source);
  const write = (path, value) => {
    mkdirSync(dirname(join(source, path)), { recursive: true });
    writeFileSync(join(source, path), value);
  };
  const git = args => execFileSync('git', args, { cwd: source, encoding: 'utf8' }).trim();
  const commit = () => {
    git(['add', '.']);
    git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
      'commit', '--no-gpg-sign', '-qm', 'Fictional publication fixture']);
    return git(['rev-parse', 'HEAD']);
  };
  write('index.html', '<h1>Fictional catalogue</h1>');
  write('privacy.html', 'fictional privacy bootstrap');
  write('assets/candidate.js', 'fictional catalogue runtime');
  write('docs/primserv-roadmap.md', 'fictional old public roadmap');
  write('docs/github-inventory.md', 'fictional old public inventory');
  write('.github/public-tools.json', '{"coordinator":true}');
  const oldHashes = {}, acceptedHashes = {};
  for (const name of coordinatorRuntime) {
    write('coordinator-demo/' + name, 'old-' + name);
    oldHashes[name] = hash('old-' + name);
    acceptedHashes[name] = hash(name === 'primserv-logo.svg' ? 'old-' + name : 'new-' + name);
  }
  git(['init', '-q', '--initial-branch=main']);
  const ref = commit(), historical = gitPublication(source, ref);
  let buildNumber = 0;
  const capture = () => {
    const head = git(['rev-parse', 'HEAD']), artifact = join(root, 'artifact-' + ++buildNumber);
    buildArtifact(source, artifact);
    return { head, artifact, staged: captureStagedPublication(source, artifact, head) };
  };
  return { source, write, git, commit, historical, oldHashes, acceptedHashes, capture };
}

for (const [scope, paths] of Object.entries({
  docs74: ['docs/integration/hrappka-primserv-evidence-20261017.md', 'docs/integration/ownership-map.json'],
  backend86: ['backend/config/urls.py', 'backend/core/material_http.py', 'backend/core/middleware.py',
    'backend/tests/core/test_material_http.py', 'docs/backend/core/material-http-response.md']
})) test('publication guard allows excluded ' + scope + ' without path exceptions', t => {
  const f = publicationFixture(t);
  for (const path of paths) f.write(path, 'fictional excluded change');
  f.commit(); const { staged } = f.capture();
  const reuse = publicationReuse(f.historical, staged.files);
  assert.equal(reuse.unchangedPublication, true);
  assert.equal(reuse.requireFullCurrentCatalogue, false);
  assert.deepEqual(reuse.changed, []);
});

test('accepted NEW68 is actual staged HEAD, never replaced by an overlay; changed tool requires full-current', t => {
  const f = publicationFixture(t);
  for (const name of coordinatorRuntime) if (name !== 'primserv-logo.svg') f.write('coordinator-demo/' + name, 'new-' + name);
  f.write('docs/platform/materials-slice-20261017.md', 'fictional public material documentation');
  f.commit(); const { staged } = f.capture();
  const actual = Object.fromEntries(staged.files.filter(x => x.path.startsWith('tools/coordinator/'))
    .map(x => [x.path.split('/').at(-1), x.sha256]));
  assert.equal(selectToolTarget(actual, f.oldHashes, f.acceptedHashes), 'actual-staged-head');
  assert.deepEqual(actual, f.acceptedHashes);
  const reuse = publicationReuse(f.historical, staged.files);
  assert.equal(reuse.requireFullCurrentCatalogue, true);
  assert.equal(reuse.toolChanges.length, 4);
  assert.deepEqual(reuse.nonToolChanges, ['docs/platform/materials-slice-20261017.md']);
  assert.equal(reuse.historical33IsCurrentRun, false);
});

test('unchanged actual OLD tuple is independently identified before any explicit candidate overlay', t => {
  const f = publicationFixture(t), { staged } = f.capture();
  const actual = Object.fromEntries(staged.files.filter(x => x.path.startsWith('tools/coordinator/'))
    .map(x => [x.path.split('/').at(-1), x.sha256]));
  assert.equal(selectToolTarget(actual, f.oldHashes, f.acceptedHashes), 'verified-old-with-explicit-candidate-overlay');
});

test('legitimate public docs84 changes invalidate reuse and require full-current, not a permanent hard stop', t => {
  const f = publicationFixture(t);
  for (const name of ['primserv-roadmap.md', 'github-inventory.md']) f.write('docs/' + name, 'fictional updated public document');
  f.commit(); const { staged } = f.capture(), reuse = publicationReuse(f.historical, staged.files);
  assert.equal(reuse.requireFullCurrentCatalogue, true);
  assert.deepEqual(reuse.nonToolChanges, ['docs/github-inventory.md', 'docs/primserv-roadmap.md']);
  assert.equal(reuse.historical33IsCurrentRun, false);
});

for (const change of ['modify', 'add', 'remove']) test('a real reused public asset ' + change + ' invalidates reuse', t => {
  const f = publicationFixture(t);
  if (change === 'modify') f.write('assets/candidate.js', 'fictional changed runtime');
  if (change === 'add') f.write('assets/new-public.js', 'fictional new public runtime');
  if (change === 'remove') rmSync(join(f.source, 'privacy.html'));
  f.commit(); const { staged } = f.capture();
  const reuse = publicationReuse(f.historical, staged.files);
  assert.equal(reuse.unchangedPublication, false);
  assert.equal(reuse.requireFullCurrentCatalogue, true);
});

test('destination tampering and concealing actual NEW with an OLD overlay fail source verification', t => {
  const f = publicationFixture(t);
  f.write('coordinator-demo/app.js', 'new-app.js'); f.commit();
  const { artifact, head } = f.capture();
  writeFileSync(join(artifact, 'tools/coordinator/app.js'), 'old-app.js');
  assert.throws(() => captureStagedPublication(f.source, artifact, head), /inventory differs/);
});

test('unknown or mixed current tool tuple is rejected instead of hidden by the accepted candidate', t => {
  const f = publicationFixture(t);
  const mixed = { ...f.oldHashes, 'app.js': f.acceptedHashes['app.js'] };
  assert.throws(() => selectToolTarget(mixed, f.oldHashes, f.acceptedHashes), /Unknown\/mixed/);
  assert.throws(() => selectToolTarget({ ...f.acceptedHashes, 'app.js': hash('unknown') }, f.oldHashes, f.acceptedHashes), /Unknown\/mixed/);
});

test('historical publication uses Git identities without reading past media bodies', t => {
  const f = publicationFixture(t);
  f.write('assets/fictional-image.bin', Buffer.alloc(128, 19)); const ref = f.commit();
  const blob = f.git(['rev-parse', ref + ':assets/fictional-image.bin']);
  rmSync(join(f.source, '.git/objects', blob.slice(0, 2), blob.slice(2)));
  const projected = gitPublication(f.source, ref);
  assert.equal(projected.find(x => x.path === 'assets/fictional-image.bin').blob, blob);
});


test('NEW target keeps captured HEAD buffers and never calls the external overlay loader', () => {
  const actual = new Map(TOOL_FILES.map(name => [name, Buffer.from('captured HEAD ' + name)]));
  let calls = 0;
  const candidate = toolInput('actual-staged-head', actual, () => { calls++; throw Error('Must not load historical candidate'); });
  assert.equal(calls, 0); assert.equal(candidate.files, actual);
  for (const name of TOOL_FILES) assert.equal(candidate.files.get(name), actual.get(name));
  const overlay = toolInput('verified-old-with-explicit-candidate-overlay', actual, () => { calls++; return { files: new Map() }; });
  assert.equal(calls, 1); assert.notEqual(overlay.files, actual);
});


for (const reason of ['nonzero exit', 'timeout']) test('full-current rejects ' + reason + ' even with a stale passed JSON', () => {
  const failure = new Error('Fictional child ' + reason);
  failure.status = reason === 'timeout' ? null : 1;
  if (reason === 'timeout') failure.code = 'ETIMEDOUT';
  assert.throws(() => assertFullCurrentResult(failure, { status: 'passed', results: [] }), /child|process|exit|timeout/i);
});

test('full-current requires both successful process and passed report', () => {
  assert.doesNotThrow(() => assertFullCurrentResult(undefined, { status: 'passed' }));
  assert.throws(() => assertFullCurrentResult(undefined, { status: 'failed', error: 'Fictional assertion failure' }));
  assert.throws(() => assertFullCurrentResult(undefined, undefined));
});

test('after NEW is accepted as event base, pinned published ref/body/hashes stay one consistent tuple', t => {
  const f = publicationFixture(t), oldRef = f.git(['rev-parse', 'HEAD']);
  for (const name of coordinatorRuntime) if (name !== 'primserv-logo.svg') f.write('coordinator-demo/' + name, 'new-' + name);
  const newBase = f.commit();
  const reference = { id: 'fictional-transition', published: { ref: oldRef, hashes: f.oldHashes },
    target: { ref: newBase, hashes: f.acceptedHashes } };
  const transition = transitionForTarget(reference, { head: newBase, base: newBase,
    hashes: f.acceptedHashes, mode: 'actual-staged-head' });
  const actualPublishedBodies = new Map(TOOL_FILES.map(name => [name, Buffer.from(f.git(['show',
    transition.published.ref + ':coordinator-demo/' + name]))]));
  assert.doesNotThrow(() => assertToolManifest(actualPublishedBodies, transition.published.hashes),
    'An event-base change must not falsely compare NEW bodies with historical OLD hashes');
  assert.equal(transition.published.ref, oldRef);
  assert.deepEqual(transition.published.hashes, f.oldHashes);
  assert.equal(transition.eventBase, newBase, 'Event base remains separate provenance');
  assert.equal(transition.target.ref, newBase);
});

function nextHeadFixture(t) {
  const f = publicationFixture(t), oldHead = f.git(['rev-parse', 'HEAD']);
  for (const name of coordinatorRuntime) if (name !== 'primserv-logo.svg') f.write('coordinator-demo/' + name, 'next-complete-' + name);
  f.commit();
  const captured = f.capture();
  const files = new Map(coordinatorRuntime.map(name => [name, readFileSync(join(captured.artifact, 'tools/coordinator', name))]));
  return { ...f, ...captured, oldHead, files };
}
const refingerprint = staged => ({ ...staged, sha256: hash(JSON.stringify(staged.files)) });

test('the next complete Git HEAD outside both historical tuples uses actual captured five and requires fresh public coverage', t => {
  const f = nextHeadFixture(t);
  const current = captureCurrentToolTarget(f.source, f.head, f.staged, f.files);
  assert.equal(current.sourceHead, f.head);
  assert.equal(current.checkout, f.head);
  assert.equal(current.inventorySHA256, f.staged.sha256);
  assert.notDeepEqual(current.hashes, f.oldHashes); assert.notDeepEqual(current.hashes, f.acceptedHashes);
  const mode = selectToolTarget(current.hashes, f.oldHashes, current.hashes);
  assert.equal(mode, 'actual-staged-head');
  assert.equal(toolInput(mode, current.files, () => { throw Error('Cannot conceal the next current head'); }).files, f.files);
  assert.equal(publicationReuse(f.historical, f.staged.files).requireFullCurrentCatalogue, true);
});

test('current tuple rejects a syntactically valid but wrong source HEAD and a malformed HEAD', t => {
  const f = nextHeadFixture(t);
  for (const head of [f.oldHead, 'f'.repeat(40), 'main'])
    assert.throws(() => captureCurrentToolTarget(f.source, head, f.staged, f.files), /head|HEAD|base|merge/);
});

test('CI merge checkout binds actual source to the exact ordered event-base/PR-head parents', t => {
  const f = nextHeadFixture(t), prHead = f.head, base = f.oldHead;
  const tree = f.git(['rev-parse', prHead + '^{tree}']);
  const merge = f.git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid',
    'commit-tree', tree, '-p', base, '-p', prHead, '-m', 'Fictional CI synthetic merge']);
  f.git(['update-ref', 'HEAD', merge]);
  writeFileSync(join(f.source, '.git/shallow'), merge + '\n');
  assert.equal(f.git(['show', '-s', '--format=%P', merge]), '', 'Shallow revision view really hides the parents');
  const { staged } = f.capture();
  const current = captureCurrentToolTarget(f.source, prHead, staged, f.files, base);
  assert.equal(current.sourceHead, merge); assert.equal(current.testedHead, prHead);
  assert.equal(current.checkout, merge); assert.deepEqual(current.checkoutParents, [base, prHead]);
  const transition = transitionForTarget(JOINT_TOOL_TRANSITION, { head: current.sourceHead,
    base, hashes: current.hashes, mode: 'actual-staged-head' });
  assert.equal(transition.target.ref, merge, 'The source ref must name the actual captured tree');
  assert.equal(transition.eventBase, base);
  for (const [badHead, badBase] of [[base, prHead], ['f'.repeat(40), base], [prHead, 'f'.repeat(40)]])
    assert.throws(() => captureCurrentToolTarget(f.source, badHead, staged, f.files, badBase), /exact event base and tested PR head/);
});

test('current tuple rejects any mixed captured body and any missing or extra buffer', t => {
  const f = nextHeadFixture(t);
  for (const name of coordinatorRuntime) {
    const mixed = new Map(f.files); mixed.set(name, Buffer.from('foreign-generation-' + name));
    assert.throws(() => captureCurrentToolTarget(f.source, f.head, f.staged, mixed), /exact current HEAD/);
    const missing = new Map(f.files); missing.delete(name);
    assert.throws(() => captureCurrentToolTarget(f.source, f.head, f.staged, missing), /five captured/);
  }
  assert.throws(() => captureCurrentToolTarget(f.source, f.head, f.staged, new Map([...f.files, ['extra.js', Buffer.from('x')]])), /five captured/);
});

test('current tuple rejects forged hash, blob, size and source mapping even with a recomputed inventory fingerprint', t => {
  const f = nextHeadFixture(t);
  for (const [field, value] of [['sha256', hash('forged')], ['blob', 'f'.repeat(40)], ['bytes', 1], ['sourcePath', 'coordinator-demo/foreign.js']]) {
    const forged = structuredClone(f.staged);
    forged.files.find(x => x.path === 'tools/coordinator/app.js')[field] = value;
    assert.throws(() => captureCurrentToolTarget(f.source, f.head, refingerprint(forged), f.files), /Current|current/);
  }
  const reduced = structuredClone(f.staged);
  reduced.files = reduced.files.filter(x => x.path !== 'tools/coordinator/app.js');
  assert.throws(() => captureCurrentToolTarget(f.source, f.head, refingerprint(reduced), f.files), /five staged/);
  const staleFingerprint = structuredClone(f.staged); staleFingerprint.sha256 = 'f'.repeat(64);
  assert.throws(() => captureCurrentToolTarget(f.source, f.head, staleFingerprint, f.files), /fingerprint/);
});

function fullCurrentFixture() {
  const head = '1'.repeat(40), base = '2'.repeat(40), results = [];
  for (const width of [1280, 320]) {
    results.push({ scenario: 'uncached locale with origin stopped: Polish fallback, failed keyboard retry, reload, reconnect/retry without lost search, failed Georgian switch', width, status: 'passed' });
    results.push({ scenario: 'catalogue-route', viewport: { width, height: 900 }, status: 'passed' });
    for (const mode of ['', 'corrupt', 'denied']) results.push({ scenario: 'six shortcut anchors / focus / language' + (mode ? ' / ' + mode : ' / Back / offline reload / saved search'), width, status: 'passed' });
    results.push({ scenario: 'catalogue → coordinator → return / cold and warm offline / four languages + fallback', width, status: 'passed' });
  }
  for (const mode of ['corrupt', 'denied']) {
    results.push({ scenario: 'storage-' + mode, viewport: { width: 320, height: 900 }, status: 'passed' });
    results.push({ scenario: 'published demo ' + mode + ' storage / preserved record and return language', status: 'passed' });
  }
  results.push({ scenario: 'base → head worker upgrade', status: 'not-applicable', reason: 'Worker bytes are unchanged' });
  const tools = Object.fromEntries(coordinatorRuntime.map(name => [name, { bytes: 7, sha256: hash('current-' + name) }]));
  const report = { status: 'passed', head, base, checkout: head,
    scope: 'full-current-catalogue-core; historical tool overlays excluded', results,
    files: Object.fromEntries(Object.entries(tools).map(([name, record]) => ['tools/coordinator/' + name, { ...record }])) };
  return { report, expected: { head, base, checkout: head, tools, workerChanged: false } };
}

test('full-current report binds all sixteen distinct cases and current five to exact head/base/checkout', () => {
  const { report, expected } = fullCurrentFixture();
  assert.doesNotThrow(() => assertFullCurrentResult(undefined, report, expected));
  for (const field of ['head', 'base', 'checkout']) {
    const forged = structuredClone(report); forged[field] = 'f'.repeat(40);
    assert.throws(() => assertFullCurrentResult(undefined, forged, expected), /Full-current/);
  }
  for (const field of ['bytes', 'sha256']) {
    const forged = structuredClone(report); forged.files['tools/coordinator/app.js'][field] = field === 'bytes' ? 1 : hash('forged');
    assert.throws(() => assertFullCurrentResult(undefined, forged, expected), /captured/);
  }
});

test('a passed reduced report, duplicated case, failed case or missing current tool evidence is rejected', () => {
  const { report, expected } = fullCurrentFixture();
  const reduced = structuredClone(report); reduced.results.splice(0, 1);
  assert.throws(() => assertFullCurrentResult(undefined, reduced, expected), /sixteen/);
  const duplicated = structuredClone(report); duplicated.results[0] = duplicated.results[1];
  assert.throws(() => assertFullCurrentResult(undefined, duplicated, expected), /sixteen/);
  const failed = structuredClone(report); failed.results[0].status = 'failed';
  assert.throws(() => assertFullCurrentResult(undefined, failed, expected), /must pass/);
  const missing = structuredClone(report); delete missing.files['tools/coordinator/app.js'];
  assert.throws(() => assertFullCurrentResult(undefined, missing, expected), /captured/);
  assert.throws(() => assertFullCurrentResult(undefined, report, { ...expected, workerChanged: true }));
});

test('a changed worker needs both fresh viewport upgrade cases, not a not-applicable report', () => {
  const { report, expected } = fullCurrentFixture(); expected.workerChanged = true;
  report.results.pop();
  for (const width of [1280, 320]) report.results.push({ scenario: 'actual base complete tool → head shell → origin stopped/offline first tool entry, reload, languages, return and saved fictional statuses', width, status: 'passed' });
  assert.doesNotThrow(() => assertFullCurrentResult(undefined, report, expected));
  report.results.pop();
  assert.throws(() => assertFullCurrentResult(undefined, report, expected));
});
