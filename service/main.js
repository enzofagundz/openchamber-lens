// src/service/app.ts
import http from "node:http";

// src/shared/derive.ts
var PATCH_FILE_LIMIT = 20000;
var PATCH_TOTAL_LIMIT = 200000;
var RECENT_FILE_LIMIT = 8;
var REQUEST_LIMIT = 2000;
var SESSION_ID_PATTERN = /ses_[A-Za-z0-9]+/g;
var NOISE_PREFIXES = [
  "node_modules/",
  ".git/",
  ".next/",
  ".nuxt/",
  ".svelte-kit/",
  ".venv/",
  "venv/",
  "__pycache__/",
  "target/",
  "coverage/",
  ".cache/",
  ".openchamber/",
  "dist/",
  "build/"
];
var number = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
var text = (value) => typeof value === "string" ? value : "";
var time = (value) => typeof value === "number" ? value : null;
var tokensOf = (raw) => ({
  input: number(raw?.input),
  output: number(raw?.output),
  reasoning: number(raw?.reasoning),
  cacheRead: number(raw?.cache?.read),
  cacheWrite: number(raw?.cache?.write)
});
var addTokens = (a, b) => ({
  input: a.input + b.input,
  output: a.output + b.output,
  reasoning: a.reasoning + b.reasoning,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite
});
var cleanText = (value) => value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, "").replace(/\r\n?/g, `
`).replace(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g, "").trim();
var firstLine = (value, limit = REQUEST_LIMIT) => {
  const clean = cleanText(value);
  const line = clean.split(`
`).find((entry) => entry.trim().length > 0) ?? "";
  return line.length > limit ? `${line.slice(0, limit)}…` : line;
};
var messageTime = (message) => message.time?.created ?? message.time?.streamed ?? message.time?.completed ?? 0;
var messageEnd = (message) => message.time?.completed ?? message.time?.streamed ?? message.time?.created ?? 0;
var partTime = (part) => time(part.time?.created) ?? time(part.time?.ran);
var isToolPart = (part) => part.type === "tool";
var toolStatus = (part) => text(part.state?.status);
var isFailure = (part) => {
  const status = toolStatus(part);
  return status === "failed" || status === "error";
};
var toolParts = (messages) => messages.flatMap((message) => (message.content ?? []).filter(isToolPart));
var messageText = (message) => {
  if (typeof message.text === "string" && message.text.trim().length > 0)
    return message.text;
  return (message.content ?? []).filter((part) => part.type === "text" && typeof part.text === "string").map((part) => part.text ?? "").join(`
`);
};
var orderedMessages = (messages) => [...messages].sort((a, b) => messageTime(a) - messageTime(b));
var childIdsFromParts = (messages) => {
  const found = new Set;
  for (const part of toolParts(messages)) {
    const serialized = JSON.stringify({ input: part.state?.input, content: part.state?.content, metadata: part.state?.metadata });
    for (const match of serialized.matchAll(SESSION_ID_PATTERN))
      found.add(match[0]);
  }
  return [...found];
};
var activeFor = (active, id) => {
  const entry = active[id];
  if (!entry)
    return false;
  return entry.type === "running" || entry.type === "busy" || entry.type === "waiting";
};
var statusOf = (session, active) => {
  if (activeFor(active, session.id))
    return "running";
  if (session.error !== undefined && session.error !== null)
    return "failed";
  if (session.time?.idle !== undefined)
    return "completed";
  if (session.time?.updated !== undefined)
    return "unknown";
  return "unknown";
};
var modelLabel = (session) => {
  const id = session.model?.id;
  if (!id)
    return "—";
  const variant = session.model?.variant;
  return variant ? `${id} · ${variant}` : id;
};
var findModel = (models, session) => {
  const ref = session.model;
  if (!ref?.id)
    return null;
  return models.find((model) => (model.modelID === ref.id || model.id === ref.id) && (!ref.providerID || model.providerID === ref.providerID)) ?? null;
};
var contextOf = (messages, limit) => {
  const assistants = orderedMessages(messages).filter((message) => message.type === "assistant" && message.tokens);
  const last = assistants.at(-1);
  if (!last?.tokens)
    return { used: null, limit, percent: null };
  const tokens = tokensOf(last.tokens);
  const used = tokens.input + tokens.output + tokens.reasoning + tokens.cacheRead;
  if (used <= 0)
    return { used: null, limit, percent: null };
  if (!limit || limit <= 0)
    return { used, limit: null, percent: null };
  return { used, limit, percent: Math.round(used / limit * 1000) / 10 };
};
var descendantSessions = (rootId, sessions) => {
  const byParent = new Map;
  for (const session of sessions) {
    const parent = session.parentID ?? null;
    if (!parent)
      continue;
    const list = byParent.get(parent) ?? [];
    list.push(session);
    byParent.set(parent, list);
  }
  const result = [];
  const seen = new Set([rootId]);
  const walk = (parentId) => {
    for (const child of (byParent.get(parentId) ?? []).sort((a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0))) {
      if (seen.has(child.id))
        continue;
      seen.add(child.id);
      result.push(child);
      walk(child.id);
    }
  };
  walk(rootId);
  return result;
};
var deriveTurns = (messages, children, active, now, sessionId) => {
  const ordered = orderedMessages(messages);
  const users = ordered.map((message, index) => ({ message, index })).filter(({ message }) => message.type === "user" && messageText(message).trim().length > 0);
  return users.map(({ message: user, index }, turnIndex) => {
    const next = users[turnIndex + 1]?.index ?? ordered.length;
    const slice = ordered.slice(index, next);
    const assistants = slice.filter((entry) => entry.type === "assistant");
    const tools = toolParts(assistants);
    const start = messageTime(user);
    const last = slice.at(-1);
    const isLastTurn = turnIndex === users.length - 1;
    const unfinished = last?.type === "assistant" && last.time?.completed === undefined;
    const running = isLastTurn && (activeFor(active, sessionId) || unfinished);
    const end = running ? now : Math.max(start, ...slice.map(messageEnd));
    const cost = assistants.reduce((sum, entry) => sum + number(entry.cost), 0);
    const tokens = assistants.reduce((sum, entry) => addTokens(sum, tokensOf(entry.tokens)), {
      input: 0,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0
    });
    const knownChildren = new Set(children.map((child) => child.id));
    const touched = new Set;
    for (const id of childIdsFromParts(assistants)) {
      if (knownChildren.has(id))
        touched.add(id);
    }
    for (const child of children) {
      const created = child.time?.created;
      if (created !== undefined && created >= start && created <= end)
        touched.add(child.id);
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
      running
    };
  });
};
var deriveAgents = (root, children, messagesBySession, active) => {
  const byId = new Map(children.map((session) => [session.id, session]));
  const depthOf = (session) => {
    let depth = 0;
    let parent = session.parentID ?? null;
    const seen = new Set;
    while (parent && parent !== root.id && !seen.has(parent)) {
      seen.add(parent);
      const parentSession = byId.get(parent);
      if (!parentSession)
        break;
      depth += 1;
      parent = parentSession.parentID ?? null;
    }
    return depth + 1;
  };
  const row = (session, isMain) => {
    const messages = messagesBySession[session.id] ?? [];
    return {
      id: session.id,
      parentId: isMain ? null : session.parentID ?? root.id,
      title: session.title?.trim() || (isMain ? "Conversa principal" : "Subagente"),
      agent: session.agent ?? (isMain ? "build" : "agent"),
      model: modelLabel(session),
      status: statusOf(session, active),
      cost: number(session.cost),
      tokens: tokensOf(session.tokens),
      toolCalls: toolParts(messages).length,
      startedAt: time(session.time?.created),
      endedAt: time(session.time?.idle) ?? time(session.time?.updated),
      depth: isMain ? 0 : depthOf(session),
      isMain
    };
  };
  return [row(root, true), ...children.map((child) => row(child, false))].sort((a, b) => a.depth - b.depth || (a.startedAt ?? 0) - (b.startedAt ?? 0));
};
var diffStatus = (patch) => {
  if (/^new file mode/m.test(patch) || /^--- \/dev\/null/m.test(patch))
    return "added";
  if (/^deleted file mode/m.test(patch) || /^\+\+\+ \/dev\/null/m.test(patch))
    return "deleted";
  if (patch.trim().length === 0)
    return "unknown";
  return "modified";
};
var countLines = (patch) => {
  let additions = 0;
  let deletions = 0;
  for (const line of patch.split(`
`)) {
    if (line.startsWith("+") && !line.startsWith("+++"))
      additions += 1;
    if (line.startsWith("-") && !line.startsWith("---"))
      deletions += 1;
  }
  return { additions, deletions };
};
var deriveDiff = (raw) => {
  let budget = PATCH_TOTAL_LIMIT;
  return raw.filter((entry) => typeof entry.file === "string").filter((entry) => {
    const normalized = entry.file.replace(/^\.\//, "");
    return !NOISE_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }).map((entry) => {
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
      patch: clipped ? patch.slice(0, allowed) : patch,
      truncated: clipped
    };
  });
};
var pathFromPart = (part) => {
  const input = part.state?.input;
  if (!input)
    return null;
  for (const key of ["path", "file_path", "filePath", "notebook_path"]) {
    const value = input[key];
    if (typeof value === "string" && value.trim().length > 0)
      return value;
  }
  return null;
};
var actionFromTool = (name) => {
  if (["write", "edit", "patch", "apply_patch"].includes(name))
    return "edit";
  if (["read", "grep", "glob", "list"].includes(name))
    return "read";
  return null;
};
var deriveRecentFiles = (messages) => {
  const found = new Map;
  for (const message of orderedMessages(messages)) {
    for (const part of message.content ?? []) {
      if (!isToolPart(part))
        continue;
      const path = pathFromPart(part);
      if (!path)
        continue;
      const action = actionFromTool(text(part.name));
      if (!action)
        continue;
      const previous = found.get(path);
      found.set(path, {
        path,
        action: previous?.action === "edit" ? "edit" : action,
        at: partTime(part) ?? messageTime(message)
      });
    }
  }
  return [...found.values()].sort((a, b) => (b.at ?? 0) - (a.at ?? 0)).slice(0, RECENT_FILE_LIMIT);
};
var sumAssistantCost = (messages) => messages.filter((message) => message.type === "assistant").reduce((sum, message) => sum + number(message.cost), 0);
var sumAssistantTokens = (messages) => messages.filter((message) => message.type === "assistant").reduce((sum, message) => addTokens(sum, tokensOf(message.tokens)), { input: 0, output: 0, reasoning: 0, cacheRead: 0, cacheWrite: 0 });
var buildSnapshot = (input) => {
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
  const sessionCost = typeof session.cost === "number" ? session.cost : sumAssistantCost(messages);
  const tools = toolParts(messages);
  return {
    at: now,
    session: {
      id: session.id,
      title: session.title?.trim() || "Sessão sem título",
      directory: session.location?.directory ?? null,
      agent: session.agent ?? "build",
      model: {
        id: session.model?.id ?? "—",
        providerId: session.model?.providerID ?? "",
        variant: session.model?.variant ?? null,
        name: model?.name ?? session.model?.id ?? "—",
        contextLimit: limit
      },
      cost: number(sessionCost),
      tokens: sessionTokens,
      createdAt: time(session.time?.created),
      updatedAt: time(session.time?.updated),
      status: statusOf(session, active),
      context
    },
    counts: {
      messages: messages.length,
      userTurns: messages.filter((message) => message.type === "user").length,
      assistantMessages: messages.filter((message) => message.type === "assistant").length,
      toolCalls: tools.length,
      toolFailures: tools.filter(isFailure).length,
      filesChanged: diffFiles.length
    },
    turns,
    agents,
    diff: diffFiles,
    recentFiles: deriveRecentFiles(messages),
    error: null
  };
};
var buildStrip = (snapshot) => ({
  at: snapshot.at,
  sessionId: snapshot.session.id,
  title: snapshot.session.title,
  status: snapshot.session.status,
  contextPercent: snapshot.session.context.percent,
  contextUsed: snapshot.session.context.used,
  contextLimit: snapshot.session.context.limit,
  cost: snapshot.session.cost,
  runningAgents: snapshot.agents.filter((agent) => !agent.isMain && agent.status === "running").length,
  model: snapshot.session.model.name,
  changedFiles: snapshot.diff.length,
  error: null
});

// src/service/discovery.ts
import { readdir, readFile, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
var defaultDataDir = (home = process.env.HOME ?? os.homedir()) => path.join(home, ".config", "openchamber");
var readJson = async (file) => {
  try {
    const parsed = JSON.parse(await readFile(file, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};
var portOf = (value) => {
  const port = typeof value === "string" ? Number(value) : value;
  return typeof port === "number" && Number.isInteger(port) && port > 0 && port <= 65535 ? port : null;
};
var loopbackUrl = (value) => {
  if (!value)
    return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const allowed = host === "127.0.0.1" || host === "localhost" || host === "::1" || host === "[::1]";
    if (!allowed)
      return null;
    if (url.protocol !== "http:" && url.protocol !== "https:")
      return null;
    return url.origin;
  } catch {
    return null;
  }
};
var discoverBaseUrl = async ({ dataDir, explicit }) => {
  const override = loopbackUrl(explicit ?? process.env.LENS_BASE_URL ?? null);
  if (override)
    return override;
  const settings = await readJson(path.join(dataDir, "settings.json"));
  const desktopPort = portOf(settings?.desktopLocalPort);
  if (desktopPort)
    return `http://127.0.0.1:${desktopPort}`;
  const runDir = path.join(dataDir, "run");
  let files = [];
  try {
    files = (await readdir(runDir)).filter((file) => file.endsWith(".json"));
  } catch {
    return null;
  }
  const candidates = [];
  for (const file of files) {
    const full = path.join(runDir, file);
    const parsed = await readJson(full);
    const port = portOf(parsed?.port);
    if (!port)
      continue;
    const info = await stat(full).catch(() => null);
    candidates.push({ url: `http://127.0.0.1:${port}`, mtime: info?.mtimeMs ?? 0 });
  }
  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.url ?? null;
};

// src/service/events.ts
class EventStream {
  baseUrl;
  onEvent;
  fetchImpl;
  controller = null;
  stopped = false;
  retry = 0;
  timer = null;
  constructor(baseUrl, onEvent, fetchImpl = fetch) {
    this.baseUrl = baseUrl;
    this.onEvent = onEvent;
    this.fetchImpl = fetchImpl;
  }
  start() {
    if (this.controller || this.timer)
      return;
    this.stopped = false;
    this.connect();
  }
  stop() {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
    if (this.timer)
      clearTimeout(this.timer);
    this.timer = null;
  }
  schedule() {
    if (this.stopped)
      return;
    const delay = Math.min(15000, 1000 * 2 ** Math.min(this.retry, 4));
    this.retry += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.connect();
    }, delay);
  }
  async connect() {
    if (this.stopped)
      return;
    const controller = new AbortController;
    this.controller = controller;
    try {
      const response = await this.fetchImpl(new URL("/api/event", this.baseUrl), {
        method: "GET",
        headers: { accept: "text/event-stream" },
        signal: controller.signal
      });
      if (!response.ok || !response.body)
        throw new Error(`SSE ${response.status}`);
      this.retry = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder;
      let buffer = "";
      while (!this.stopped) {
        const { value, done } = await reader.read();
        if (done)
          break;
        buffer += decoder.decode(value, { stream: true });
        let index = buffer.indexOf(`
`);
        while (index >= 0) {
          const line = buffer.slice(0, index).replace(/\r$/, "");
          buffer = buffer.slice(index + 1);
          if (line.startsWith("data:")) {
            const raw = line.slice(5).trim();
            if (raw) {
              try {
                this.onEvent(JSON.parse(raw));
              } catch {}
            }
          }
          index = buffer.indexOf(`
`);
        }
      }
    } catch {} finally {
      this.controller = null;
    }
    this.schedule();
  }
}

// src/service/upstream.ts
class UpstreamError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "UpstreamError";
  }
}
var TTL = {
  sessions: 2000,
  active: 1000,
  messages: 3000,
  diff: 3000,
  models: 60000
};

class UpstreamClient {
  baseUrl;
  fetchImpl;
  now;
  sessionsCache = null;
  activeCache = null;
  modelCache = null;
  messageCache = new Map;
  conversationCache = new Map;
  diffCache = new Map;
  constructor(baseUrl, fetchImpl = fetch, now = Date.now) {
    this.baseUrl = baseUrl;
    this.fetchImpl = fetchImpl;
    this.now = now;
  }
  async raw(requestPath, query) {
    const url = new URL(requestPath, this.baseUrl);
    for (const [key, value] of Object.entries(query ?? {}))
      url.searchParams.set(key, value);
    let response;
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(5000)
      });
    } catch (error) {
      throw new UpstreamError("upstream-failed", error instanceof Error ? error.message : "Falha ao falar com o servidor local.");
    }
    if (response.status === 401 || response.status === 403) {
      throw new UpstreamError("auth-required", "O servidor local exige autenticação.");
    }
    if (response.status === 404) {
      throw new UpstreamError("session-not-found", "Recurso não encontrado no servidor local.");
    }
    if (!response.ok) {
      throw new UpstreamError("upstream-failed", `O servidor local respondeu ${response.status}.`);
    }
    try {
      return await response.json();
    } catch {
      throw new UpstreamError("bad-answer", "O servidor local devolveu um JSON inválido.");
    }
  }
  async data(requestPath, query) {
    const envelope = await this.raw(requestPath, query);
    if (!envelope || typeof envelope !== "object" || !("data" in envelope)) {
      throw new UpstreamError("bad-answer", "Resposta sem o campo data.");
    }
    return envelope.data;
  }
  async getSession(id) {
    const session = await this.data(`/api/session/${encodeURIComponent(id)}`);
    if (!session || typeof session !== "object" || typeof session.id !== "string") {
      throw new UpstreamError("bad-answer", "Sessão sem id.");
    }
    return session;
  }
  async listSessions() {
    const current = this.now();
    if (this.sessionsCache && current - this.sessionsCache.at < TTL.sessions)
      return this.sessionsCache.value;
    const sessions = [];
    const seen = new Set;
    let cursor;
    for (let page = 0;page < 5; page += 1) {
      const envelope = await this.raw("/api/session", {
        limit: "200",
        ...cursor ? { cursor } : {}
      });
      const rows = Array.isArray(envelope.data) ? envelope.data : [];
      for (const row of rows) {
        if (!row || typeof row.id !== "string" || seen.has(row.id))
          continue;
        seen.add(row.id);
        sessions.push(row);
      }
      cursor = envelope.cursor?.next;
      if (!cursor)
        break;
    }
    this.sessionsCache = { value: sessions, at: current };
    return sessions;
  }
  async getMessages(id, limit = 200) {
    const key = `${id}:${limit}`;
    const current = this.now();
    const cached = this.messageCache.get(key);
    if (cached && current - cached.at < TTL.messages)
      return cached.value;
    const messages = await this.data(`/api/session/${encodeURIComponent(id)}/message`, {
      limit: String(limit)
    });
    if (!Array.isArray(messages))
      throw new UpstreamError("bad-answer", "Mensagens fora do formato.");
    this.messageCache.set(key, { value: messages, at: current });
    return messages;
  }
  async getConversation(id, maxPages = 5) {
    const current = this.now();
    const cached = this.conversationCache.get(id);
    if (cached && current - cached.at < TTL.messages)
      return cached.value;
    const collected = new Map;
    let cursor;
    for (let page = 0;page < maxPages; page += 1) {
      const envelope = await this.raw(`/api/session/${encodeURIComponent(id)}/message`, {
        limit: "200",
        ...cursor ? { cursor } : {}
      });
      const rows = Array.isArray(envelope.data) ? envelope.data : [];
      for (const message of rows) {
        if (message && typeof message.id === "string")
          collected.set(message.id, message);
      }
      cursor = envelope.cursor?.next;
      if (!cursor || rows.length === 0)
        break;
    }
    const messages = [...collected.values()].sort((a, b) => (a.time?.created ?? 0) - (b.time?.created ?? 0));
    this.conversationCache.set(id, { value: messages, at: current });
    return messages;
  }
  async getDiff(id) {
    const current = this.now();
    const cached = this.diffCache.get(id);
    if (cached && current - cached.at < TTL.diff)
      return cached.value;
    const diff = await this.data(`/api/session/${encodeURIComponent(id)}/diff`);
    if (!Array.isArray(diff))
      throw new UpstreamError("bad-answer", "Diff fora do formato.");
    this.diffCache.set(id, { value: diff, at: current });
    return diff;
  }
  async getModels() {
    const current = this.now();
    if (this.modelCache && current - this.modelCache.at < TTL.models)
      return this.modelCache.value;
    const models = await this.data("/api/model");
    if (!Array.isArray(models))
      throw new UpstreamError("bad-answer", "Modelos fora do formato.");
    this.modelCache = { value: models, at: current };
    return models;
  }
  async getActive() {
    const current = this.now();
    if (this.activeCache && current - this.activeCache.at < TTL.active)
      return this.activeCache.value;
    const active = await this.data("/api/session/active");
    if (!active || typeof active !== "object" || Array.isArray(active)) {
      throw new UpstreamError("bad-answer", "Mapa de sessões ativas fora do formato.");
    }
    this.activeCache = { value: active, at: current };
    return active;
  }
  invalidate(sessionId) {
    this.sessionsCache = null;
    this.activeCache = null;
    if (!sessionId) {
      this.messageCache.clear();
      this.conversationCache.clear();
      this.diffCache.clear();
      return;
    }
    for (const key of this.messageCache.keys()) {
      if (key.startsWith(`${sessionId}:`))
        this.messageCache.delete(key);
    }
    this.conversationCache.delete(sessionId);
    this.diffCache.delete(sessionId);
  }
}

// src/service/app.ts
var MAX_CHILD_MESSAGES = 12;
var MESSAGES_FOR_STRIP = 20;
var errorOf = (code, message) => ({ code, message });
var isAuth = (error) => error instanceof UpstreamError && error.code === "auth-required";
var soft = async (work, fallback) => {
  try {
    return await work;
  } catch (error) {
    if (isAuth(error))
      throw error;
    return fallback;
  }
};
var createLensService = (config) => {
  const now = config.now ?? Date.now;
  const host = config.host ?? "127.0.0.1";
  const dataDir = config.dataDir ?? defaultDataDir();
  let upstream = null;
  let events = null;
  let baseUrl = null;
  let baseAt = 0;
  let idle = null;
  const send = (res, status, body) => {
    const payload = JSON.stringify(body);
    res.writeHead(status, {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    });
    res.end(payload);
  };
  const touch = () => {
    if (!config.idleExitMs)
      return;
    if (idle)
      clearTimeout(idle);
    idle = setTimeout(() => {
      stop().finally(() => {
        if (config.onIdle)
          config.onIdle();
        else
          process.exit(0);
      });
    }, config.idleExitMs);
  };
  const resolveUpstream = async () => {
    if (upstream && now() - baseAt < 5000)
      return upstream;
    const discovered = await discoverBaseUrl({
      dataDir,
      explicit: config.baseUrl ?? null
    });
    if (!discovered)
      throw new UpstreamError("no-server", "Servidor local do OpenChamber não encontrado.");
    if (upstream && baseUrl === discovered) {
      baseAt = now();
      return upstream;
    }
    events?.stop();
    baseUrl = discovered;
    baseAt = now();
    upstream = new UpstreamClient(discovered, config.fetchImpl, now);
    if (config.sse !== false) {
      events = new EventStream(discovered, (event) => {
        const sessionId = typeof event.data?.sessionID === "string" ? event.data.sessionID : undefined;
        upstream?.invalidate(sessionId);
      }, config.fetchImpl);
      events.start();
    }
    return upstream;
  };
  const loadMessages = async (client, session, sessions, limit) => {
    const messages = limit < 200 ? await soft(client.getMessages(session.id, limit), []) : await soft(client.getConversation(session.id), []);
    const result = { [session.id]: messages };
    if (limit < 200)
      return result;
    const children = descendantSessions(session.id, sessions).slice(0, MAX_CHILD_MESSAGES);
    for (let index = 0;index < children.length; index += 4) {
      const batch = children.slice(index, index + 4);
      const rows = await Promise.all(batch.map(async (child) => [child.id, await soft(client.getMessages(child.id, 200), [])]));
      for (const [id, childMessages] of rows)
        result[id] = childMessages;
    }
    return result;
  };
  const build = async (sessionId, strip) => {
    const client = await resolveUpstream();
    const session = await client.getSession(sessionId);
    const [sessions, active, models, diff] = await Promise.all([
      soft(client.listSessions(), [session]),
      soft(client.getActive(), {}),
      soft(client.getModels(), []),
      soft(client.getDiff(sessionId), [])
    ]);
    const messagesBySession = await loadMessages(client, session, sessions, strip ? MESSAGES_FOR_STRIP : 200);
    const snapshot = buildSnapshot({
      session,
      sessions,
      messagesBySession,
      diff,
      models,
      active,
      now: now()
    });
    if (strip)
      return { data: buildStrip(snapshot), error: null };
    return { data: snapshot, error: null };
  };
  const handle = async (req, res) => {
    touch();
    if (req.headers.authorization !== `Bearer ${config.token}`) {
      send(res, 401, { data: null, error: errorOf("auth-required", "Token do serviço inválido.") });
      return;
    }
    const url = new URL(req.url ?? "/", `http://${host}`);
    if (req.method !== "GET") {
      send(res, 405, { data: null, error: errorOf("bad-answer", "Método não permitido.") });
      return;
    }
    if (url.pathname === "/health") {
      send(res, 200, { ok: true });
      return;
    }
    if (url.pathname !== "/snapshot" && url.pathname !== "/strip") {
      send(res, 404, { data: null, error: errorOf("bad-answer", "Rota desconhecida.") });
      return;
    }
    const sessionId = url.searchParams.get("sessionId")?.trim();
    if (!sessionId) {
      send(res, 400, { data: null, error: errorOf("bad-answer", "sessionId é obrigatório.") });
      return;
    }
    try {
      const result = await build(sessionId, url.pathname === "/strip");
      send(res, 200, result);
    } catch (error) {
      if (error instanceof UpstreamError) {
        send(res, 200, { data: null, error: errorOf(error.code, error.message) });
        return;
      }
      send(res, 200, {
        data: null,
        error: errorOf("upstream-failed", error instanceof Error ? error.message : "Falha inesperada.")
      });
    }
  };
  const server = http.createServer((req, res) => {
    handle(req, res);
  });
  const start = () => new Promise((resolve) => {
    server.listen(config.port, host, () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : config.port;
      resolve(port);
    });
  });
  const stop = async () => {
    if (idle)
      clearTimeout(idle);
    idle = null;
    events?.stop();
    events = null;
    upstream = null;
    baseUrl = null;
    server.close();
    server.closeAllConnections?.();
    await new Promise((resolve) => {
      if (!server.listening) {
        resolve();
        return;
      }
      server.once("close", () => resolve());
    });
  };
  return { server, start, stop, handle };
};

// src/service/main.ts
var port = Number(process.env.OPENCHAMBER_SERVICE_PORT);
var token = process.env.OPENCHAMBER_SERVICE_TOKEN ?? "";
if (!Number.isInteger(port) || port <= 0 || !token) {
  console.error("Lens: OPENCHAMBER_SERVICE_PORT and OPENCHAMBER_SERVICE_TOKEN are required.");
  process.exit(1);
}
var service = createLensService({
  port,
  token,
  dataDir: process.env.OPENCHAMBER_DATA_DIR || defaultDataDir(),
  idleExitMs: 60000
});
await service.start();
var shutdown = () => {
  service.stop().finally(() => process.exit(0));
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
