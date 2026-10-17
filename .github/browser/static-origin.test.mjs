import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { staticOrigin } from './static-origin.mjs';

test('real HTTP cut targets each tool body, allows recovery, and stop closes the origin', async t => {
  const root = await mkdtemp(join(tmpdir(), 'primserv-http-cut-'));
  const files = ['index.html', 'model.js', 'app.js', 'style.css', 'primserv-logo.svg'];
  await mkdir(join(root, 'tools/coordinator'), { recursive: true });
  for (const file of files) await writeFile(join(root, 'tools/coordinator', file), 'fictional-' + file.repeat(20));
  const origin = staticOrigin(root, 0);
  t.after(async () => { await origin.stop(); await rm(root, { recursive: true, force: true }); });
  const base = await origin.start();
  for (const file of files) {
    const path = '/tools/coordinator/' + file;
    origin.cut(path);
    await assert.rejects(async () => (await fetch(base + path)).text(), undefined, file);
    assert.ok(origin.cuts.length > 0);
    assert.ok(origin.cuts.every(event => event.pathname === path && event.socketDestroyed
      && event.sentBytes > 0 && event.sentBytes < event.declaredBytes));
    const other = files.find(name => name !== file);
    assert.equal((await fetch(base + '/tools/coordinator/' + other)).status, 200);
    origin.clearCut();
    assert.equal(await (await fetch(base + path)).text(), 'fictional-' + file.repeat(20));
  }
  await origin.stop();
  await assert.rejects(fetch(base));
  const restarted = await origin.start();
  assert.equal((await fetch(restarted + '/tools/coordinator/app.js')).status, 200);
});
