import { connectHost, HostRequestError } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import type { LensError, LensSnapshot } from '../shared/types.ts';
import { renderPanel, type PanelTab } from './render.ts';

const host = connectHost();
const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('Missing #root');

let mounted = false;
let sessionId: string | null = null;
let directory: string | null = null;
let snapshot: LensSnapshot | null = null;
let error: LensError | null = null;
let tab: PanelTab = 'overview';
let inFlight = false;
const expandedTurns = new Set<number>();
const expandedDiffs = new Set<string>();

const visible = (): boolean => !document.hidden && root.getBoundingClientRect().width > 0;

const hostError = (value: unknown): LensError => {
  if (value instanceof HostRequestError) {
    if (value.code === 'NO_SERVICE' || value.code === 'NOT_GRANTED') {
      return { code: 'needs-approval', message: value.message };
    }
    if (value.code === 'DISABLED') return { code: 'paused', message: value.message };
    if (value.code === 'SERVICE_FAILED') return { code: 'service-failed', message: value.message };
  }
  return {
    code: 'unreachable',
    message: value instanceof Error ? value.message : 'Serviço local inacessível.',
  };
};

const render = (): void => {
  if (!mounted) return;
  renderPanel(root, {
    snapshot,
    error,
    hasSession: sessionId !== null,
    tab,
    expandedTurns,
    expandedDiffs,
    onTab: (next) => {
      tab = next;
      render();
      void poll();
    },
    onOpenAgent: (id) => {
      void host.openSession(id).catch(() => undefined);
    },
    onToggleTurn: (index) => {
      if (expandedTurns.has(index)) expandedTurns.delete(index);
      else expandedTurns.add(index);
      render();
    },
    onToggleDiff: (path) => {
      if (expandedDiffs.has(path)) expandedDiffs.delete(path);
      else expandedDiffs.add(path);
      render();
    },
  });
};

const reset = (): void => {
  snapshot = null;
  error = null;
  expandedTurns.clear();
  expandedDiffs.clear();
  render();
};

const poll = async (): Promise<void> => {
  if (!sessionId || inFlight || !visible()) return;
  const wanted = sessionId;
  inFlight = true;
  try {
    const result = await host.serviceRequest({
      method: 'GET',
      path: '/snapshot',
      query: { sessionId: wanted, ...(directory ? { directory } : {}) },
    });
    if (sessionId !== wanted) return;
    let body: { data?: LensSnapshot | null; error?: LensError | null } = {};
    try {
      body = JSON.parse(result.body) as typeof body;
    } catch {
      error = { code: 'bad-answer', message: 'Resposta do serviço não é JSON.' };
      render();
      return;
    }
    if (body.data) snapshot = body.data;
    error = body.error ?? null;
    render();
  } catch (value) {
    error = hostError(value);
    render();
  } finally {
    inFlight = false;
  }
};

const setSession = (next: { id: string } | null): void => {
  const id = next?.id ?? null;
  if (id === sessionId) return;
  sessionId = id;
  reset();
  if (id) void poll();
};

const mount = (): void => {
  if (mounted) return;
  mounted = true;
  render();
  setInterval(() => {
    if (visible()) void poll();
  }, 1_500);
  document.addEventListener('visibilitychange', () => {
    if (visible()) void poll();
  });
  window.addEventListener('resize', () => {
    if (visible()) void poll();
  });
};

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement);
  directory = ctx.directory;
  mount();
  setSession(ctx.session);
});

host.onSession((next) => {
  setSession(next);
});

host.onDirectory((next) => {
  directory = next;
  if (sessionId) void poll();
});

host.onSessionLifecycle((event) => {
  if (event.sessionId === sessionId) void poll();
});

mount();
void poll();
