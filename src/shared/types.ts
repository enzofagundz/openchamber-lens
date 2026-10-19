export type LensErrorCode =
  | 'no-server'
  | 'auth-required'
  | 'upstream-failed'
  | 'bad-answer'
  | 'session-not-found'
  | 'needs-approval'
  | 'paused'
  | 'service-failed'
  | 'unreachable'
  | 'forbidden'
  | 'not-git';

export type LensError = {
  code: LensErrorCode;
  message: string;
};

export type LensTokens = {
  input: number;
  output: number;
  reasoning: number;
  cacheRead: number;
  cacheWrite: number;
};

export type LensAgentStatus = 'running' | 'completed' | 'failed' | 'unknown';

export type LensAgent = {
  id: string;
  parentId: string | null;
  title: string;
  agent: string;
  model: string;
  status: LensAgentStatus;
  cost: number;
  tokens: LensTokens;
  toolCalls: number;
  startedAt: number | null;
  endedAt: number | null;
  depth: number;
  isMain: boolean;
};

export type LensTurn = {
  index: number;
  request: string;
  startedAt: number;
  durationMs: number;
  cost: number;
  tokens: LensTokens;
  toolCalls: number;
  failures: number;
  agents: string[];
  running: boolean;
};

export type LensDiffStatus = 'added' | 'modified' | 'deleted' | 'unknown';

export type LensDiffFile = {
  path: string;
  status: LensDiffStatus;
  additions: number;
  deletions: number;
  patch: string;
  truncated: boolean;
  note?: string;
};

export type LensGitDiff = {
  branch: string | null;
  tracking: string | null;
  ahead: number;
  behind: number;
  clean: boolean;
  files: LensDiffFile[];
};

export type LensRecentFile = {
  path: string;
  action: 'read' | 'edit';
  at: number | null;
};

export type LensSessionInfo = {
  id: string;
  title: string;
  directory: string | null;
  agent: string;
  model: {
    id: string;
    providerId: string;
    variant: string | null;
    name: string;
    contextLimit: number | null;
  };
  cost: number;
  tokens: LensTokens;
  createdAt: number | null;
  updatedAt: number | null;
  status: LensAgentStatus;
  context: {
    used: number | null;
    limit: number | null;
    percent: number | null;
  };
};

export type LensCounts = {
  messages: number;
  userTurns: number;
  assistantMessages: number;
  toolCalls: number;
  toolFailures: number;
  filesChanged: number;
};

export type LensSnapshot = {
  at: number;
  session: LensSessionInfo;
  counts: LensCounts;
  turns: LensTurn[];
  agents: LensAgent[];
  diff: LensDiffFile[];
  recentFiles: LensRecentFile[];
  error: LensError | null;
};

export type LensStrip = {
  at: number;
  sessionId: string;
  title: string;
  status: LensAgentStatus;
  contextPercent: number | null;
  contextUsed: number | null;
  contextLimit: number | null;
  cost: number;
  runningAgents: number;
  model: string;
  changedFiles: number;
  error: LensError | null;
};

export type RawTokens = {
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: {
    read?: number;
    write?: number;
  };
};

export type RawModelRef = {
  id?: string;
  providerID?: string;
  variant?: string;
};

export type RawSession = {
  id: string;
  parentID?: string | null;
  projectID?: string;
  title?: string;
  agent?: string;
  model?: RawModelRef;
  cost?: number;
  tokens?: RawTokens;
  time?: {
    created?: number;
    updated?: number;
    idle?: number;
  };
  location?: {
    directory?: string;
  };
  error?: unknown;
};

export type RawPart = {
  type?: string;
  name?: string;
  text?: string;
  state?: {
    status?: string;
    input?: Record<string, unknown>;
    content?: unknown;
    metadata?: unknown;
  };
  time?: {
    created?: number;
    ran?: number;
  };
};

export type RawMessage = {
  id: string;
  type?: string;
  text?: string;
  agent?: string;
  model?: RawModelRef;
  cost?: number;
  tokens?: RawTokens;
  time?: {
    created?: number;
    streamed?: number;
    completed?: number;
  };
  content?: RawPart[];
};

export type RawDiff = {
  file?: string;
  patch?: string;
};

export type RawGitFile = {
  path?: string;
  index?: string;
  working_dir?: string;
};

export type RawGitStatus = {
  current?: string | null;
  tracking?: string | null;
  ahead?: number;
  behind?: number;
  files?: RawGitFile[];
  isClean?: boolean;
};

export type RawGitDiff = {
  diff?: string;
  submodule?: unknown;
};

export type RawModel = {
  id?: string;
  modelID?: string;
  providerID?: string;
  name?: string;
  limit?: {
    context?: number;
    output?: number;
  };
};

export type RawActive = Record<string, { type?: string } | undefined>;

export type RunResult<T> =
  | { data: T; error: null }
  | { data: null; error: LensError };

export type SnapshotResponse = {
  data: LensSnapshot | null;
  error: LensError | null;
};

export type StripResponse = {
  data: LensStrip | null;
  error: LensError | null;
};
