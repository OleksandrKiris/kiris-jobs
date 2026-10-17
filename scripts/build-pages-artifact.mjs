import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

// Match upload-pages-artifact@v5's default hidden-file exclusion, then exclude
// ONLY these two root-level applications. Never modify or delete source files.
export const offlineRoots = Object.freeze(['coordinator-demo', 'offline-tools']);
const inside = (parent, child) => {
  const rel = relative(parent, child);
  return rel === '' || (!rel.startsWith(`..${sep}`) && rel !== '..' && !isAbsolute(rel));
};

function roots(source, destination) {
  const src = realpathSync(source);
  const absolute = resolve(destination);
  const dst = existsSync(absolute) ? realpathSync(absolute)
    : join(realpathSync(dirname(absolute)), absolute.split(sep).at(-1));
  if (!lstatSync(src).isDirectory() || inside(src, dst) || inside(dst, src)) {
    throw new Error('Artifact must be outside the source tree, not its parent');
  }
  return { src, dst };
}

export function inventory(root, { source = false } = {}) {
  const files = [];
  const walk = (directory, prefix = '') => {
    for (const name of readdirSync(directory).sort()) {
      // The existing Pages action excludes dot paths at every depth.
      if (source && (name.startsWith('.') || (!prefix && offlineRoots.includes(name)))) continue;
      const path = prefix ? `${prefix}/${name}` : name;
      if (!source && (name.startsWith('.') || (!prefix && offlineRoots.includes(name)))) {
        throw new Error(`Forbidden artifact path: ${path}`);
      }
      const absolute = join(directory, name);
      const info = lstatSync(absolute);
      // No links in current source. Fail closed instead of following a future
      // link into an excluded application, a secret, or outside the checkout.
      if (info.isSymbolicLink()) throw new Error(`Symlinks are not supported: ${path}`);
      if (info.isDirectory()) walk(absolute, path);
      else if (info.isFile()) files.push({ path, bytes: info.size,
        sha256: createHash('sha256').update(readFileSync(absolute)).digest('hex') });
      else throw new Error(`Unsupported file type: ${path}`);
    }
  };
  walk(root);
  return files;
}

export function verifyArtifact(source, destination) {
  const { src, dst } = roots(source, destination);
  const expected = inventory(src, { source: true });
  const actual = inventory(dst);
  if (!expected.some(file => file.path === 'index.html')) throw new Error('Missing index.html');
  if (JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw new Error('Artifact inventory differs from source (paths, bytes or SHA-256)');
  }
  return { files: actual.length, bytes: actual.reduce((sum, file) => sum + file.bytes, 0) };
}

export function buildArtifact(source, destination) {
  const { src, dst } = roots(source, destination);
  if (existsSync(dst)) throw new Error('Artifact destination must not exist; use a fresh path');
  const files = inventory(src, { source: true });
  if (!files.some(file => file.path === 'index.html')) throw new Error('Missing index.html');
  mkdirSync(dst);
  for (const file of files) {
    const target = join(dst, ...file.path.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(src, ...file.path.split('/')), target);
  }
  return verifyArtifact(src, dst);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [command, source, destination, ...extra] = process.argv.slice(2);
  try {
    if (!['build', 'verify'].includes(command) || !source || !destination || extra.length) {
      throw new Error('Usage: node scripts/build-pages-artifact.mjs build|verify SOURCE DESTINATION');
    }
    const result = command === 'build' ? buildArtifact(source, destination) : verifyArtifact(source, destination);
    console.log(`Pages artifact ${command}: ${result.files} files, ${result.bytes} bytes; paths/SHA-256 verified`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
