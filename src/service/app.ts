import http from 'node:http';

import { buildSnapshot, buildStrip, descendantSessions } from '../shared/derive.ts';
import type {
  LensError,
  LensErrorCode,
  RawActive,
  RawDiff,
  RawMessage,
  RawModel,
  RawSession,
  SnapshotResponse,
  StripResponse,
} from '../shared/types.ts';
import { defaultDataDir, discoverBaseUrl } from './discovery.ts';
import { EventStream } from './events.ts';
import { UpstreamClient, UpstreamError, type FetchLike } from './upstream.ts';

export type LensServiceConfig = {
  port: number;
  token: string;
  dataDir?: string;
  host?: string;
  baseUrl?: string | null;
  fetchImpl?: FetchLike;
  now?: () => number;
  idleExitMs?: number;
  onIdle?: () => void;
  sse?: boolean;
};

export type LensService = {
  server: http.Server;
  start: () => Promise<number>;
  stop: () => Promise<void>;
  handle: (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void>;
};

const MAX_CHILD_MESSAGES = 12;
const MESSAGES_FOR_STRIP = 20;

const errorOf = (code: LensErrorCode, message: string): LensError => ({ code, message });

const isAuth = (error: unknown): boolean =>
  error instanceof UpstreamError && error.code === 'auth-required';

const soft = async <T>(work: Promise<T>, fallback: T): Promise<T> => {
  try {
    return await work;
  } catch (error) {
    if (isAuth(error)) throw error;
    return fallback;
  }
};

export const createLensService = (config: LensServiceConfig): LensService => {
  const now = config.now ?? Date.now;
  const host = config.host ?? '127.0.0.1';
  const dataDir = config.dataDir ?? defaultDataDir();
  let upstream: UpstreamClient | null = null;
  let events: EventStream | null = null;
  let baseUrl: string | null = null;
  let baseAt = 0;
  let idle: ReturnType<typeof setTimeout> | null = null;

  const send = (res: http.ServerResponse, status: number, body: unknown): void => {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    res.end(payload);
  };

  const touch = (): void => {
    if (!config.idleExitMs) return;
    if (idle) clearTimeout(idle);
    idle = setTimeout(() => {
      void stop().finally(() => {
        if (config.onIdle) config.onIdle();
        else process.exit(0);
      });
    }, config.idleExitMs);
  };

  const resolveUpstream = async (): Promise<UpstreamClient> => {
    if (upstream && now() - baseAt < 5_000) return upstream;

    const discovered = await discoverBaseUrl({
      dataDir,
      explicit: config.baseUrl ?? null,
    });
    if (!discovered) throw new UpstreamError('no-server', 'Servidor local do OpenChamber não encontrado.');

    if (upstream && baseUrl === discovered) {
      baseAt = now();
      return upstream;
    }

    events?.stop();
    baseUrl = discovered;
    baseAt = now();
    upstream = new UpstreamClient(discovered, config.fetchImpl, now);
    if (config.sse !== false) {
      events = new EventStream(
        discovered,
        (event) => {
          const sessionId = typeof event.data?.sessionID === 'string' ? event.data.sessionID : undefined;
          upstream?.invalidate(sessionId);
        },
        config.fetchImpl,
      );
      events.start();
    }
    return upstream;
  };

  const loadMessages = async (
    client: UpstreamClient,
    session: RawSession,
    sessions: RawSession[],
    limit: number,
  ): Promise<Record<string, RawMessage[]>> => {
    const messages = await soft(client.getMessages(session.id, limit), []);
    const result: Record<string, RawMessage[]> = { [session.id]: messages };
    if (limit < 200) return result;

    const children = descendantSessions(session.id, sessions).slice(0, MAX_CHILD_MESSAGES);
    for (let index = 0; index < children.length; index += 4) {
      const batch = children.slice(index, index + 4);
      const rows = await Promise.all(
        batch.map(async (child) => [child.id, await soft(client.getMessages(child.id, 200), [])] as const),
      );
      for (const [id, childMessages] of rows) result[id] = childMessages;
    }
    return result;
  };

  const build = async (sessionId: string, strip: boolean): Promise<SnapshotResponse | StripResponse> => {
    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);

    const [sessions, active, models, diff] = await Promise.all([
      soft(client.listSessions(), [session] as RawSession[]),
      soft(client.getActive(), {} as RawActive),
      soft(client.getModels(), [] as RawModel[]),
      soft(client.getDiff(sessionId), [] as RawDiff[]),
    ]);

    const messagesBySession = await loadMessages(
      client,
      session,
      sessions,
      strip ? MESSAGES_FOR_STRIP : 200,
    );

    const snapshot = buildSnapshot({
      session,
      sessions,
      messagesBySession,
      diff,
      models,
      active,
      now: now(),
    });

    if (strip) return { data: buildStrip(snapshot), error: null };
    return { data: snapshot, error: null };
  };

  const handle = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    touch();

    if (req.headers.authorization !== `Bearer ${config.token}`) {
      send(res, 401, { data: null, error: errorOf('auth-required', 'Token do serviço inválido.') });
      return;
    }

    const url = new URL(req.url ?? '/', `http://${host}`);
    if (req.method !== 'GET') {
      send(res, 405, { data: null, error: errorOf('bad-answer', 'Método não permitido.') });
      return;
    }

    if (url.pathname === '/health') {
      send(res, 200, { ok: true });
      return;
    }

    if (url.pathname !== '/snapshot' && url.pathname !== '/strip') {
      send(res, 404, { data: null, error: errorOf('bad-answer', 'Rota desconhecida.') });
      return;
    }

    const sessionId = url.searchParams.get('sessionId')?.trim();
    if (!sessionId) {
      send(res, 400, { data: null, error: errorOf('bad-answer', 'sessionId é obrigatório.') });
      return;
    }

    try {
      const result = await build(sessionId, url.pathname === '/strip');
      send(res, 200, result);
    } catch (error) {
      if (error instanceof UpstreamError) {
        send(res, 200, { data: null, error: errorOf(error.code, error.message) });
        return;
      }
      send(res, 200, {
        data: null,
        error: errorOf('upstream-failed', error instanceof Error ? error.message : 'Falha inesperada.'),
      });
    }
  };

  const server = http.createServer((req, res) => {
    void handle(req, res);
  });

  const start = (): Promise<number> =>
    new Promise((resolve) => {
      server.listen(config.port, host, () => {
        const address = server.address();
        const port = typeof address === 'object' && address ? address.port : config.port;
        resolve(port);
      });
    });

  const stop = async (): Promise<void> => {
    if (idle) clearTimeout(idle);
    idle = null;
    events?.stop();
    events = null;
    upstream = null;
    baseUrl = null;
    server.close();
    server.closeAllConnections?.();
    await new Promise<void>((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.once('close', () => resolve());
    });
  };

  return { server, start, stop, handle };
};
