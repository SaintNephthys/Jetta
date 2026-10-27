import { copyFile, lstat, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function copyPublicFile(source, destination) {
  const info = await lstat(source);
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new Error(`Only regular public files can be published: ${source}`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(source, destination);
}

async function copyDirectory(source, destination, extension) {
  const info = await lstat(source);
  if (!info.isDirectory() || info.isSymbolicLink()) {
    throw new Error(`Only regular public directories can be published: ${source}`);
  }
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const from = join(source, entry.name);
    const to = join(destination, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Cannot publish a symbolic link: ${from}`);
    if (entry.isDirectory()) await copyDirectory(from, to, extension);
    else if (extname(entry.name) === extension) await copyPublicFile(from, to);
  }
}

export async function buildPages(root = projectRoot) {
  const artifactRoot = join(root, 'artifacts');
  const info = await lstat(artifactRoot).catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (info?.isSymbolicLink()) throw new Error('The artifact directory cannot be a symbolic link');
  const output = join(artifactRoot, 'pages');
  await rm(output, { recursive: true, force: true });
  await copyPublicFile(join(root, 'index.html'), join(output, 'index.html'));
  for (const [directory, extension] of [
    ['games', '.html'],
    ['css', '.css'],
    ['js', '.js'],
  ]) {
    await copyDirectory(join(root, directory), join(output, directory), extension);
  }
  await writeFile(join(output, '.nojekyll'), '');
  return output;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`Pages artifact prepared at ${await buildPages()}`);
}
