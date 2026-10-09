import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const pkg = JSON.parse(await readFile('package.json', 'utf8'));
assert.ok(pkg.keywords.includes('pi-package'));
for (const file of pkg.pi.extensions) await access(file);
for (const host of ['@earendil-works/pi-ai', '@earendil-works/pi-coding-agent']) {
  assert.equal(pkg.peerDependencies[host], '*');
  assert.equal(pkg.dependencies?.[host], undefined, 'Host libraries must not be bundled');
}
const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { encoding: 'utf8' }));
const paths = new Set(pack.files.map(file => file.path));
for (const required of ['src/index.ts', 'src/catalog.ts', 'src/provider.ts', 'src/bootstrap.ts', 'LICENSE', 'NOTICE', 'README.md', 'docs/assets/hero.png']) assert.ok(paths.has(required), `Missing shipped file: ${required}`);
for (const path of paths) assert.ok(!/node_modules|\.env|^test\/|package-lock/.test(path), `Unexpected published file: ${path}`);
for (const asset of ['hero.png', 'social-card.png', 'walkthrough.png']) {
  const bytes = await readFile(`docs/assets/${asset}`);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.ok(bytes.readUInt32BE(16) >= 1000);
}
console.log(`Package guard passed: ${paths.size} distributable files, verified PNG assets.`);
