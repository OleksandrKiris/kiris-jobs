import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildArtifact, inventory, verifyArtifact, publicationInventory, coordinatorRuntime } from './build-pages-artifact.mjs';

const repo = fileURLToPath(new URL('../', import.meta.url));
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'primserv-pages-test-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const src = join(root, 'source'); mkdirSync(src);
  const write = (path, value = path) => {
    mkdirSync(dirname(join(src, path)), { recursive: true });
    writeFileSync(join(src, path), value);
  };
  write('index.html', '<h1>Fixture</h1>');
  return { root, src, dst: join(root, 'artifact'), write };
}

// Independent baseline: the actual GNU tar selection used by the official
// actions/upload-pages-artifact@v5, not the implementation's inventory filter.
function archiveFiles(src, tar) {
  execFileSync('tar', ['--dereference', '--hard-dereference', '--directory', src,
    '-cf', tar, '--exclude=.git', '--exclude=.github', '--exclude=.[^/]*', '.']);
  return execFileSync('tar', ['-tf', tar], { encoding: 'utf8' }).split('\n')
    .filter(path => path && !path.endsWith('/')).map(path => path.replace(/^\.\//, '')).sort();
}

// Independent publication contract: keep pre-existing public documentation and
// similarly named files, but never publish these exact development subtrees.
const excludedPublicPath = /^(?:(?:offline-tools|coordinator-demo|backend|contracts|quality)(?:\/|$)|docs\/(?:backend|integration|quality)(?:\/|$))/;

test('old root tar includes internal modules; staged tar excludes only registered paths', t => {
  const f = fixture(t);
  for (const path of ['offline-tools/tool/index.html', 'offline-tools/tool/nested/data.json',
    'coordinator-demo/index.html', 'coordinator-demo/nested/app.js', 'apply/pdf/index.html',
    'assets/picture with spaces.webp', 'docs/platform/readme.md', 'docs/offline-services/readme.md',
    'assets/offline-tools/keep.txt', 'offline-tools-old/index.html', 'coordinator-demo.txt', 'sw.js',
    'manifest.webmanifest', 'vacancies/old/index.html', '.nojekyll', '.git/config', '.github/test',
    'assets/.hidden', 'backend/domain/workflow.py', 'contracts/v1/tasks.json',
    'quality/security/report.json', 'docs/backend/domain/README.md',
    'docs/integration/v1/README.md', 'docs/quality/review.md',
    'backend-old/index.html', 'contracts.json', 'quality.html',
    'assets/backend/example.txt', 'assets/contracts/example.txt', 'assets/quality/example.txt',
    'docs/backend.md', 'docs/integration-guide.md', 'docs/quality-guide.md',
    'docs/backend-old/keep.txt', 'docs/integration-old/keep.txt', 'docs/quality-old/keep.txt',
    'public/docs/backend/keep.txt']) f.write(path);
  const old = archiveFiles(f.src, join(f.root, 'old.tar'));
  assert.ok(old.includes('offline-tools/tool/index.html'));
  assert.ok(old.includes('coordinator-demo/index.html'));
  buildArtifact(f.src, f.dst);
  assert.deepEqual(archiveFiles(f.dst, join(f.root, 'new.tar')), old.filter(path => !excludedPublicPath.test(path)));
  assert.ok(existsSync(join(f.src, 'coordinator-demo/index.html')));
  assert.ok(existsSync(join(f.src, 'offline-tools/tool/nested/data.json')));
});

for (const path of ['backend', 'contracts', 'quality', 'docs/backend', 'docs/integration', 'docs/quality']) {
  test(`internal path ${path} is excluded without changing source or public bytes`, t => {
    const f = fixture(t);
    f.write(`${path}/nested/development.txt`, 'fictional internal fixture');
    f.write(`${path}-public/keep.txt`, Buffer.from([0, 255, 13, 10]));
    const before = readFileSync(join(f.src, `${path}/nested/development.txt`));
    buildArtifact(f.src, f.dst);
    assert.equal(existsSync(join(f.dst, path)), false);
    assert.deepEqual(readFileSync(join(f.dst, `${path}-public/keep.txt`)), Buffer.from([0, 255, 13, 10]));
    assert.deepEqual(readFileSync(join(f.src, `${path}/nested/development.txt`)), before);
    assert.doesNotThrow(() => verifyArtifact(f.src, f.dst));
  });

  test(`empty internal directory ${path} is omitted`, t => {
    const f = fixture(t); mkdirSync(join(f.src, path), { recursive: true });
    buildArtifact(f.src, f.dst);
    assert.equal(existsSync(join(f.dst, path)), false);
  });

  for (const type of ['file', 'directory']) {
    test(`verification rejects injected internal ${type} at ${path}`, t => {
      const f = fixture(t); buildArtifact(f.src, f.dst);
      mkdirSync(dirname(join(f.dst, path)), { recursive: true });
      if (type === 'directory') mkdirSync(join(f.dst, path));
      else writeFileSync(join(f.dst, path), 'fictional internal fixture');
      assert.throws(() => verifyArtifact(f.src, f.dst), /Forbidden artifact path/);
    });
  }

  test(`symlink alias cannot publish internal path ${path}`, t => {
    const f = fixture(t); f.write(`${path}/nested/development.txt`);
    symlinkSync(join(f.src, path), join(f.src, 'public-alias'));
    assert.throws(() => buildArtifact(f.src, f.dst), /Symlinks/);
  });
}

test('binary bytes and all public filenames survive copying', t => {
  const f = fixture(t); f.write('assets/фото.webp', Buffer.from([0, 255, 13, 10, 127]));
  buildArtifact(f.src, f.dst);
  assert.deepEqual(inventory(f.dst), inventory(f.src, { source: true }));
});

test('empty offline directories are not carried into the artifact', t => {
  const f = fixture(t); mkdirSync(join(f.src, 'offline-tools'));
  buildArtifact(f.src, f.dst); assert.equal(existsSync(join(f.dst, 'offline-tools')), false);
  mkdirSync(join(f.dst, 'coordinator-demo'));
  assert.throws(() => verifyArtifact(f.src, f.dst), /Forbidden/);
});

for (const change of ['missing', 'changed', 'extra', 'offline', 'hidden']) {
  test(`verification rejects ${change} artifact content`, t => {
    const f = fixture(t); buildArtifact(f.src, f.dst);
    if (change === 'missing') rmSync(join(f.dst, 'index.html'));
    if (change === 'changed') writeFileSync(join(f.dst, 'index.html'), 'wrong');
    if (change === 'extra') writeFileSync(join(f.dst, 'unexpected.html'), 'wrong');
    if (change === 'offline') mkdirSync(join(f.dst, 'offline-tools'));
    if (change === 'hidden') writeFileSync(join(f.dst, '.unexpected'), 'wrong');
    assert.throws(() => verifyArtifact(f.src, f.dst));
  });
}

test('source changes after staging are detected', t => {
  const f = fixture(t); buildArtifact(f.src, f.dst); f.write('index.html', 'new version');
  assert.throws(() => verifyArtifact(f.src, f.dst), /inventory differs/);
});

test('unsafe or occupied output paths are rejected without deleting anything', t => {
  const f = fixture(t);
  for (const dst of [f.src, join(f.src, 'nested'), f.root]) assert.throws(() => buildArtifact(f.src, dst), /outside/);
  mkdirSync(f.dst); writeFileSync(join(f.dst, 'keep'), 'keep');
  assert.throws(() => buildArtifact(f.src, f.dst), /must not exist/);
  assert.equal(readFileSync(join(f.dst, 'keep'), 'utf8'), 'keep');
});

test('symlink aliases cannot reintroduce excluded content or escape output boundary', t => {
  const f = fixture(t); f.write('offline-tools/tool/index.html');
  symlinkSync(join(f.src, 'offline-tools/tool'), join(f.src, 'alias'));
  assert.throws(() => buildArtifact(f.src, f.dst), /Symlinks/);
  symlinkSync(f.src, join(f.root, 'source-link'));
  assert.throws(() => buildArtifact(f.src, join(f.root, 'source-link/out')), /outside/);
});

test('missing index fails before an output directory is created', t => {
  const f = fixture(t); rmSync(join(f.src, 'index.html'));
  assert.throws(() => buildArtifact(f.src, f.dst), /Missing index/);
  assert.equal(existsSync(f.dst), false);
});

test('full checkout staging preserves the complete non-hidden public inventory', t => {
  const f = fixture(t); const result = buildArtifact(repo, f.dst);
  assert.deepEqual(inventory(f.dst), publicationInventory(repo));
  const previousFiles = archiveFiles(repo, join(f.root, 'previous.tar'));
  const stagedFiles = archiveFiles(f.dst, join(f.root, 'staged.tar'));
  assert.deepEqual(stagedFiles, [...previousFiles.filter(path => !excludedPublicPath.test(path)),
    ...coordinatorRuntime.map(name => 'tools/coordinator/' + name)].sort());
  for (const path of ['index.html', 'sw.js', 'manifest.webmanifest', 'apply/index.html',
    'apply/pdf/index.html', 'assets/primserv-logo.svg', 'data/content.js']) {
    assert.ok(existsSync(join(f.dst, path)), path);
  }
  assert.ok(result.files > 200); assert.ok(result.bytes > 0);
});

test('PR and deploy workflows validate the same staging path used for upload', () => {
  const pages = readFileSync(join(repo, '.github/workflows/pages.yml'), 'utf8');
  const pr = readFileSync(join(repo, '.github/workflows/check-pr.yml'), 'utf8');
  for (const workflow of [pages, pr]) {
    assert.ok(workflow.includes('node --test scripts/pages-artifact.test.mjs'));
    assert.ok(workflow.includes('node scripts/build-pages-artifact.mjs build "$GITHUB_WORKSPACE" "$RUNNER_TEMP/primserv-pages"'));
    assert.ok(workflow.includes('node scripts/build-pages-artifact.mjs verify "$GITHUB_WORKSPACE" "$RUNNER_TEMP/primserv-pages"'));
  }
  assert.match(pages, /path: "\$\{\{ runner\.temp \}\}\/primserv-pages"/);
  assert.doesNotMatch(pages, /path: "\."/);
  const deploy = pages.slice(pages.indexOf('  deploy:'));
  assert.ok(deploy.indexOf('actions/setup-node@') < deploy.indexOf('build-pages-artifact.mjs build'));
  assert.ok(deploy.indexOf('build-pages-artifact.mjs verify') < deploy.indexOf('actions/upload-pages-artifact@'));
});


function toolFixture(f) {
  f.write('.github/public-tools.json', '{"coordinator":true}');
  for (const name of coordinatorRuntime) f.write('coordinator-demo/' + name, 'safe-' + name);
  f.write('coordinator-demo/test.cjs', 'do not publish');
  f.write('coordinator-demo/browser-acceptance.mjs', 'do not publish');
  f.write('coordinator-demo/private/trace.json', 'do not publish');
}
test('only five declared tool files are copied with exact bytes', t => {
  const f=fixture(t); toolFixture(f); buildArtifact(f.src,f.dst);
  assert.deepEqual(inventory(f.dst).map(x=>x.path), ['index.html',...coordinatorRuntime.map(x=>'tools/coordinator/'+x)].sort());
  for(const name of coordinatorRuntime) assert.deepEqual(readFileSync(join(f.dst,'tools/coordinator',name)),readFileSync(join(f.src,'coordinator-demo',name)));
  assert.equal(existsSync(join(f.dst,'coordinator-demo')),false);
  assert.equal(existsSync(join(f.dst,'.github')),false);
});
for(const change of ['missing','symlink','collision','manifest']) test('tool build rejects '+change,t=>{
  const f=fixture(t);toolFixture(f);
  if(change==='missing') rmSync(join(f.src,'coordinator-demo/model.js'));
  if(change==='symlink') {rmSync(join(f.src,'coordinator-demo/model.js'));symlinkSync(join(f.src,'index.html'),join(f.src,'coordinator-demo/model.js'));}
  if(change==='collision') f.write('tools/coordinator/index.html','conflict');
  if(change==='manifest') f.write('.github/public-tools.json','{"backend":true}');
  assert.throws(()=>buildArtifact(f.src,f.dst));assert.equal(existsSync(f.dst),false);
});
test('verification rejects extra module evidence in generated public path',t=>{
 const f=fixture(t);toolFixture(f);buildArtifact(f.src,f.dst);
 writeFileSync(join(f.dst,'tools/coordinator/trace.json'),'private');
 assert.throws(()=>verifyArtifact(f.src,f.dst),/inventory differs/);
});
