import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, test } from 'bun:test';

import { discoverBaseUrl } from '../src/service/discovery.ts';

const temp = () => mkdtemp(path.join(os.tmpdir(), 'lens-discovery-'));

describe('discoverBaseUrl', () => {
  test('reads desktopLocalPort from settings.json', async () => {
    const dir = await temp();
    await writeFile(path.join(dir, 'settings.json'), JSON.stringify({ desktopLocalPort: 57123 }));
    expect(await discoverBaseUrl({ dataDir: dir })).toBe('http://127.0.0.1:57123');
  });

  test('reads the newest run instance', async () => {
    const dir = await temp();
    await writeFile(
      path.join(dir, 'run-openchamber.json'),
      JSON.stringify({ port: 3001 }),
    );
    const runDir = path.join(dir, 'run');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(runDir));
    await writeFile(path.join(runDir, 'openchamber-3001.json'), JSON.stringify({ port: 3001 }));
    await writeFile(path.join(runDir, 'openchamber-3002.json'), JSON.stringify({ port: 3002 }));
    expect(await discoverBaseUrl({ dataDir: dir })).toBe('http://127.0.0.1:3002');
  });

  test('accepts an explicit loopback override', async () => {
    const dir = await temp();
    expect(await discoverBaseUrl({ dataDir: dir, explicit: 'http://127.0.0.1:4444/' })).toBe(
      'http://127.0.0.1:4444',
    );
  });

  test('rejects a non-loopback override', async () => {
    const dir = await temp();
    expect(await discoverBaseUrl({ dataDir: dir, explicit: 'http://example.com:4444' })).toBeNull();
  });

  test('returns null when nothing is found', async () => {
    expect(await discoverBaseUrl({ dataDir: await temp() })).toBeNull();
  });
});
