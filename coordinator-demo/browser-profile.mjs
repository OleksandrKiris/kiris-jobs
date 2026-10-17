import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Each scenario owns a new on-disk profile, never a developer's browser profile.
// Reopening uses Chromium's real storage; there is no storageState export/import.
export async function createFileProfile(chromium, viewport) {
  const directory = await mkdtemp(join(tmpdir(), 'coordinator-file-profile-'));
  let context;
  const open = async () => {
    context = await chromium.launchPersistentContext(directory, { headless: true, viewport });
    return context;
  };
  const dispose = async () => {
    try { await context?.close(); }
    finally { await rm(directory, { recursive: true, force: true }); }
  };
  try { await open(); }
  catch (error) { await dispose(); throw error; }
  return {
    directory,
    get context() { return context; },
    async reopen() {
      await context.close();
      context = undefined;
      return open();
    },
    dispose
  };
}
