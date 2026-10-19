import { describe, expect, test } from 'bun:test';

import {
  buildSnapshot,
  buildStrip,
  deriveDiff,
  deriveRecentFiles,
  deriveTurnDiff,
  deriveTurns,
  descendantSessions,
  tokensOf,
} from '../src/shared/derive.ts';
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

const snapshot = () =>
  buildSnapshot({
    session: rootSession,
    sessions: [rootSession, childSession, grandchildSession],
    messagesBySession: {
      ses_root: rootMessages,
      ses_child: childMessages,
      ses_grand: [],
    },
    diff,
    models,
    active,
    now: 3_000,
  });

describe('tokens', () => {
  test('normalizes missing cache values', () => {
    expect(tokensOf({ input: 1 })).toEqual({
      input: 1,
      output: 0,
      reasoning: 0,
      cacheRead: 0,
      cacheWrite: 0,
    });
  });
});

describe('descendantSessions', () => {
  test('walks the parent chain in creation order', () => {
    expect(descendantSessions('ses_root', [rootSession, childSession, grandchildSession]).map((s) => s.id)).toEqual([
      'ses_child',
      'ses_grand',
    ]);
  });

  test('stops on cycles', () => {
    const loop = [
      { ...rootSession, parentID: 'ses_child' },
      { ...childSession, parentID: 'ses_root' },
    ];
    expect(descendantSessions('ses_root', loop).map((s) => s.id)).toEqual(['ses_child']);
  });
});

describe('deriveTurns', () => {
  test('groups by user message and ignores synthetic messages', () => {
    const turns = deriveTurns(rootMessages, [childSession, grandchildSession], active, 3_000, 'ses_root');
    expect(turns).toHaveLength(2);
    expect(turns[0]?.request).toBe('Primeiro pedido');
    expect(turns[0]?.toolCalls).toBe(2);
    expect(turns[0]?.failures).toBe(1);
    expect(turns[0]?.agents).toEqual([]);
    expect(turns[0]?.running).toBe(false);
  });

  test('marks the last turn as running when the session is active', () => {
    const turns = deriveTurns(rootMessages, [childSession, grandchildSession], active, 3_000, 'ses_root');
    expect(turns[1]?.running).toBe(true);
    expect(turns[1]?.durationMs).toBe(1_000);
  });

  test('attributes children created inside the turn window', () => {
    const turns = deriveTurns(rootMessages, [childSession, grandchildSession], active, 3_000, 'ses_root');
    expect(turns[1]?.agents.sort()).toEqual(['ses_child', 'ses_grand']);
  });
});

describe('deriveDiff', () => {
  test('counts lines and classifies files', () => {
    const files = deriveDiff(diff);
    expect(files.map((file) => file.status)).toEqual(['modified', 'added', 'deleted']);
    expect(files[0]).toMatchObject({ additions: 2, deletions: 1 });
    expect(files[1]).toMatchObject({ additions: 1, deletions: 0 });
    expect(files[2]).toMatchObject({ additions: 0, deletions: 1 });
  });

  test('caps a patch and marks it truncated', () => {
    const long = 'x'.repeat(25_000);
    const [file] = deriveDiff([{ file: 'a.ts', patch: `+${long}` }]);
    expect(file?.patch.length).toBe(20_000);
    expect(file?.truncated).toBe(true);
  });

  test('keeps the first change visible when the unchanged prefix is huge', () => {
    const prefix = Array.from({ length: 4_000 }, (_, index) => ` context ${index}`).join('\n');
    const patch = `diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n${prefix}\n+linha nova\n`;
    const [file] = deriveDiff([{ file: 'a.ts', patch }]);
    expect(file?.truncated).toBe(true);
    expect(file?.patch).toContain('+linha nova');
    expect(file?.additions).toBe(1);
  });
});

describe('deriveRecentFiles', () => {
  test('deduplicates by path and lets an edit win over a read', () => {
    const files = deriveRecentFiles(rootMessages);
    expect(files[0]).toMatchObject({ path: '/projeto/a.ts', action: 'edit' });
    expect(files.some((file) => file.path === '/projeto/b.ts')).toBe(true);
  });
});

describe('deriveTurnDiff', () => {
  const patch = 'diff --git a/a.ts b/a.ts\n--- a/a.ts\n+++ b/a.ts\n@@ -1 +1 @@\n-old\n+novo\n';
  const messages = [
    { id: 'u1', type: 'user', text: 'primeiro', time: { created: 1_000 } },
    {
      id: 'a1',
      type: 'assistant',
      time: { created: 1_100, completed: 1_200 },
      content: [
        {
          type: 'tool',
          name: 'edit',
          state: {
            status: 'completed',
            input: { path: '/projeto/a.ts' },
            metadata: { files: [{ file: '/projeto/a.ts', patch }] },
          },
        },
        {
          type: 'tool',
          name: 'write',
          state: { status: 'completed', input: { path: '/projeto/b.ts', content: 'x' }, metadata: {} },
        },
      ],
    },
    { id: 'u2', type: 'user', text: 'segundo', time: { created: 2_000 } },
    { id: 'a2', type: 'assistant', time: { created: 2_100, completed: 2_200 }, content: [] },
  ] satisfies import('../src/shared/types.ts').RawMessage[];

  test('uses tool metadata patches for a turn', () => {
    const files = deriveTurnDiff(messages, 1);
    expect(files.map((file) => file.path)).toEqual(['/projeto/a.ts', '/projeto/b.ts']);
    expect(files[0]?.additions).toBe(1);
    expect(files[0]?.deletions).toBe(1);
    expect(files[1]?.note).toContain('write');
  });

  test('falls back to old/new strings when metadata is absent', () => {
    const fallback = [
      { id: 'u1', type: 'user', text: 'pedido', time: { created: 1_000 } },
      {
        id: 'a1',
        type: 'assistant',
        time: { created: 1_100, completed: 1_200 },
        content: [
          {
            type: 'tool',
            name: 'edit',
            state: {
              status: 'completed',
              input: { path: '/projeto/a.ts', oldString: 'velho', newString: 'novo' },
            },
          },
        ],
      },
    ] satisfies import('../src/shared/types.ts').RawMessage[];
    const files = deriveTurnDiff(fallback, 1);
    expect(files[0]?.patch).toContain('+novo');
    expect(files[0]?.additions).toBe(1);
  });

  test('returns nothing for an unknown turn', () => {
    expect(deriveTurnDiff(messages, 9)).toEqual([]);
  });
});

describe('buildSnapshot', () => {
  test('builds the session, context, counts, agents and turns', () => {
    const data = snapshot();
    expect(data.session.title).toBe('Sessão de teste');
    expect(data.session.context).toEqual({ used: 530, limit: 1_000, percent: 53 });
    expect(data.counts).toMatchObject({
      userTurns: 2,
      assistantMessages: 2,
      toolCalls: 4,
      toolFailures: 1,
      filesChanged: 3,
    });
    expect(data.agents.map((agent) => [agent.id, agent.depth, agent.status])).toEqual([
      ['ses_root', 0, 'running'],
      ['ses_child', 1, 'running'],
      ['ses_grand', 2, 'completed'],
    ]);
  });

  test('falls back to the sum of assistant costs when the session has none', () => {
    const data = buildSnapshot({
      session: { ...rootSession, cost: undefined, tokens: undefined },
      sessions: [rootSession],
      messagesBySession: { ses_root: rootMessages },
      diff: [],
      models,
      active: {},
      now: 3_000,
    });
    expect(data.session.cost).toBeCloseTo(0.3);
    expect(data.session.tokens.input).toBe(300);
  });

  test('keeps an unknown context limit as null', () => {
    const data = buildSnapshot({
      session: rootSession,
      sessions: [rootSession],
      messagesBySession: { ses_root: rootMessages },
      diff: [],
      models: [],
      active: {},
      now: 3_000,
    });
    expect(data.session.context.limit).toBeNull();
    expect(data.session.context.percent).toBeNull();
  });

  test('builds the compact strip payload', () => {
    expect(buildStrip(snapshot())).toMatchObject({
      sessionId: 'ses_root',
      contextPercent: 53,
      runningAgents: 1,
      changedFiles: 3,
      model: 'DeepSeek V4',
    });
  });
});
