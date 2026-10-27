import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildPages } from '../scripts/build-pages.js';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'jetta-pages-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const directory of ['games', 'css', 'js', 'tests', 'node_modules', '.git']) {
    await mkdir(join(root, directory));
  }
  for (const [file, content] of [
    ['index.html', '<a href="games/arithmetic.html">Play</a>'],
    ['games/arithmetic.html', '<a href="../index.html">Home</a>'],
    ['css/style.css', 'body { color: blue; }'],
    ['js/theme.js', 'console.log("public");'],
    ['.env', 'placeholder'],
    ['js/.env.local', 'placeholder'],
    ['js/private.key', 'placeholder'],
    ['js/settings.json', '{}'],
    ['README.md', 'not a site asset'],
    ['node_modules/package.json', '{}'],
    ['tests/sample.test.js', 'not a site asset'],
    ['.git/config', 'not a site asset'],
  ])
    await writeFile(join(root, file), content);
  return root;
}

test('Pages packaging includes public assets and excludes local files and dependencies', async (t) => {
  const root = await fixture(t);
  const output = await buildPages(root);
  for (const path of [
    'index.html',
    'games/arithmetic.html',
    'css/style.css',
    'js/theme.js',
    '.nojekyll',
  ]) {
    await access(join(output, path));
  }
  assert.equal(
    await readFile(join(output, 'games/arithmetic.html'), 'utf8'),
    '<a href="../index.html">Home</a>',
  );
  for (const path of [
    '.env',
    'js/.env.local',
    'js/private.key',
    'js/settings.json',
    'README.md',
    'tests',
    'node_modules',
    '.git',
  ]) {
    await assert.rejects(access(join(output, path)), { code: 'ENOENT' });
  }
  await writeFile(join(output, 'stale.js'), 'stale artifact');
  await buildPages(root);
  await assert.rejects(access(join(output, 'stale.js')), { code: 'ENOENT' });
});

test('Pages packaging rejects source symlinks and missing entry pages', async (t) => {
  const root = await fixture(t);
  await symlink(join(root, '.env'), join(root, 'js/linked.js'));
  await assert.rejects(buildPages(root), /symbolic link/);
  await rm(join(root, 'js/linked.js'));
  await rm(join(root, 'index.html'));
  await assert.rejects(buildPages(root), { code: 'ENOENT' });
});

test('Pages packaging rejects a redirected artifact directory', async (t) => {
  const root = await fixture(t);
  await symlink(join(root, 'tests'), join(root, 'artifacts'));
  await assert.rejects(buildPages(root), /artifact directory cannot be a symbolic link/);
});
