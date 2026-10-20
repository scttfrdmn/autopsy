#!/usr/bin/env node
// Zip dist/ into autopsy-v<version>.zip for the Chrome Web Store.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(root, 'dist', 'manifest.json'), 'utf8'));

if (pkg.version !== manifest.version) {
  console.error(`Version mismatch: package.json ${pkg.version}, manifest ${manifest.version}`);
  process.exit(1);
}

const zip = join(root, `autopsy-v${pkg.version}.zip`);
if (existsSync(zip)) rmSync(zip);
execFileSync('zip', ['-r', '-X', '-q', zip, '.', '-x', '.*'], { cwd: join(root, 'dist'), stdio: 'inherit' });
console.log(`Created ${zip}`);
