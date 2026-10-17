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
import { captureStagedPublication, gitPublication, publicationReuse, selectToolTarget, toolInput } from './catalogue-scope.mjs';
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
