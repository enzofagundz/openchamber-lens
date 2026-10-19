import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import { truncate } from '../shared/format.ts';
import type { LensDiffFile, LensError, LensSnapshot } from '../shared/types.ts';
import { diffRowsFromFiles, type DiffRow } from '../shared/view.ts';
import {
  requestGitDiff,
  requestInterrupt,
  requestSnapshot,
  requestTurnDiff,
} from './client.ts';
import { renderPanel, type DiffSource, type DiffView, type PanelTab } from './render.ts';
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
let diffSource: DiffSource = 'session';
let selectedTurn = 0;
let diffRowsState: DiffRow[] | null = null;
let diffMeta = '';
let diffLoading = false;
let diffError: string | null = null;
let diffRequest = 0;
let confirmingStop: string | null = null;
let confirmTimer: ReturnType<typeof setTimeout> | null = null;
const stoppingAgents = new Set<string>();
const expandedTurns = new Set<number>();
const expandedDiffs = new Set<string>();

const visible = (): boolean => !document.hidden && root.getBoundingClientRect().width > 0;

const turnOptions = (): Array<{ index: number; label: string }> =>
  (snapshot?.turns ?? []).map((turn) => ({
    index: turn.index,
    label: `#${turn.index} ${truncate(turn.request, 28)}`,
  }));

const diffView = (): DiffView => ({
  source: diffSource,
  rows: diffSource === 'session' ? null : (diffRowsState ?? []),
  selectedTurn,
  turnOptions: turnOptions(),
  meta: diffMeta || (diffSource === 'session' && snapshot ? `${snapshot.diff.length} arquivos` : ''),
  loading: diffLoading,
  error: diffError,
});

const clearConfirm = (): void => {
  if (confirmTimer) clearTimeout(confirmTimer);
  confirmTimer = null;
  confirmingStop = null;
};

const askStop = (id: string): void => {
  if (stoppingAgents.has(id)) return;
  if (confirmingStop !== id) {
    clearConfirm();
    confirmingStop = id;
    render();
    confirmTimer = setTimeout(() => {
      confirmingStop = null;
      confirmTimer = null;
      render();
    }, 4_000);
    return;
  }
  void stopAgent(id);
};

const stopAgent = async (id: string): Promise<void> => {
  if (!sessionId) return;
  clearConfirm();
  stoppingAgents.add(id);
  render();
  try {
    const result = await requestInterrupt(host, id, sessionId);
    if (result.data) {
      await host.toast({
        kind: result.data.interrupted ? 'info' : 'success',
        message: result.data.interrupted ? 'Pedido de parada enviado.' : 'O agente já não estava rodando.',
      });
    } else {
      await host.toast({ kind: 'error', message: result.error?.message ?? 'Não foi possível parar o agente.' });
    }
  } finally {
    stoppingAgents.delete(id);
    render();
    void poll();
  }
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
    diffView: diffView(),
    stoppingAgents,
    confirmingStop,
    onTab: (next) => {
      tab = next;
      render();
      if (next === 'diffs' && diffSource !== 'session') void loadDiff();
      else void poll();
    },
    onDiffSource: (next) => {
      diffRequest += 1;
      diffSource = next;
      diffRowsState = null;
      diffMeta = '';
      diffError = null;
      diffLoading = false;
      if (next === 'turn' && selectedTurn === 0) {
        selectedTurn = snapshot?.turns.at(-1)?.index ?? 0;
      }
      render();
      if (next !== 'session') void loadDiff();
    },
    onSelectTurn: (index) => {
      selectedTurn = index;
      render();
      void loadDiff();
    },
    onOpenAgent: (id) => {
      void host.openSession(id).catch(() => undefined);
    },
    onStopAgent: askStop,
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
  diffSource = 'session';
  selectedTurn = 0;
  diffRowsState = null;
  diffMeta = '';
  diffLoading = false;
  diffError = null;
  diffRequest += 1;
  stoppingAgents.clear();
  clearConfirm();
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
      if (selectedTurn === 0 && snapshot.turns.length > 0) {
        selectedTurn = snapshot.turns[snapshot.turns.length - 1]!.index;
      }
    } else {
      error = result.error ?? { code: 'bad-answer', message: 'Sem dados do serviço.' };
    }
    render();
  } finally {
    inFlight = false;
  }
};

const loadDiff = async (): Promise<void> => {
  if (!sessionId || diffSource === 'session') {
    diffLoading = false;
    render();
    return;
  }

  const wanted = sessionId;
  const request = ++diffRequest;
  diffLoading = true;
  diffError = null;
  render();

  try {
    if (diffSource === 'git') {
      const result = await requestGitDiff(host, wanted);
      if (request !== diffRequest || sessionId !== wanted) return;
      if (result.data) {
        diffRowsState = diffRowsFromFiles(result.data.files);
        const branch = result.data.branch ?? '—';
        const tracking = result.data.tracking ? ` → ${result.data.tracking}` : '';
        const travel = result.data.ahead || result.data.behind
          ? ` · ${result.data.ahead}↑ ${result.data.behind}↓`
          : '';
        diffMeta = `${branch}${tracking}${travel}`;
      } else {
        diffRowsState = [];
        diffError = result.error?.message ?? 'Não foi possível ler o Git.';
      }
    } else {
      const turn = selectedTurn || snapshot?.turns.at(-1)?.index || 1;
      selectedTurn = turn;
      const result = await requestTurnDiff(host, wanted, turn);
      if (request !== diffRequest || sessionId !== wanted) return;
      if (result.data) {
        diffRowsState = diffRowsFromFiles(result.data);
        diffMeta = `#${turn} · ${result.data.length} arquivos`;
      } else {
        diffRowsState = [];
        diffError = result.error?.message ?? 'Não foi possível ler o turno.';
      }
    }
  } finally {
    if (request === diffRequest) {
      diffLoading = false;
      render();
    }
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
