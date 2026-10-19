import type {
  RawActive,
  RawDiff,
  RawMessage,
  RawModel,
  RawSession,
} from '../src/shared/types.ts';

export const models: RawModel[] = [
  {
    id: 'deepseek',
    modelID: 'deepseek',
    providerID: 'opencode-go',
    name: 'DeepSeek V4',
    limit: { context: 1_000, output: 100 },
  },
];

export const rootSession: RawSession = {
  id: 'ses_root',
  title: 'Sessão de teste',
  agent: 'build',
  model: { id: 'deepseek', providerID: 'opencode-go', variant: 'max' },
  cost: 0.5,
  tokens: { input: 300, output: 70, reasoning: 10, cache: { read: 500, write: 0 } },
  time: { created: 1_000, updated: 2_400, idle: 2_400 },
  location: { directory: '/projeto' },
};

export const childSession: RawSession = {
  id: 'ses_child',
  parentID: 'ses_root',
  title: 'Investigar',
  agent: 'explore',
  model: { id: 'deepseek', providerID: 'opencode-go', variant: 'high' },
  cost: 0.2,
  tokens: { input: 100, output: 20, reasoning: 5, cache: { read: 50, write: 0 } },
  time: { created: 2_000, updated: 2_300, idle: 2_300 },
};

export const grandchildSession: RawSession = {
  id: 'ses_grand',
  parentID: 'ses_child',
  title: 'Detalhe',
  agent: 'explore',
  model: { id: 'deepseek', providerID: 'opencode-go' },
  cost: 0.05,
  tokens: { input: 40, output: 10, reasoning: 0, cache: { read: 0, write: 0 } },
  time: { created: 2_500, updated: 2_600, idle: 2_600 },
};

export const rootMessages: RawMessage[] = [
  {
    id: 'm_synthetic',
    type: 'synthetic',
    text: 'system reminder',
    time: { created: 500 },
  },
  {
    id: 'm_user_1',
    type: 'user',
    text: 'Primeiro pedido',
    time: { created: 1_000 },
  },
  {
    id: 'm_a_1',
    type: 'assistant',
    agent: 'build',
    model: { id: 'deepseek', providerID: 'opencode-go' },
    cost: 0.1,
    tokens: { input: 100, output: 50, reasoning: 0, cache: { read: 200, write: 0 } },
    time: { created: 1_100, completed: 1_200 },
    content: [
      {
        type: 'tool',
        name: 'read',
        state: {
          status: 'completed',
          input: { path: '/projeto/a.ts' },
          metadata: {
            files: [
              {
                file: '/projeto/a.ts',
                patch: 'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-old\n+new\n',
              },
            ],
          },
        },
        time: { created: 1_150 },
      },
      {
        type: 'tool',
        name: 'write',
        state: { status: 'failed', input: { path: '/projeto/b.ts' } },
        time: { created: 1_180 },
      },
    ],
  },
  {
    id: 'm_user_2',
    type: 'user',
    text: 'Segundo pedido',
    time: { created: 2_000 },
  },
  {
    id: 'm_a_2',
    type: 'assistant',
    agent: 'build',
    model: { id: 'deepseek', providerID: 'opencode-go' },
    cost: 0.2,
    tokens: { input: 200, output: 20, reasoning: 10, cache: { read: 300, write: 0 } },
    time: { created: 2_100, completed: 2_400 },
    content: [
      {
        type: 'tool',
        name: 'shell',
        state: { status: 'running', input: { command: 'ls' } },
        time: { created: 2_150 },
      },
      {
        type: 'tool',
        name: 'edit',
        state: { status: 'completed', input: { path: '/projeto/a.ts' } },
        time: { created: 2_200 },
      },
    ],
  },
];

export const childMessages: RawMessage[] = [
  {
    id: 'c_user',
    type: 'user',
    text: 'Investigar o arquivo',
    time: { created: 2_050 },
  },
  {
    id: 'c_a',
    type: 'assistant',
    cost: 0.2,
    tokens: { input: 100, output: 20, reasoning: 5, cache: { read: 50, write: 0 } },
    time: { created: 2_100, completed: 2_300 },
    content: [
      {
        type: 'tool',
        name: 'read',
        state: { status: 'completed', input: { path: '/projeto/a.ts' } },
        time: { created: 2_150 },
      },
    ],
  },
];

export const diff: RawDiff[] = [
  {
    file: '/projeto/a.ts',
    patch:
      'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1,2 @@\n-old\n+new\n+extra\n',
  },
  {
    file: '/projeto/b.ts',
    patch: 'diff --git a/b.ts b/b.ts\nnew file mode 100644\n--- /dev/null\n+++ b/b.ts\n@@ -0,0 +1 @@\n+hello\n',
  },
  {
    file: '/projeto/c.ts',
    patch: 'diff --git a/c.ts b/c.ts\ndeleted file mode 100644\n--- a/c.ts\n+++ /dev/null\n@@ -1 +0,0 @@\n-bye\n',
  },
];

export const active: RawActive = {
  ses_root: { type: 'running' },
  ses_child: { type: 'running' },
};
