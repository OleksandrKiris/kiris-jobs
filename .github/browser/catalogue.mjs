// Authorized current scope is explicit; unchanged full assertions are preserved.
import assert from 'node:assert/strict';
assert.equal(process.env.GITHUB_ACTIONS, 'true', 'Use the authorized CI runner');
if (process.argv.includes('--full')) await import('./catalogue-full.mjs');
else await import('./coordinator-composite.mjs');
