import { afterEach, describe, expect, test } from 'bun:test';
import { createServer, type Server, type ServerResponse } from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { createLensService, type LensService } from '../src/service/app.ts';
import type { LensSnapshot, LensStrip } from '../src/shared/types.ts';
import {
  active,
  childMessages,
  childSession,
  diff,
  grandchildSession,
  models,
  rootMessages,
  rootSession,
} from './fixtures.ts';

type Envelope<T> = { data?: T; error?: { code: string; message: string } | null };

type FakeUpstream = {
  url: string;
  server: Server;
  eventReady: Promise<void>;
  setToolStatus: (status: string) => void;
  emit: (event: unknown) => void;
  close: () => Promise<void>;
};

const listen = (server: Server): Promise<number> =>
  new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolve(typeof address === 'object' && address ? address.port : 0);
    });
  });

const createFakeUpstream = async (options: { auth?: boolean; partial?: boolean } = {}): Promise<FakeUpstream> => {
  let toolStatus = 'running';
  let eventResponse: ServerResponse | null = null;
  let readyResolve: (() => void) | null = null;
  const eventReady = new Promise<void>((resolve) => {
    readyResolve = resolve;
  });

  const json = (res: ServerResponse, body: unknown, status = 200): void => {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  const messages = (id: string) => {
    if (id === 'ses_child') return childMessages;
    if (id === 'ses_grand') return [];
    return rootMessages.map((message) => ({
      ...message,
      content: message.content?.map((part) =>
        part.type === 'tool' && part.name === 'shell'
          ? { ...part, state: { ...part.state, status: toolStatus } }
          : part,
      ),
    }));
  };

  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');

    if (url.pathname === '/api/event') {
      res.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      eventResponse = res;
      readyResolve?.();
      return;
    }

    if (options.auth) {
      json(res, { error: 'auth' }, 401);
      return;
    }

    if (url.pathname === '/api/session/active') {
      json(res, { data: active });
      return;
    }
    if (url.pathname === '/api/session') {
      json(res, { data: [rootSession, childSession, grandchildSession], cursor: {} });
      return;
    }
    if (url.pathname === '/api/session/ses_root') {
      json(res, { data: rootSession });
      return;
    }
    if (url.pathname === '/api/session/ses_root/message') {
      json(res, { data: messages('ses_root') });
      return;
    }
    if (url.pathname === '/api/session/ses_child/message') {
      json(res, { data: messages('ses_child') });
      return;
    }
    if (url.pathname === '/api/session/ses_grand/message') {
      json(res, { data: [] });
      return;
    }
    if (url.pathname === '/api/session/ses_root/diff') {
      json(res, {
        data: [
          ...diff,
          { file: 'node_modules/pkg/index.js', patch: '+noise\n' },
          { file: '.openchamber/screenshots/shot.jpg', patch: 'binary\n' },
        ],
      });
      return;
    }
    if (url.pathname === '/api/model') {
      if (options.partial) {
        json(res, { error: 'models unavailable' }, 500);
        return;
      }
      json(res, { data: models });
      return;
    }

    json(res, { error: 'not found' }, 404);
  });

  const url = `http://127.0.0.1:${await listen(server)}`;

  return {
    url,
    server,
    eventReady,
    setToolStatus: (status) => {
      toolStatus = status;
    },
    emit: (event) => {
      eventResponse?.write(`data: ${JSON.stringify(event)}\n\n`);
    },
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
};

const tempDir = (): Promise<string> => mkdtemp(path.join(os.tmpdir(), 'lens-test-'));

const services: LensService[] = [];
const upstreams: FakeUpstream[] = [];

const startService = async (options: {
  dataDir?: string;
  baseUrl?: string | null;
  upstream?: FakeUpstream;
}): Promise<{ service: LensService; base: string }> => {
  const service = createLensService({
    port: 0,
    token: 'test-token',
    dataDir: options.dataDir ?? (await tempDir()),
    baseUrl: options.baseUrl,
    idleExitMs: 0,
    sse: true,
  });
  services.push(service);
  const port = await service.start();
  return { service, base: `http://127.0.0.1:${port}` };
};

const getJson = async <T>(base: string, pathname: string, token = 'test-token'): Promise<Envelope<T>> => {
  const response = await fetch(`${base}${pathname}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  return (await response.json()) as Envelope<T>;
};

afterEach(async () => {
  for (const service of services.splice(0)) {
    service.server.closeAllConnections();
    await service.stop();
  }
  for (const upstream of upstreams.splice(0)) await upstream.close();
});

describe('Lens service', () => {
  test('builds a full snapshot from the local API', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const result = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(result.error).toBeNull();
    expect(result.data?.session.title).toBe('Sessão de teste');
    expect(result.data?.session.context.percent).toBe(53);
    expect(result.data?.turns).toHaveLength(2);
    expect(result.data?.agents.map((agent) => agent.id)).toEqual(['ses_root', 'ses_child', 'ses_grand']);
    expect(result.data?.diff.map((file) => file.path)).not.toContain('node_modules/pkg/index.js');
    expect(result.data?.diff.map((file) => file.path)).not.toContain('.openchamber/screenshots/shot.jpg');
    expect(result.data?.diff).toHaveLength(3);
  });

  test('answers health without touching upstream', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const response = await fetch(`${base}/health`, { headers: { authorization: 'Bearer test-token' } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test('serves the compact strip payload', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const result = await getJson<LensStrip>(base, '/strip?sessionId=ses_root');
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      sessionId: 'ses_root',
      contextPercent: 53,
      runningAgents: 1,
      changedFiles: 3,
    });
  });

  test('rejects a request without the service token', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const response = await fetch(`${base}/snapshot?sessionId=ses_root`);
    expect(response.status).toBe(401);
  });

  test('surfaces an auth-required upstream', async () => {
    const upstream = await createFakeUpstream({ auth: true });
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const result = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('auth-required');
  });

  test('reports no-server when discovery finds nothing', async () => {
    const { base } = await startService({ dataDir: await tempDir(), baseUrl: null });
    const result = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(result.data).toBeNull();
    expect(result.error?.code).toBe('no-server');
  });

  test('discovers the desktop port from settings.json', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const dataDir = await tempDir();
    const port = new URL(upstream.url).port;
    await writeFile(path.join(dataDir, 'settings.json'), JSON.stringify({ desktopLocalPort: Number(port) }));

    const { base } = await startService({ dataDir, baseUrl: null });
    const result = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(result.error).toBeNull();
    expect(result.data?.session.title).toBe('Sessão de teste');
  });

  test('invalidates the cache when an SSE event arrives', async () => {
    const upstream = await createFakeUpstream();
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const first = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(first.data?.turns[1]?.failures).toBe(0);

    await upstream.eventReady;
    upstream.setToolStatus('failed');
    upstream.emit({ type: 'session.tool.success', data: { sessionID: 'ses_root' } });
    await new Promise((resolve) => setTimeout(resolve, 150));

    const second = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(second.data?.turns[1]?.failures).toBe(1);
  });

  test('keeps partial data when the model catalog fails', async () => {
    const upstream = await createFakeUpstream({ partial: true });
    upstreams.push(upstream);
    const { base } = await startService({ baseUrl: upstream.url });

    const result = await getJson<LensSnapshot>(base, '/snapshot?sessionId=ses_root');
    expect(result.error).toBeNull();
    expect(result.data?.session.context.limit).toBeNull();
    expect(result.data?.session.context.percent).toBeNull();
  });
});
