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
