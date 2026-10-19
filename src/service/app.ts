import http from 'node:http';
import path from 'node:path';

import { buildSnapshot, buildStrip, deriveDiff, deriveTurnDiff, descendantSessions } from '../shared/derive.ts';
import type {
  LensDiffFile,
  LensError,
  LensErrorCode,
  LensGitDiff,
  LensHistoryPoint,
  LensInventory,
  LensInventoryItem,
  LensInventorySection,
  LensTree,
  LensTreeEntry,
  RawActive,
  RawDiff,
  RawFsList,
  RawGitStatus,
  RawMessage,
  RawModel,
  RawSession,
  SnapshotResponse,
  StripResponse,
} from '../shared/types.ts';
import { defaultDataDir, discoverServer } from './discovery.ts';
import { EventStream } from './events.ts';
import { HistoryStore } from './history.ts';
import { UpstreamClient, UpstreamError, type FetchLike } from './upstream.ts';

export type LensServiceConfig = {
  port: number;
  token: string;
  dataDir?: string;
  historyDir?: string;
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
const GIT_FILE_LIMIT = 100;
const TREE_ENTRY_LIMIT = 500;
const INVENTORY_TTL = 30_000;
const BODY_LIMIT = 16_384;
const TREE_IGNORED = new Set([
  '.git',
  '.openchamber',
  '.opencode',
  '.scratch',
  'node_modules',
  '.next',
  '.nuxt',
  '.svelte-kit',
  '.venv',
  'venv',
  '__pycache__',
  'target',
  'coverage',
  '.cache',
]);

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

const readBody = (req: http.IncomingMessage): Promise<unknown> =>
  new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk: string) => {
      raw += chunk;
      if (raw.length > BODY_LIMIT) {
        reject(new UpstreamError('bad-answer', 'Corpo da requisição grande demais.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (raw.trim() === '') return resolve({});
      try {
        resolve(JSON.parse(raw) as unknown);
      } catch {
        reject(new UpstreamError('bad-answer', 'Corpo da requisição inválido.'));
      }
    });
    req.on('error', reject);
  });

const recordOf = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

export const createLensService = (config: LensServiceConfig): LensService => {
  const now = config.now ?? Date.now;
  const host = config.host ?? '127.0.0.1';
  const dataDir = config.dataDir ?? defaultDataDir();
  const history = new HistoryStore(config.historyDir ?? path.join(dataDir, 'lens-history'), now);
  let inventoryCache: { at: number; data: LensInventory } | null = null;
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

    const discovered = await discoverServer({
      dataDir,
      explicit: config.baseUrl ?? null,
    });
    if (!discovered) throw new UpstreamError('no-server', 'Servidor local do OpenChamber não encontrado.');

    if (upstream && baseUrl === discovered.baseUrl) {
      baseAt = now();
      return upstream;
    }

    events?.stop();
    baseUrl = discovered.baseUrl;
    baseAt = now();
    const client = new UpstreamClient(discovered.baseUrl, config.fetchImpl, now, discovered.auth);
    upstream = client;
    if (config.sse !== false) {
      events = new EventStream(
        discovered.baseUrl,
        (event) => {
          const sessionId = typeof event.data?.sessionID === 'string' ? event.data.sessionID : undefined;
          client.invalidate(sessionId);
        },
        config.fetchImpl,
        () => client.authHeaders(),
      );
      events.start();
    }
    return client;
  };

  const loadMessages = async (
    client: UpstreamClient,
    session: RawSession,
    sessions: RawSession[],
    limit: number,
  ): Promise<Record<string, RawMessage[]>> => {
    const messages =
      limit < 200
        ? await soft(client.getMessages(session.id, limit), [])
        : await soft(client.getConversation(session.id), []);
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
    await history.record(snapshot).catch(() => undefined);
    return { data: snapshot, error: null };
  };

  const gitDiff = async (sessionId: string): Promise<{ data: LensGitDiff | null; error: LensError | null }> => {
    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);
    const directory = session.location?.directory;
    if (!directory) throw new UpstreamError('bad-answer', 'Sessão sem diretório de projeto.');

    let status: RawGitStatus;
    try {
      status = await client.getGitStatus(directory);
    } catch (error) {
      if (
        error instanceof UpstreamError &&
        error.code === 'upstream-failed' &&
        /400/.test(error.message)
      ) {
        throw new UpstreamError('not-git', 'A sessão atual não está dentro de um repositório Git.');
      }
      throw error;
    }

    const files = (status.files ?? [])
      .filter((file) => typeof file.path === 'string' && file.path.length > 0)
      .slice(0, GIT_FILE_LIMIT);

    const raw: RawDiff[] = [];
    for (const file of files) {
      const path = file.path as string;
      const staged = typeof file.index === 'string' && ![' ', '?'].includes(file.index);
      const working =
        typeof file.working_dir === 'string' && ![' ', '?'].includes(file.working_dir);
      const untracked = file.index === '?' || file.working_dir === '?';
      const patches: string[] = [];

      if (staged) {
        const diff = await client.getGitDiff(directory, path, true).catch((error: unknown) => {
          if (isAuth(error)) throw error;
          return null;
        });
        if (diff?.diff) patches.push(diff.diff);
      }
      if (working || untracked || !staged) {
        const diff = await client.getGitDiff(directory, path).catch((error: unknown) => {
          if (isAuth(error)) throw error;
          return null;
        });
        if (diff?.diff) patches.push(diff.diff);
      }

      raw.push({ file: path, patch: patches.join('\n') });
    }

    return {
      data: {
        branch: status.current ?? null,
        tracking: status.tracking ?? null,
        ahead: status.ahead ?? 0,
        behind: status.behind ?? 0,
        clean: Boolean(status.isClean),
        files: deriveDiff(raw),
      },
      error: null,
    };
  };

  const turnDiff = async (sessionId: string, turn: number): Promise<{ data: LensDiffFile[] | null; error: LensError | null }> => {
    const client = await resolveUpstream();
    const messages = await client.getConversation(sessionId);
    return { data: deriveTurnDiff(messages, turn), error: null };
  };

  const tree = async (sessionId: string, requested: string | null): Promise<{ data: LensTree | null; error: LensError | null }> => {
    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);
    const directory = session.location?.directory;
    if (!directory) throw new UpstreamError('bad-answer', 'Sessão sem diretório de projeto.');

    const root = path.resolve(directory);
    const target = requested ? path.resolve(root, requested) : root;
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      throw new UpstreamError('bad-answer', 'Caminho fora do projeto.');
    }

    const listing: RawFsList = await client.getFsList(target);
    const gitFiles = new Map<string, string>();
    try {
      const status = await client.getGitStatus(directory);
      for (const file of status.files ?? []) {
        if (!file.path) continue;
        const mark = file.working_dir && file.working_dir !== ' ' && file.working_dir !== '?'
          ? file.working_dir
          : file.index;
        if (mark && mark !== ' ' && mark !== '?') gitFiles.set(file.path, mark);
      }
    } catch {
      // A project without Git still gets a tree, just without status marks.
    }

    const entries: LensTreeEntry[] = (listing.entries ?? [])
      .filter((entry) => typeof entry.name === 'string' && typeof entry.path === 'string')
      .filter((entry) => !TREE_IGNORED.has(entry.name as string))
      .slice(0, TREE_ENTRY_LIMIT)
      .map((entry) => {
        const absolute = entry.path as string;
        const relative = path.relative(root, absolute) || '.';
        const kind = entry.isDirectory
          ? 'directory'
          : entry.isSymbolicLink
            ? 'symlink'
            : 'file';
        return {
          name: entry.name as string,
          path: absolute,
          relative,
          kind,
          touched: false,
          ...(gitFiles.has(relative) ? { gitStatus: gitFiles.get(relative) } : {}),
        } as LensTreeEntry;
      })
      .sort((a, b) => {
        if ((a.kind === 'directory') !== (b.kind === 'directory')) return a.kind === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return {
      data: {
        path: path.relative(root, target) || '.',
        root,
        entries,
      },
      error: null,
    };
  };

  const inventory = async (sessionId: string): Promise<{ data: LensInventory | null; error: LensError | null }> => {
    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);
    const directory = session.location?.directory ?? undefined;
    const query = directory ? { directory } : undefined;

    if (inventoryCache && now() - inventoryCache.at < INVENTORY_TTL) {
      return { data: inventoryCache.data, error: null };
    }

    const [agents, commands, skills, plugins, mcp] = await Promise.all([
      soft(client.getData<unknown[]>('/api/agent', query), []),
      soft(client.getData<unknown[]>('/api/command', query), []),
      soft(client.getData<unknown[]>('/api/skill', query), []),
      soft(client.getData<unknown[]>('/api/plugin', query), []),
      soft(client.getData<unknown[]>('/api/mcp', query), []),
    ]);

    const rows = (value: unknown[]): Array<Record<string, unknown>> =>
      value.filter((entry): entry is Record<string, unknown> => recordOf(entry) !== null);

    const item = (
      name: string,
      description: string,
      meta: string,
      status: string,
      tone: LensInventoryItem['tone'] = 'muted',
    ): LensInventoryItem => ({ name, description, meta, status, tone });

    const agentItems = rows(agents)
      .filter((entry) => entry.hidden !== true)
      .slice(0, 200)
      .map((entry) => {
        const model = recordOf(entry.model);
        const modelName = model ? `${text(model.providerID)}/${text(model.id)}` : '';
        return item(
          text(entry.name) || text(entry.id) || '—',
          text(entry.description),
          `${text(entry.mode)}${modelName ? ` · ${modelName}` : ''}`,
          'disponível',
          'normal',
        );
      });

    const commandItems = rows(commands)
      .slice(0, 200)
      .map((entry) => item(text(entry.name) || '—', text(entry.description), 'comando', 'disponível', 'normal'));

    const skillItems = rows(skills)
      .slice(0, 200)
      .map((entry) => item(text(entry.name) || text(entry.id) || '—', text(entry.description), text(entry.path), 'disponível', 'muted'));

    const pluginItems = rows(plugins)
      .slice(0, 200)
      .map((entry) => {
        const source = recordOf(entry.source);
        const state = recordOf(entry.state);
        const status = text(state?.status) || '—';
        return item(
          text(entry.id) || '—',
          '',
          text(source?.type),
          status,
          status === 'active' || status === 'enabled' ? 'normal' : 'muted',
        );
      });

    const mcpItems = rows(mcp)
      .slice(0, 200)
      .map((entry) => {
        const status = recordOf(entry.status);
        const state = text(status?.status) || '—';
        const error = text(status?.error);
        return item(
          text(entry.name) || '—',
          error,
          'MCP',
          state,
          state === 'failed' ? 'danger' : state === 'connected' ? 'normal' : 'muted',
        );
      });

    const sections: LensInventorySection[] = [
      { id: 'agents', label: 'Agentes', count: agentItems.length, items: agentItems },
      { id: 'commands', label: 'Comandos', count: commandItems.length, items: commandItems },
      { id: 'skills', label: 'Skills', count: skillItems.length, items: skillItems },
      { id: 'mcp', label: 'MCP', count: mcpItems.length, items: mcpItems },
      { id: 'plugins', label: 'Plugins', count: pluginItems.length, items: pluginItems },
    ];

    const data = { sections };
    inventoryCache = { at: now(), data };
    return { data, error: null };
  };

  const text = (value: unknown): string => (typeof value === 'string' ? value : '');

  const interrupt = async (
    req: http.IncomingMessage,
    res: http.ServerResponse,
  ): Promise<void> => {
    const body = recordOf(await readBody(req));
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';
    const parentId = typeof body?.parentId === 'string' ? body.parentId.trim() : '';
    if (!sessionId || !parentId) {
      send(res, 200, { data: null, error: errorOf('bad-answer', 'sessionId e parentId são obrigatórios.') });
      return;
    }

    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);
    const sessions = await client.listSessions();
    const isChild = session.parentID !== null && session.parentID !== undefined;
    const isDescendant = descendantSessions(parentId, sessions).some((child) => child.id === sessionId);
    if (!isChild || !isDescendant) {
      send(res, 200, { data: null, error: errorOf('forbidden', 'Só subagentes da sessão atual podem ser interrompidos.') });
      return;
    }

    const interrupted = await client.interrupt(sessionId);
    client.invalidate(sessionId);
    send(res, 200, { data: { interrupted }, error: null });
  };

  const handle = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<void> => {
    touch();

    if (req.headers.authorization !== `Bearer ${config.token}`) {
      send(res, 401, { data: null, error: errorOf('auth-required', 'Token do serviço inválido.') });
      return;
    }

    const url = new URL(req.url ?? '/', `http://${host}`);

    if (req.method === 'POST' && url.pathname === '/interrupt') {
      try {
        await interrupt(req, res);
      } catch (error) {
        send(res, 200, {
          data: null,
          error: error instanceof UpstreamError ? errorOf(error.code, error.message) : errorOf('upstream-failed', 'Falha ao interromper.'),
        });
      }
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/history') {
      const sessionId = url.searchParams.get('sessionId')?.trim();
      if (!sessionId) {
        send(res, 400, { data: null, error: errorOf('bad-answer', 'sessionId é obrigatório.') });
        return;
      }
      await history.clear(sessionId);
      send(res, 200, { data: { cleared: true }, error: null });
      return;
    }

    if (req.method !== 'GET') {
      send(res, 405, { data: null, error: errorOf('bad-answer', 'Método não permitido.') });
      return;
    }

    if (url.pathname === '/health') {
      send(res, 200, { ok: true });
      return;
    }

    const supported = new Set(['/snapshot', '/strip', '/git-diff', '/turn-diff', '/history', '/tree', '/inventory']);
    if (!supported.has(url.pathname)) {
      send(res, 404, { data: null, error: errorOf('bad-answer', 'Rota desconhecida.') });
      return;
    }

    const sessionId = url.searchParams.get('sessionId')?.trim();
    if (!sessionId) {
      send(res, 400, { data: null, error: errorOf('bad-answer', 'sessionId é obrigatório.') });
      return;
    }

    try {
      if (url.pathname === '/git-diff') {
        send(res, 200, await gitDiff(sessionId));
        return;
      }
      if (url.pathname === '/turn-diff') {
        const turn = Number(url.searchParams.get('turn'));
        if (!Number.isInteger(turn) || turn <= 0) {
          send(res, 200, { data: null, error: errorOf('bad-answer', 'turn inválido.') });
          return;
        }
        send(res, 200, await turnDiff(sessionId, turn));
        return;
      }
      if (url.pathname === '/history') {
        const limit = Number(url.searchParams.get('limit') ?? '500');
        send(res, 200, {
          data: await history.read(sessionId, Number.isFinite(limit) ? limit : 500),
          error: null,
        });
        return;
      }
      if (url.pathname === '/tree') {
        send(res, 200, await tree(sessionId, url.searchParams.get('path')));
        return;
      }
      if (url.pathname === '/inventory') {
        send(res, 200, await inventory(sessionId));
        return;
      }
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
