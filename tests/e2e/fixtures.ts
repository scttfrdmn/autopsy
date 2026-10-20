import {
  test as base,
  expect as baseExpect,
  chromium,
  type BrowserContext,
  type Page,
  type Worker,
} from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const DIST = resolve(import.meta.dirname, '../../dist');

/** Scratch space for browser profiles: ~/.xtmp when available (large external disk), else the OS temp dir. */
export function scratchDir(prefix: string): string {
  const xtmp = join(homedir(), '.xtmp');
  return mkdtempSync(join(existsSync(xtmp) ? xtmp : tmpdir(), prefix));
}

export async function launch(
  userDataDir: string,
  extraArgs: string[] = []
): Promise<{ context: BrowserContext; worker: Worker; extensionId: string }> {
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: true,
    channel: 'chromium',
    args: [`--disable-extensions-except=${DIST}`, `--load-extension=${DIST}`, ...extraArgs],
  });
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  // Wait for the worker to finish its first initialization; tabs opened before that are
  // treated as pre-existing (unknown age), as they would be for a fresh install.
  await baseExpect
    .poll(() =>
      worker.evaluate(async () => (await chrome.storage.local.get('schemaVersion')).schemaVersion)
    )
    .toBe(2);
  return { context, worker, extensionId: new URL(worker.url()).host };
}

/** Tiny local site so tests don't depend on the network. */
export async function startSite(): Promise<{ origin: string; server: Server }> {
  const server = createServer((req, res) => {
    const name = (req.url ?? '/').split('?')[0].replace(/\W/g, '') || 'home';
    res.writeHead(200, {
      'content-type': 'text/html',
      'content-length': String(200 + name.length),
    });
    res.end(
      `<!doctype html><title>Page ${name}</title><p>${name}</p>`.padEnd(200 + name.length, ' ')
    );
  });
  await new Promise<void>(r => server.listen(0, '127.0.0.1', r));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('no port');
  return { origin: `http://127.0.0.1:${address.port}`, server };
}

export async function openPopup(context: BrowserContext, extensionId: string): Promise<Page> {
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/index.html`);
  return popup;
}

interface Fixtures {
  site: string;
  ext: { context: BrowserContext; worker: Worker; extensionId: string };
  pageErrors: string[];
}

export const test = base.extend<Fixtures>({
  site: async ({}, use) => {
    const { origin, server } = await startSite();
    await use(origin);
    server.close();
  },
  ext: async ({}, use) => {
    const dir = scratchDir('autopsy-e2e-');
    const ext = await launch(dir);
    await use(ext);
    await ext.context.close();
    rmSync(dir, { recursive: true, force: true });
  },
  pageErrors: async ({ ext }, use) => {
    const errors: string[] = [];
    ext.context.on('weberror', e => errors.push(e.error().message));
    await use(errors);
  },
});

export const expect = baseExpect;
