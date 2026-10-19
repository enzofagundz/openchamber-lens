import type {
  LensErrorCode,
  RawActive,
  RawDiff,
  RawFsList,
  RawGitDiff,
  RawGitStatus,
  RawMessage,
  RawModel,
  RawSession,
} from '../shared/types.ts';
import type { DiscoveryAuth } from './discovery.ts';

export class UpstreamError extends Error {
  constructor(
    readonly code: LensErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'UpstreamError';
  }
}

type CacheEntry<T> = { value: T; at: number };

type Envelope<T> = {
  data?: T;
  cursor?: {
    next?: string;
  };
};

const TTL = {
  sessions: 2_000,
  active: 1_000,
  messages: 3_000,
  diff: 3_000,
  models: 60_000,
} as const;

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export class UpstreamClient {
  private sessionsCache: CacheEntry<RawSession[]> | null = null;
  private activeCache: CacheEntry<RawActive> | null = null;
  private modelCache: CacheEntry<RawModel[]> | null = null;
  private messageCache = new Map<string, CacheEntry<RawMessage[]>>();
  private conversationCache = new Map<string, CacheEntry<RawMessage[]>>();
  private diffCache = new Map<string, CacheEntry<RawDiff[]>>();

  constructor(
    readonly baseUrl: string,
    private readonly fetchImpl: FetchLike = fetch,
    private readonly now: () => number = Date.now,
    private readonly auth: DiscoveryAuth | null = null,
  ) {}

  private cookie: string | null = null;
  private authPromise: Promise<Record<string, string>> | null = null;

  async authHeaders(): Promise<Record<string, string>> {
    if (!this.auth) return {};
    if (this.auth.kind === 'bearer') return { authorization: `Bearer ${this.auth.token}` };
    if (this.cookie) return { cookie: this.cookie };
    if (this.authPromise) return this.authPromise;

    this.authPromise = (async () => {
      const response = await this.fetchImpl(new URL('/auth/session', this.baseUrl), {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({ password: this.auth && this.auth.kind === 'password' ? this.auth.password : '' }),
        signal: AbortSignal.timeout(5_000),
      }).catch(() => null);

      if (!response || !response.ok) {
        throw new UpstreamError('auth-required', 'O servidor local recusou a senha de acesso.');
      }

      const cookies = response.headers.getSetCookie?.() ?? [];
      const raw = response.headers.get('set-cookie') ?? '';
      const match = [...cookies, raw]
        .join(';')
        .match(/oc_ui_session(?:_\d+)?=[^;]+/);
      if (!match) throw new UpstreamError('auth-required', 'O servidor local não devolveu uma sessão.');
      this.cookie = match[0];
      return { cookie: this.cookie };
    })().finally(() => {
      this.authPromise = null;
    });

    return this.authPromise;
  }

  private async raw<T>(
    requestPath: string,
    query?: Record<string, string>,
    options?: { method?: 'GET' | 'POST'; body?: string },
  ): Promise<T> {
    const url = new URL(requestPath, this.baseUrl);
    for (const [key, value] of Object.entries(query ?? {})) url.searchParams.set(key, value);

    let response: Response;
    try {
      const method = options?.method ?? 'GET';
      const auth = await this.authHeaders();
      response = await this.fetchImpl(url, {
        method,
        headers: {
          accept: 'application/json',
          ...(method === 'POST' ? { 'content-type': 'application/json' } : {}),
          ...auth,
        },
        ...(options?.body !== undefined ? { body: options.body } : {}),
        signal: AbortSignal.timeout(5_000),
      });
    } catch (error) {
      if (error instanceof UpstreamError) throw error;
      throw new UpstreamError(
        'upstream-failed',
        error instanceof Error ? error.message : 'Falha ao falar com o servidor local.',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new UpstreamError('auth-required', 'O servidor local exige autenticação.');
    }
    if (response.status === 404) {
      throw new UpstreamError('session-not-found', 'Recurso não encontrado no servidor local.');
    }
    if (!response.ok) {
      throw new UpstreamError('upstream-failed', `O servidor local respondeu ${response.status}.`);
    }

    try {
      return (await response.json()) as T;
    } catch {
      throw new UpstreamError('bad-answer', 'O servidor local devolveu um JSON inválido.');
    }
  }

  private async data<T>(requestPath: string, query?: Record<string, string>): Promise<T> {
    const envelope = await this.raw<Envelope<T>>(requestPath, query);
    if (!envelope || typeof envelope !== 'object' || !('data' in envelope)) {
      throw new UpstreamError('bad-answer', 'Resposta sem o campo data.');
    }
    return envelope.data as T;
  }

  async getSession(id: string): Promise<RawSession> {
    const session = await this.data<RawSession>(`/api/session/${encodeURIComponent(id)}`);
    if (!session || typeof session !== 'object' || typeof session.id !== 'string') {
      throw new UpstreamError('bad-answer', 'Sessão sem id.');
    }
    return session;
  }

  async listSessions(): Promise<RawSession[]> {
    const current = this.now();
    if (this.sessionsCache && current - this.sessionsCache.at < TTL.sessions) return this.sessionsCache.value;

    const sessions: RawSession[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined;

    for (let page = 0; page < 5; page += 1) {
      const envelope = await this.raw<Envelope<RawSession[]>>('/api/session', {
        limit: '200',
        ...(cursor ? { cursor } : {}),
      });
      const rows = Array.isArray(envelope.data) ? envelope.data : [];
      for (const row of rows) {
        if (!row || typeof row.id !== 'string' || seen.has(row.id)) continue;
        seen.add(row.id);
        sessions.push(row);
      }
      cursor = envelope.cursor?.next;
      if (!cursor) break;
    }

    this.sessionsCache = { value: sessions, at: current };
    return sessions;
  }

  async getMessages(id: string, limit = 200): Promise<RawMessage[]> {
    const key = `${id}:${limit}`;
    const current = this.now();
    const cached = this.messageCache.get(key);
    if (cached && current - cached.at < TTL.messages) return cached.value;

    const messages = await this.data<RawMessage[]>(`/api/session/${encodeURIComponent(id)}/message`, {
      limit: String(limit),
    });
    if (!Array.isArray(messages)) throw new UpstreamError('bad-answer', 'Mensagens fora do formato.');
    this.messageCache.set(key, { value: messages, at: current });
    return messages;
  }

  /**
   * Reads enough pages to include the beginning of the oldest visible turn.
   * The endpoint returns newest-first pages; `cursor.next` walks to older pages.
   */
  async getConversation(id: string, maxPages = 5): Promise<RawMessage[]> {
    const current = this.now();
    const cached = this.conversationCache.get(id);
    if (cached && current - cached.at < TTL.messages) return cached.value;

    const collected = new Map<string, RawMessage>();
    let cursor: string | undefined;

    for (let page = 0; page < maxPages; page += 1) {
      const envelope = await this.raw<Envelope<RawMessage[]>>(
        `/api/session/${encodeURIComponent(id)}/message`,
        {
          limit: '200',
          ...(cursor ? { cursor } : {}),
        },
      );
      const rows = Array.isArray(envelope.data) ? envelope.data : [];
      for (const message of rows) {
        if (message && typeof message.id === 'string') collected.set(message.id, message);
      }
      cursor = envelope.cursor?.next;
      if (!cursor || rows.length === 0) break;
    }

    const messages = [...collected.values()].sort(
      (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0),
    );
    this.conversationCache.set(id, { value: messages, at: current });
    return messages;
  }

  async getDiff(id: string): Promise<RawDiff[]> {
    const current = this.now();
    const cached = this.diffCache.get(id);
    if (cached && current - cached.at < TTL.diff) return cached.value;

    const diff = await this.data<RawDiff[]>(`/api/session/${encodeURIComponent(id)}/diff`);
    if (!Array.isArray(diff)) throw new UpstreamError('bad-answer', 'Diff fora do formato.');
    this.diffCache.set(id, { value: diff, at: current });
    return diff;
  }

  async getModels(): Promise<RawModel[]> {
    const current = this.now();
    if (this.modelCache && current - this.modelCache.at < TTL.models) return this.modelCache.value;
    const models = await this.data<RawModel[]>('/api/model');
    if (!Array.isArray(models)) throw new UpstreamError('bad-answer', 'Modelos fora do formato.');
    this.modelCache = { value: models, at: current };
    return models;
  }

  async getActive(): Promise<RawActive> {
    const current = this.now();
    if (this.activeCache && current - this.activeCache.at < TTL.active) return this.activeCache.value;
    const active = await this.data<RawActive>('/api/session/active');
    if (!active || typeof active !== 'object' || Array.isArray(active)) {
      throw new UpstreamError('bad-answer', 'Mapa de sessões ativas fora do formato.');
    }
    this.activeCache = { value: active, at: current };
    return active;
  }

  async interrupt(id: string): Promise<boolean> {
    const result = await this.raw<{ interrupted?: boolean }>(
      `/api/session/${encodeURIComponent(id)}/interrupt`,
      undefined,
      { method: 'POST', body: '{}' },
    );
    return result?.interrupted === true;
  }

  async getGitStatus(directory: string): Promise<RawGitStatus> {
    return this.raw<RawGitStatus>('/api/git/status', { directory });
  }

  async getGitDiff(directory: string, path: string, staged = false): Promise<RawGitDiff> {
    return this.raw<RawGitDiff>('/api/git/diff', {
      directory,
      path,
      ...(staged ? { staged: 'true' } : {}),
    });
  }

  async getFsList(path: string): Promise<RawFsList> {
    return this.raw<RawFsList>('/api/fs/list', { path });
  }

  async getData<T>(path: string, query?: Record<string, string>): Promise<T> {
    return this.data<T>(path, query);
  }

  invalidate(sessionId?: string): void {
    this.sessionsCache = null;
    this.activeCache = null;
    if (!sessionId) {
      this.messageCache.clear();
      this.conversationCache.clear();
      this.diffCache.clear();
      return;
    }
    for (const key of this.messageCache.keys()) {
      if (key.startsWith(`${sessionId}:`)) this.messageCache.delete(key);
    }
    this.conversationCache.delete(sessionId);
    this.diffCache.delete(sessionId);
  }
}
