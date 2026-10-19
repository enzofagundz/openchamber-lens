import type {
  LensAgent,
  LensAgentStatus,
  LensDiffFile,
  LensDiffStatus,
  LensRecentFile,
  LensSnapshot,
  LensStrip,
  LensTokens,
  LensTurn,
  RawActive,
  RawDiff,
  RawMessage,
  RawModel,
  RawPart,
  RawSession,
  RawTokens,
} from './types.ts';

const PATCH_FILE_LIMIT = 20_000;
const PATCH_TOTAL_LIMIT = 200_000;
const RECENT_FILE_LIMIT = 8;
const REQUEST_LIMIT = 2_000;
const SESSION_ID_PATTERN = /ses_[A-Za-z0-9]+/g;
const NOISE_PREFIXES = [
  'node_modules/',
  '.git/',
  '.next/',
  '.nuxt/',
  '.svelte-kit/',
  '.venv/',
  'venv/',
  '__pycache__/',
  'target/',
  'coverage/',
  '.cache/',
  '.openchamber/',
  'dist/',
  'build/',
];

const number = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const time = (value: number | undefined): number | null => (typeof value === 'number' ? value : null);

export const tokensOf = (raw?: RawTokens): LensTokens => ({
  input: number(raw?.input),
  output: number(raw?.output),
  reasoning: number(raw?.reasoning),
  cacheRead: number(raw?.cache?.read),
  cacheWrite: number(raw?.cache?.write),
});

export const addTokens = (a: LensTokens, b: LensTokens): LensTokens => ({
  input: a.input + b.input,
  output: a.output + b.output,
  reasoning: a.reasoning + b.reasoning,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
});

export const tokenTotal = (tokens: LensTokens): number =>
  tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead + tokens.cacheWrite;

export const cleanText = (value: string): string =>
  value
    .replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, '')
    .trim();

export const firstLine = (value: string, limit = REQUEST_LIMIT): string => {
  const clean = cleanText(value);
  const line = clean.split('\n').find((entry) => entry.trim().length > 0) ?? '';
  return line.length > limit ? `${line.slice(0, limit)}…` : line;
};

const messageTime = (message: RawMessage): number =>
  message.time?.created ?? message.time?.streamed ?? message.time?.completed ?? 0;

const messageEnd = (message: RawMessage): number =>
  message.time?.completed ?? message.time?.streamed ?? message.time?.created ?? 0;

const partTime = (part: RawPart): number | null =>
  time(part.time?.created) ?? time(part.time?.ran);

const isToolPart = (part: RawPart): boolean => part.type === 'tool';

const toolStatus = (part: RawPart): string => text(part.state?.status);

const isFailure = (part: RawPart): boolean => {
  const status = toolStatus(part);
  return status === 'failed' || status === 'error';
};

const toolParts = (messages: RawMessage[]): RawPart[] =>
  messages.flatMap((message) => (message.content ?? []).filter(isToolPart));

const messageText = (message: RawMessage): string => {
  if (typeof message.text === 'string' && message.text.trim().length > 0) return message.text;
  return (message.content ?? [])
    .filter((part) => part.type === 'text' && typeof part.text === 'string')
    .map((part) => part.text ?? '')
    .join('\n');
};

const orderedMessages = (messages: RawMessage[]): RawMessage[] =>
  [...messages].sort((a, b) => messageTime(a) - messageTime(b));

const childIdsFromParts = (messages: RawMessage[]): string[] => {
  const found = new Set<string>();
  for (const part of toolParts(messages)) {
    const serialized = JSON.stringify({ input: part.state?.input, content: part.state?.content, metadata: part.state?.metadata });
    for (const match of serialized.matchAll(SESSION_ID_PATTERN)) found.add(match[0]);
  }
  return [...found];
};

const activeFor = (active: RawActive, id: string): boolean => {
  const entry = active[id];
  if (!entry) return false;
  return entry.type === 'running' || entry.type === 'busy' || entry.type === 'waiting';
};

const statusOf = (session: RawSession, active: RawActive): LensAgentStatus => {
  if (activeFor(active, session.id)) return 'running';
  if (session.error !== undefined && session.error !== null) return 'failed';
  if (session.time?.idle !== undefined) return 'completed';
  if (session.time?.updated !== undefined) return 'unknown';
  return 'unknown';
};

const modelLabel = (session: RawSession): string => {
  const id = session.model?.id;
  if (!id) return '—';
  const variant = session.model?.variant;
  return variant ? `${id} · ${variant}` : id;
};

export const findModel = (models: RawModel[], session: RawSession): RawModel | null => {
  const ref = session.model;
  if (!ref?.id) return null;
  return (
    models.find(
      (model) =>
        (model.modelID === ref.id || model.id === ref.id) &&
        (!ref.providerID || model.providerID === ref.providerID),
    ) ?? null
  );
};

const contextOf = (messages: RawMessage[], limit: number | null) => {
  const assistants = orderedMessages(messages).filter((message) => message.type === 'assistant' && message.tokens);
  const last = assistants.at(-1);
  if (!last?.tokens) return { used: null, limit, percent: null };
  const tokens = tokensOf(last.tokens);
  const used = tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead;
  if (used <= 0) return { used: null, limit, percent: null };
  if (!limit || limit <= 0) return { used, limit: null, percent: null };
  return { used, limit, percent: Math.round((used / limit) * 1000) / 10 };
};

export const descendantSessions = (rootId: string, sessions: RawSession[]): RawSession[] => {
  const byParent = new Map<string, RawSession[]>();
  for (const session of sessions) {
    const parent = session.parentID ?? null;
    if (!parent) continue;
    const list = byParent.get(parent) ?? [];
    list.push(session);
    byParent.set(parent, list);
  }

  const result: RawSession[] = [];
  const seen = new Set<string>([rootId]);
  const walk = (parentId: string): void => {
    for (const child of (byParent.get(parentId) ?? []).sort(
      (a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0),
    )) {
      if (seen.has(child.id)) continue;
      seen.add(child.id);
      result.push(child);
      walk(child.id);
    }
  };
  walk(rootId);
  return result;
};

export const deriveTurns = (
  messages: RawMessage[],
  children: RawSession[],
  active: RawActive,
  now: number,
  sessionId: string,
): LensTurn[] => {
  const ordered = orderedMessages(messages);
  const users = ordered
    .map((message, index) => ({ message, index }))
    .filter(({ message }) => message.type === 'user' && messageText(message).trim().length > 0);

  return users.map(({ message: user, index }, turnIndex) => {
    const next = users[turnIndex + 1]?.index ?? ordered.length;
    const slice = ordered.slice(index, next);
    const assistants = slice.filter((entry) => entry.type === 'assistant');
    const tools = toolParts(assistants);
    const start = messageTime(user);
    const last = slice.at(-1);
    const isLastTurn = turnIndex === users.length - 1;
    const unfinished = last?.type === 'assistant' && last.time?.completed === undefined;
    const running = isLastTurn && (activeFor(active, sessionId) || unfinished);
    const end = running ? now : Math.max(start, ...slice.map(messageEnd));
    const cost = assistants.reduce((sum, entry) => sum + number(entry.cost), 0);
    const tokens = assistants.reduce((sum, entry) => addTokens(sum, tokensOf(entry.tokens)), {
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    });

    const knownChildren = new Set(children.map((child) => child.id));
    const touched = new Set<string>();
    for (const id of childIdsFromParts(assistants)) {
      if (knownChildren.has(id)) touched.add(id);
    }
    for (const child of children) {
      const created = child.time?.created;
      if (created !== undefined && created >= start && created <= end) touched.add(child.id);
    }

    return {
      index: turnIndex + 1,
      request: firstLine(messageText(user)),
      startedAt: start,
      durationMs: Math.max(0, end - start),
      cost,
      tokens,
      toolCalls: tools.length,
      failures: tools.filter(isFailure).length,
      agents: [...touched],
      running,
    };
  });
};

export const deriveAgents = (
  root: RawSession,
  children: RawSession[],
  messagesBySession: Record<string, RawMessage[]>,
  active: RawActive,
): LensAgent[] => {
  const byId = new Map(children.map((session) => [session.id, session]));
  const depthOf = (session: RawSession): number => {
    let depth = 0;
    let parent = session.parentID ?? null;
    const seen = new Set<string>();
    while (parent && parent !== root.id && !seen.has(parent)) {
      seen.add(parent);
      const parentSession = byId.get(parent);
      if (!parentSession) break;
      depth += 1;
      parent = parentSession.parentID ?? null;
    }
    return depth + 1;
  };

  const row = (session: RawSession, isMain: boolean): LensAgent => {
    const messages = messagesBySession[session.id] ?? [];
    return {
      id: session.id,
      parentId: isMain ? null : (session.parentID ?? root.id),
      title: session.title?.trim() || (isMain ? 'Conversa principal' : 'Subagente'),
      agent: session.agent ?? (isMain ? 'build' : 'agent'),
      model: modelLabel(session),
      status: statusOf(session, active),
      cost: number(session.cost),
      tokens: tokensOf(session.tokens),
      toolCalls: toolParts(messages).length,
      startedAt: time(session.time?.created),
      endedAt: time(session.time?.idle) ?? time(session.time?.updated),
      depth: isMain ? 0 : depthOf(session),
      isMain,
    };
  };

  return [row(root, true), ...children.map((child) => row(child, false))].sort(
    (a, b) => a.depth - b.depth || (a.startedAt ?? 0) - (b.startedAt ?? 0),
  );
};

const diffStatus = (patch: string): LensDiffStatus => {
  if (/^new file mode/m.test(patch) || /^--- \/dev\/null/m.test(patch)) return 'added';
  if (/^deleted file mode/m.test(patch) || /^\+\+\+ \/dev\/null/m.test(patch)) return 'deleted';
  if (patch.trim().length === 0) return 'unknown';
  return 'modified';
};

const countLines = (patch: string): { additions: number; deletions: number } => {
  let additions = 0;
  let deletions = 0;
  for (const line of patch.split('\n')) {
    if (line.startsWith('+') && !line.startsWith('+++')) additions += 1;
    if (line.startsWith('-') && !line.startsWith('---')) deletions += 1;
  }
  return { additions, deletions };
};

const isChangeLine = (line: string): boolean =>
  (line.startsWith('+') && !line.startsWith('+++')) ||
  (line.startsWith('-') && !line.startsWith('---'));

const clipPatch = (patch: string, limit: number): string => {
  if (patch.length <= limit) return patch;

  const lines = patch.split('\n');
  const hunk = lines.findIndex((line) => line.startsWith('@@'));
  const firstChange = lines.findIndex((line, index) => index > hunk && isChangeLine(line));
  if (firstChange < 0) return patch.slice(0, limit);

  const header = lines.slice(0, Math.max(0, hunk + 1));
  const start = Math.max(hunk + 1, firstChange - 4);
  const body = lines.slice(start);
  const merged = [...header, ...(start > hunk + 1 ? ['…'] : []), ...body].join('\n');
  return merged.slice(0, limit);
};

export const deriveDiff = (raw: RawDiff[]): LensDiffFile[] => {
  let budget = PATCH_TOTAL_LIMIT;
  return raw
    .filter((entry): entry is Required<Pick<RawDiff, 'file'>> & RawDiff => typeof entry.file === 'string')
    .filter((entry) => {
      const normalized = entry.file.replace(/^\.\//, '');
      return !NOISE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
    })
    .map((entry) => {
      const patch = text(entry.patch);
      const counted = countLines(patch);
      const allowed = Math.max(0, Math.min(PATCH_FILE_LIMIT, budget));
      const clipped = patch.length > allowed;
      budget = Math.max(0, budget - Math.min(patch.length, allowed));
      return {
        path: entry.file,
        status: diffStatus(patch),
        additions: counted.additions,
        deletions: counted.deletions,
        patch: clipped ? clipPatch(patch, allowed) : patch,
        truncated: clipped,
      };
    });
};

const pathFromPart = (part: RawPart): string | null => {
  const input = part.state?.input;
  if (!input) return null;
  for (const key of ['path', 'file_path', 'filePath', 'notebook_path']) {
    const value = input[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
};

const actionFromTool = (name: string): 'read' | 'edit' | null => {
  if (['write', 'edit', 'patch', 'apply_patch'].includes(name)) return 'edit';
  if (['read', 'grep', 'glob', 'list'].includes(name)) return 'read';
  return null;
};

export const deriveRecentFiles = (messages: RawMessage[]): LensRecentFile[] => {
  const found = new Map<string, LensRecentFile>();
  for (const message of orderedMessages(messages)) {
    for (const part of message.content ?? []) {
      if (!isToolPart(part)) continue;
      const path = pathFromPart(part);
      if (!path) continue;
      const action = actionFromTool(text(part.name));
      if (!action) continue;
      const previous = found.get(path);
      found.set(path, {
        path,
        action: previous?.action === 'edit' ? 'edit' : action,
        at: partTime(part) ?? messageTime(message),
      });
    }
  }
  return [...found.values()].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, RECENT_FILE_LIMIT);
};

const sumAssistantCost = (messages: RawMessage[]): number =>
  messages
    .filter((message) => message.type === 'assistant')
    .reduce((sum, message) => sum + number(message.cost), 0);

const sumAssistantTokens = (messages: RawMessage[]): LensTokens =>
  messages
    .filter((message) => message.type === 'assistant')
    .reduce(
      (sum, message) => addTokens(sum, tokensOf(message.tokens)),
      { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 } as LensTokens,
    );

export const buildSnapshot = (input: {
  session: RawSession;
  sessions: RawSession[];
  messagesBySession: Record<string, RawMessage[]>;
  diff: RawDiff[];
  models: RawModel[];
  active: RawActive;
  now: number;
}): LensSnapshot => {
  const { session, sessions, messagesBySession, diff, models, active, now } = input;
  const messages = messagesBySession[session.id] ?? [];
  const children = descendantSessions(session.id, sessions);
  const model = findModel(models, session);
  const limit = model?.limit?.context && model.limit.context > 0 ? model.limit.context : null;
  const context = contextOf(messages, limit);
  const agents = deriveAgents(session, children, messagesBySession, active);
  const diffFiles = deriveDiff(diff);
  const turns = deriveTurns(messages, children, active, now, session.id);
  const sessionTokens = session.tokens ? tokensOf(session.tokens) : sumAssistantTokens(messages);
  const sessionCost = typeof session.cost === 'number' ? session.cost : sumAssistantCost(messages);
  const tools = toolParts(messages);

  return {
    at: now,
    session: {
      id: session.id,
      title: session.title?.trim() || 'Sessão sem título',
      directory: session.location?.directory ?? null,
      agent: session.agent ?? 'build',
      model: {
        id: session.model?.id ?? '—',
        providerId: session.model?.providerID ?? '',
        variant: session.model?.variant ?? null,
        name: model?.name ?? session.model?.id ?? '—',
        contextLimit: limit,
      },
      cost: number(sessionCost),
      tokens: sessionTokens,
      createdAt: time(session.time?.created),
      updatedAt: time(session.time?.updated),
      status: statusOf(session, active),
      context,
    },
    counts: {
      messages: messages.length,
      userTurns: messages.filter((message) => message.type === 'user').length,
      assistantMessages: messages.filter((message) => message.type === 'assistant').length,
      toolCalls: tools.length,
      toolFailures: tools.filter(isFailure).length,
      filesChanged: diffFiles.length,
    },
    turns,
    agents,
    diff: diffFiles,
    recentFiles: deriveRecentFiles(messages),
    error: null,
  };
};

export const buildStrip = (snapshot: LensSnapshot): LensStrip => ({
  at: snapshot.at,
  sessionId: snapshot.session.id,
  title: snapshot.session.title,
  status: snapshot.session.status,
  contextPercent: snapshot.session.context.percent,
  contextUsed: snapshot.session.context.used,
  contextLimit: snapshot.session.context.limit,
  cost: snapshot.session.cost,
  runningAgents: snapshot.agents.filter((agent) => !agent.isMain && agent.status === 'running').length,
  model: snapshot.session.model.name,
  changedFiles: snapshot.diff.length,
  error: null,
});
