import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import type { LensError, LensSnapshot } from '../shared/types.ts';
import { requestSnapshot } from './client.ts';
import { renderPanel, type PanelTab } from './render.ts';
import { PANEL_STYLE } from './styles.ts';

const host = connectHost();
const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('Missing #root');

const style = document.createElement('style');
style.textContent = PANEL_STYLE;
document.head.append(style);

let mounted = false;
let sessionId: string | null = null;
let snapshot: LensSnapshot | null = null;
let error: LensError | null = null;
let tab: PanelTab = 'overview';
let inFlight = false;
const expandedTurns = new Set<number>();
const expandedDiffs = new Set<string>();

const visible = (): boolean => !document.hidden && root.getBoundingClientRect().width > 0;

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
    const result = await requestSnapshot(host, wanted);
    if (sessionId !== wanted) return;
    if (result.data) {
      snapshot = result.data;
      error = null;
    } else {
      error = result.error ?? { code: 'bad-answer', message: 'Sem dados do serviço.' };
    }
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
  mount();
  setSession(ctx.session);
});

host.onSession((next) => {
  setSession(next);
});

host.onSessionLifecycle((event) => {
  if (event.sessionId === sessionId) void poll();
});

mount();
void poll();
