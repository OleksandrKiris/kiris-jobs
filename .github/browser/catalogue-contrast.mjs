// The causal RED input is historical; the PR event base still drives current upgrades.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
export const CONTRAST_REGRESSION = Object.freeze({
  ref: 'e2178458bf837f28eb0ad7912b6d442923d30c09',
  path: 'assets/homepage.css',
  sha256: '75a992d9c0fd680b1db5c003b9ac0c31b4d1ef9b41662ca072fd92ee3483c9d7'
});
export function assertContrastSource(bytes) {
  assert.equal(createHash('sha256').update(bytes).digest('hex'), CONTRAST_REGRESSION.sha256,
    'Contrast RED fixture must be the exact witnessed pre-fix stylesheet');
}
export function contrastRegressionStylesheet() {
  assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Historical fixture fetch belongs to the authorized CI runner');
  const git = args => execFileSync('git', args, { timeout: 60000, maxBuffer: 1024 * 1024 });
  let fetched = false;
  try { git(['cat-file', '-e', CONTRAST_REGRESSION.ref + '^{commit}']); }
  catch {
    git(['fetch', '--no-tags', '--depth=1', '--filter=blob:none', 'origin', CONTRAST_REGRESSION.ref]);
    fetched = true;
  }
  const bytes = git(['show', CONTRAST_REGRESSION.ref + ':' + CONTRAST_REGRESSION.path]);
  assertContrastSource(bytes);
  return { ...CONTRAST_REGRESSION, bytes, fetched };
}
export function assertContrastRegressionRows(rows, eventBase) {
  assert.match(eventBase, /^[0-9a-f]{40}$/);
  assert.deepEqual(rows?.map(row => row.width).sort((a,b) => a-b), [320,1280]);
  for (const row of rows) {
    assert.equal(row.base, eventBase, 'Current event base must remain explicit');
    assert.equal(row.regressionRef, CONTRAST_REGRESSION.ref, 'RED source must remain separate from event base');
    assert.equal(row.stylesheetSHA256, CONTRAST_REGRESSION.sha256);
    assert.equal(row.status, 'expected-failure-observed');
    assert.ok(Number.isFinite(row.button?.ratio) && row.button.ratio < 4.5,
      'The witnessed old stylesheet must still expose unreadable contrast');
  }
}
