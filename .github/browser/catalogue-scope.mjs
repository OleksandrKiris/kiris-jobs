// Publication/acceptance metadata only. No browser, downloads or product writes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { coordinatorRuntime, inventory, publicationInventory, verifyArtifact } from '../../scripts/build-pages-artifact.mjs';

const digest = (algorithm, bytes) => createHash(algorithm).update(bytes).digest('hex');
const blobHash = bytes => digest('sha1', Buffer.concat([Buffer.from('blob ' + bytes.length + '\0'), bytes]));
const toolRoot = 'tools/coordinator/';
const toolPath = path => path.startsWith(toolRoot);
const sourcePath = path => toolPath(path) ? 'coordinator-demo/' + path.slice(toolRoot.length) : path;

function safePath(path) {
  assert.ok(path && !posix.isAbsolute(path) && !path.split('/').some(x => x === '..' || x === '.' || !x)
    && !path.includes('\\') && !path.includes('\0'), 'Unsafe Git path: ' + path);
}

// Project PATHS ONLY through the actual publisher. Empty metadata placeholders
// deliberately carry no historical media bytes; their hashes are never proof.
// The actual manifest text is supplied separately, and validated by publisher.
export function projectPublication(entries, publicToolsManifest) {
  const root = mkdtempSync(join(tmpdir(), 'primserv-git-publication-'));
  const byPath = new Map();
  try {
    for (const entry of entries) {
      safePath(entry.path);
      assert.ok(!byPath.has(entry.path), 'Duplicate Git path: ' + entry.path);
      assert.match(entry.blob, /^[0-9a-f]{40}$/);
      const absolute = join(root, entry.path);
      mkdirSync(dirname(absolute), { recursive: true });
      if (entry.mode === '120000') symlinkSync('metadata-only-unread-target', absolute);
      else {
        assert.ok(['100644', '100755'].includes(entry.mode), 'Unsupported Git mode: ' + entry.path);
        writeFileSync(absolute, entry.path === '.github/public-tools.json' ? publicToolsManifest : '');
      }
      byPath.set(entry.path, entry);
    }
    return publicationInventory(root).map(({ path }) => {
      const source = sourcePath(path), entry = byPath.get(source);
      assert.ok(entry, 'Publisher path has no exact Git source: ' + path);
      return { path, sourcePath: source, blob: entry.blob };
    });
  } finally { rmSync(root, { recursive: true, force: true }); }
}

export function gitPublication(checkout, ref) {
  assert.match(ref, /^[a-f0-9]{40}$/, 'Only an exact commit may define publication');
  const git = args => execFileSync('git', args, { cwd: checkout, timeout: 60000,
    maxBuffer: 8 * 1024 * 1024 });
  const entries = git(['ls-tree', '-r', '-z', '--full-tree', ref]).toString().split('\0').filter(Boolean).map(row => {
    const tab = row.indexOf('\t'), [mode, type, blob] = row.slice(0, tab).split(' ');
    assert.equal(type, 'blob', 'Unsupported Git object in publication projection');
    return { path: row.slice(tab + 1), mode, blob };
  });
  const manifest = entries.some(x => x.path === '.github/public-tools.json')
    ? git(['show', ref + ':.github/public-tools.json']).toString() : '';
  return projectPublication(entries, manifest);
}

export function captureStagedPublication(checkout, artifact, checkoutRef) {
  // Validate DESTINATION paths, bytes and SHA with the exact shipping policy.
  verifyArtifact(checkout, artifact);
  const publication = gitPublication(checkout, checkoutRef);
  const byPath = new Map(publication.map(x => [x.path, x]));
  const staged = inventory(artifact).map(record => {
    const expected = byPath.get(record.path), bytes = readFileSync(join(artifact, record.path));
    assert.ok(expected, 'Untracked staged publication: ' + record.path);
    assert.equal(digest('sha256', bytes), record.sha256, 'Stage changed while capturing: ' + record.path);
    assert.equal(blobHash(bytes), expected.blob, 'Staged bytes differ from exact checkout Git: ' + record.path);
    return { ...record, sourcePath: expected.sourcePath, blob: expected.blob };
  });
  assert.deepEqual(staged.map(x => x.path), publication.map(x => x.path), 'Exact checkout publication paths');
  return { files: staged, sha256: digest('sha256', JSON.stringify(staged)) };
}

// Bind the five captured buffers to ONE real checkout commit, rather than a
// list of previously accepted versions. A new complete head is eligible;
// eligibility is not browser acceptance of its behaviour.
export function captureCurrentToolTarget(checkout, head, staged, files) {
  assert.match(head, /^[0-9a-f]{40}$/, 'Exact current tool source head');
  const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout,
    encoding: 'utf8', timeout: 60000 }).trim();
  assert.equal(head, actualHead, 'Tool source head must equal the real checkout HEAD');
  assert.equal(staged.sha256, digest('sha256', JSON.stringify(staged.files)), 'Captured publication fingerprint');
  const expected = gitPublication(checkout, head).filter(x => toolPath(x.path));
  const records = staged.files.filter(x => toolPath(x.path));
  const names = [...coordinatorRuntime].sort();
  assert.deepEqual([...files.keys()].sort(), names, 'Exactly five captured current buffers');
  assert.deepEqual(expected.map(x => x.path), names.map(x => toolRoot + x), 'Exact HEAD publisher tool inventory');
  assert.deepEqual(records.map(x => x.path), expected.map(x => x.path), 'Exactly five staged tool records');
  const hashes = {}, resources = {};
  for (const source of expected) {
    const name = source.path.slice(toolRoot.length), record = records.find(x => x.path === source.path);
    const bytes = files.get(name);
    assert.ok(Buffer.isBuffer(bytes), 'Captured buffer: ' + name);
    assert.equal(record.sourcePath, source.sourcePath, 'Current source mapping: ' + name);
    assert.equal(record.blob, source.blob, 'Current source blob: ' + name);
    assert.equal(blobHash(bytes), source.blob, 'Captured bytes differ from exact current HEAD: ' + name);
    assert.equal(bytes.length, record.bytes, 'Current captured size: ' + name);
    assert.equal(digest('sha256', bytes), record.sha256, 'Current captured hash: ' + name);
    hashes[name] = record.sha256;
    resources[name] = { sourcePath: source.sourcePath, blob: source.blob, bytes: record.bytes, sha256: record.sha256 };
  }
  return { sourceHead: head, checkout: actualHead, inventorySHA256: staged.sha256, hashes, resources, files };
}

export function selectToolTarget(actual, oldHashes, expectedCurrentHashes) {
  const names = [...coordinatorRuntime].sort();
  for (const hashes of [actual, oldHashes, expectedCurrentHashes]) {
    assert.deepEqual(Object.keys(hashes).sort(), names, 'Exactly publisher-declared five tool files');
    for (const hash of Object.values(hashes)) assert.match(hash, /^[0-9a-f]{64}$/);
  }
  const equal = expected => names.every(name => actual[name] === expected[name]);
  // Only this exact legacy OLD tuple keeps the explicitly labelled historical
  // overlay. Every other eligible target must be the verified current HEAD.
  if (equal(oldHashes)) return 'verified-old-with-explicit-candidate-overlay';
  if (equal(expectedCurrentHashes)) return 'actual-staged-head';
  assert.fail('Unknown/mixed actual staged tool tuple; a historical candidate may not conceal it');
}

export function toolInput(mode, actualFiles, loadCandidate) {
  assert.ok(['actual-staged-head', 'verified-old-with-explicit-candidate-overlay'].includes(mode));
  // Crucially the accepted NEW path never invokes the foreign candidate loader.
  return mode === 'actual-staged-head' ? { files: actualFiles } : loadCandidate();
}

// Process success and reported assertions are separate mandatory conditions.
// A passed or stale JSON is never authority for a failed/timeout child.
export function assertFullCurrentResult(failure, report, expected) {
  assert.ok(failure == null, 'Full-current child must exit0; process failure: ' +
    (failure?.code || failure?.status || failure?.message || 'unknown'));
  assert.equal(report?.status, 'passed', report?.error || 'Missing passed child report');
  if (!expected) return; // Process-only check used before any JSON is read.
  for (const field of ['head', 'base', 'checkout']) assert.equal(report[field], expected[field], 'Full-current ' + field);
  assert.equal(report.scope, 'full-current-catalogue-core; historical tool overlays excluded');
  const widths = [1280, 320];
  const key = (scenario, width = '') => scenario + '|' + width;
  const required = [
    ...widths.map(width => key('uncached locale with origin stopped: Polish fallback, failed keyboard retry, reload, reconnect/retry without lost search, failed Georgian switch', width)),
    ...widths.map(width => key('catalogue-route', width)),
    ...['corrupt', 'denied'].map(mode => key('storage-' + mode, 320)),
    ...widths.flatMap(width => ['', 'corrupt', 'denied'].map(mode => key('six shortcut anchors / focus / language' + (mode ? ' / ' + mode : ' / Back / offline reload / saved search'), width))),
    ...widths.map(width => key('catalogue → coordinator → return / cold and warm offline / four languages + fallback', width)),
    ...['corrupt', 'denied'].map(mode => key('published demo ' + mode + ' storage / preserved record and return language'))
  ];
  assert.ok(Array.isArray(report.results), 'Full-current scenario results');
  const core = report.results.filter(x => required.includes(key(x.scenario, x.width ?? x.viewport?.width ?? '')));
  assert.deepEqual(core.map(x => key(x.scenario, x.width ?? x.viewport?.width ?? '')).sort(), required.sort(),
    'All sixteen distinct full-current core cases must execute exactly once');
  assert.ok(core.every(x => x.status === 'passed'), 'Every required full-current case must pass');
  const worker = report.results.filter(x => !core.includes(x));
  assert.equal(typeof expected.workerChanged, 'boolean', 'Actual base/head worker comparison is required');
  if (expected.workerChanged) {
    assert.deepEqual(worker.map(x => key(x.scenario, x.width)).sort(), widths.map(width => key('actual base complete tool → head shell → origin stopped/offline first tool entry, reload, languages, return and saved fictional statuses', width)).sort());
    assert.ok(worker.every(x => x.status === 'passed'), 'Both actual worker upgrade cases must pass');
  } else {
    assert.deepEqual(worker, [{ scenario: 'base → head worker upgrade', status: 'not-applicable', reason: 'Worker bytes are unchanged' }]);
  }
  assert.deepEqual(Object.keys(expected.tools).sort(), [...coordinatorRuntime].sort(), 'Full-current expected five');
  for (const name of coordinatorRuntime) {
    const record = report.files?.[toolRoot + name];
    assert.equal(record?.sha256, expected.tools[name].sha256, 'Full-current captured hash: ' + name);
    assert.equal(record?.bytes, expected.tools[name].bytes, 'Full-current captured size: ' + name);
  }
}

export function transitionForTarget(reference, { head, base, hashes, mode }) {
  for (const ref of [head, base, reference.published.ref, reference.target.ref]) assert.match(ref, /^[0-9a-f]{40}$/);
  // Keep the reviewed historical ref and hashes atomic. Event base may already
  // contain NEW tools after their release; it is independent provenance.
  return { ...reference, eventBase: base,
    published: { ...reference.published, hashes: { ...reference.published.hashes } },
    target: { ref: mode === 'actual-staged-head' ? head : reference.target.ref, hashes } };
}

export function publicationReuse(reference, current) {
  const before = new Map(reference.map(x => [x.path, x.blob]));
  const after = new Map(current.map(x => [x.path, x.blob]));
  const changed = [...new Set([...before.keys(), ...after.keys()])].sort()
    .filter(path => before.get(path) !== after.get(path));
  const nonToolChanges = changed.filter(path => !toolPath(path));
  const toolChanges = changed.filter(toolPath);
  // No unproven shell-only attribution of historical33/original18. Any public
  // delta (including a docs addition or tool change) runs full-current core.
  return { unchangedPublication: changed.length === 0, changed, nonToolChanges, toolChanges,
    requireFullCurrentCatalogue: changed.length !== 0,
    historical33IsCurrentRun: false,
    scope: changed.length ? 'Historical33 retained only; full-current catalogue plus mandatory19 required'
      : 'Identical published bytes; historical33 retained as attributed prior proof, not reexecuted' };
}
