import { rmSync } from 'node:fs';
import { expect, launch, scratchDir, startSite, test } from './fixtures';

type Records = Record<string, { url: string; created: number | null }>;

test('tab ages survive a browser restart with session restore', async () => {
  const { origin, server } = await startSite();
  const profile = scratchDir('autopsy-restart-');

  const records = async (ext: Awaited<ReturnType<typeof launch>>) =>
    (await ext.worker.evaluate(
      async () => (await chrome.storage.local.get('tabState')).tabState.records
    )) as Records;
  const byUrl = (recs: Records) =>
    Object.fromEntries(
      Object.values(recs)
        .filter(r => r.url.startsWith(origin))
        .map(r => [r.url, r.created])
    );

  try {
    const first = await launch(profile);
    for (const name of ['red', 'green', 'blue']) {
      const page = await first.context.newPage();
      await page.goto(`${origin}/${name}`);
    }
    await expect.poll(async () => Object.keys(byUrl(await records(first))).length).toBe(3);
    const before = byUrl(await records(first));
    expect(Object.values(before).every(c => typeof c === 'number')).toBe(true);
    // Give Chrome time to write its session file before quitting.
    await first.context.pages()[0].waitForTimeout(1500);
    await first.context.close();

    const second = await launch(profile, ['--restore-last-session']);
    await expect
      .poll(async () => {
        const tabs = await second.worker.evaluate(async () =>
          (await chrome.tabs.query({})).map(t => t.url ?? '')
        );
        return tabs.filter(u => u.startsWith(origin)).length;
      })
      .toBe(3);
    await expect.poll(async () => byUrl(await records(second))).toEqual(before);
    await second.context.close();
  } finally {
    server.close();
    rmSync(profile, { recursive: true, force: true });
  }
});
