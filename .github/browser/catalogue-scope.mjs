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

export function selectToolTarget(actual, oldHashes, acceptedHashes) {
  const names = [...coordinatorRuntime].sort();
  for (const hashes of [actual, oldHashes, acceptedHashes]) {
    assert.deepEqual(Object.keys(hashes).sort(), names, 'Exactly publisher-declared five tool files');
    for (const hash of Object.values(hashes)) assert.match(hash, /^[0-9a-f]{64}$/);
  }
  const equal = expected => names.every(name => actual[name] === expected[name]);
  if (equal(acceptedHashes)) return 'actual-staged-head';
  if (equal(oldHashes)) return 'verified-old-with-explicit-candidate-overlay';
  assert.fail('Unknown/mixed actual staged tool tuple; a historical candidate may not conceal it');
}

export function toolInput(mode, actualFiles, loadCandidate) {
  assert.ok(['actual-staged-head', 'verified-old-with-explicit-candidate-overlay'].includes(mode));
  // Crucially the accepted NEW path never invokes the foreign candidate loader.
  return mode === 'actual-staged-head' ? { files: actualFiles } : loadCandidate();
}

// Process success and reported assertions are separate mandatory conditions.
// A passed or stale JSON is never authority for a failed/timeout child.
export function assertFullCurrentResult(failure, report) {
  assert.ok(failure == null, 'Full-current child must exit0; process failure: ' +
    (failure?.code || failure?.status || failure?.message || 'unknown'));
  assert.equal(report?.status, 'passed', report?.error || 'Missing passed child report');
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
