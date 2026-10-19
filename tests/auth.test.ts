import { describe, expect, test } from 'bun:test';

import { UpstreamClient } from '../src/service/upstream.ts';
import { discoverServer } from '../src/service/discovery.ts';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

describe('UpstreamClient auth', () => {
  test('sends a bearer token from desktop settings', async () => {
    let auth = '';
    const fetchImpl = async (_input: string | URL, init?: RequestInit) => {
      auth = String((init?.headers as Record<string, string> | undefined)?.authorization ?? '');
      return new Response(JSON.stringify({ data: { id: 'ses_test' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const client = new UpstreamClient('http://127.0.0.1:1', fetchImpl, () => 0, {
      kind: 'bearer',
      token: 'tok',
    });
    await client.getSession('ses_test');
    expect(auth).toBe('Bearer tok');
  });

  test('logs in with the serve password and reuses the session cookie', async () => {
    const seen: Array<{ path: string; cookie: string }> = [];
    const fetchImpl = async (input: string | URL, init?: RequestInit) => {
      const url = new URL(String(input));
      const headers = (init?.headers ?? {}) as Record<string, string>;
      seen.push({ path: url.pathname, cookie: headers.cookie ?? '' });
      if (url.pathname === '/auth/session') {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'set-cookie': 'oc_ui_session_123=abc; Path=/; HttpOnly' },
        });
      }
      return new Response(JSON.stringify({ data: { id: 'ses_test' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };
    const client = new UpstreamClient('http://127.0.0.1:1', fetchImpl, () => 0, {
      kind: 'password',
      password: 'pw',
    });
    await client.getSession('ses_test');
    await client.getSession('ses_test');
    expect(seen[0]?.path).toBe('/auth/session');
    expect(seen[1]?.cookie).toContain('oc_ui_session_123=abc');
    expect(seen.filter((entry) => entry.path === '/auth/session')).toHaveLength(1);
  });
});

describe('discoverServer auth', () => {
  test('reads the desktop bearer token', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'lens-auth-'));
    await writeFile(
      path.join(dir, 'settings.json'),
      JSON.stringify({ desktopLocalPort: 57123, desktopLocalClientToken: 'tok' }),
    );
    expect(await discoverServer({ dataDir: dir })).toEqual({
      baseUrl: 'http://127.0.0.1:57123',
      auth: { kind: 'bearer', token: 'tok' },
    });
  });

  test('reads the serve password from the run file', async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'lens-auth-'));
    const run = path.join(dir, 'run');
    await mkdir(run);
    await writeFile(
      path.join(run, 'openchamber-3001.json'),
      JSON.stringify({ port: 3001, uiPassword: 'secret' }),
    );
    expect(await discoverServer({ dataDir: dir })).toEqual({
      baseUrl: 'http://127.0.0.1:3001',
      auth: { kind: 'password', password: 'secret' },
    });
  });
});
