#!/usr/bin/env node
/**
 * Chrome Web Store publishing (API v2) via a service account.
 *
 *   npm run cws -- status              Show published and in-review versions
 *   npm run cws -- submit [--dry-run]  Upload autopsy-v<version>.zip and submit it for review
 *        [--staged]                    Stage after approval instead of going live automatically
 *   npm run cws -- cancel              Withdraw the pending submission
 *
 * Auth: no key file. Tokens come from `gcloud auth print-access-token` impersonating the
 * service account in scripts/cws.config.json, so your gcloud login needs
 * roles/iam.serviceAccountTokenCreator on it. The service account must be linked in the
 * Developer Dashboard (Account section).
 *
 * The API only handles the package. Listing text, screenshots and promo images are
 * edited in the Developer Dashboard (see STORE_LISTING.md).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(readFileSync(join(root, 'scripts', 'cws.config.json'), 'utf8'));
const API = 'https://chromewebstore.googleapis.com';
const item = `publishers/${config.publisherId}/items/${config.extensionId}`;

const [command = 'status', ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const staged = flags.includes('--staged');

function token() {
  return execFileSync(
    'gcloud',
    [
      'auth',
      'print-access-token',
      `--impersonate-service-account=${config.serviceAccount}`,
      '--scopes=https://www.googleapis.com/auth/chromewebstore',
    ],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
  ).trim();
}

async function call(method, url, { body, contentType } = {}) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      ...(contentType ? { 'Content-Type': contentType } : {}),
    },
    body,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const detail = data.error?.message ?? text;
    throw new Error(`${method} ${url.replace(API, '')} failed (${res.status}): ${detail}`);
  }
  return data;
}

const fetchStatus = () => call('GET', `${API}/v2/${item}:fetchStatus`);

function describe(rev) {
  if (!rev) return 'none';
  const versions = (rev.distributionChannels ?? []).map(c => `${c.crxVersion} (${c.deployPercentage ?? 100}%)`);
  return `${rev.state}${versions.length ? ` — ${versions.join(', ')}` : ''}`;
}

function printStatus(s) {
  console.log(`Item:       ${config.extensionId}`);
  console.log(`Published:  ${describe(s.publishedItemRevisionStatus)}`);
  console.log(`Submitted:  ${describe(s.submittedItemRevisionStatus)}`);
  if (s.lastAsyncUploadState) console.log(`Last upload: ${s.lastAsyncUploadState}`);
  if (s.takenDown) console.log('⚠ Item has been TAKEN DOWN for a policy violation.');
  if (s.warned) console.log('⚠ Item has a policy warning; it will be taken down if not resolved.');
}

const versionOf = rev => rev?.distributionChannels?.[0]?.crxVersion;

/** Compare dotted versions numerically. */
function newer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  }
  return false;
}

async function submit() {
  const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const zip = join(root, `autopsy-v${version}.zip`);
  if (!existsSync(zip)) throw new Error(`Missing ${zip}. Run \`npm run package\` first.`);
  const zipVersion = JSON.parse(execFileSync('unzip', ['-p', zip, 'manifest.json'], { encoding: 'utf8' })).version;
  if (zipVersion !== version) throw new Error(`Zip manifest is ${zipVersion}, package.json is ${version}.`);

  const status = await fetchStatus();
  printStatus(status);
  const published = versionOf(status.publishedItemRevisionStatus);
  const pending = status.submittedItemRevisionStatus;
  if (published && !newer(version, published)) {
    throw new Error(`Version ${version} is not newer than the published ${published}. Bump the version.`);
  }
  if (pending?.state === 'PENDING_REVIEW') {
    throw new Error(
      `Version ${versionOf(pending)} is already in review. Wait for it, or run \`npm run cws -- cancel\`.`
    );
  }

  if (dryRun) {
    console.log(`\nDry run: would upload ${zip} (${version}) and submit${staged ? ' (staged)' : ''}.`);
    return;
  }

  console.log(`\nUploading ${version}…`);
  let upload = await call('POST', `${API}/upload/v2/${item}:upload`, {
    body: readFileSync(zip),
    contentType: 'application/zip',
  });
  for (let i = 0; upload.uploadState === 'IN_PROGRESS' || upload.uploadState === 'UPLOAD_IN_PROGRESS'; i++) {
    if (i > 30) throw new Error('Upload still processing after 60s; check `npm run cws -- status`.');
    await new Promise(r => setTimeout(r, 2000));
    const s = await fetchStatus();
    upload = { ...upload, uploadState: s.lastAsyncUploadState };
  }
  if (upload.uploadState !== 'SUCCEEDED') throw new Error(`Upload ${upload.uploadState}`);
  console.log(`Uploaded ${upload.crxVersion ?? version}.`);

  const result = await call('POST', `${API}/v2/${item}:publish`, {
    body: JSON.stringify({ publishType: staged ? 'STAGED_PUBLISH' : 'DEFAULT_PUBLISH' }),
    contentType: 'application/json',
  });
  console.log(`Submitted: ${result.state}`);
  for (const w of result.warningInfo?.warnings ?? []) console.log(`⚠ ${w.reason}: ${w.description}`);
}

const commands = {
  status: async () => printStatus(await fetchStatus()),
  submit,
  cancel: async () => {
    await call('POST', `${API}/v2/${item}:cancelSubmission`);
    console.log('Submission cancelled.');
  },
};

if (!commands[command]) {
  console.error(`Unknown command "${command}". Use: status | submit [--dry-run] [--staged] | cancel`);
  process.exit(1);
}
if (!config.publisherId || config.publisherId.startsWith('<')) {
  console.error('Set publisherId in scripts/cws.config.json (Developer Dashboard → Publisher → Settings).');
  process.exit(1);
}
commands[command]().catch(err => {
  console.error(`✖ ${err.message}`);
  process.exit(1);
});
