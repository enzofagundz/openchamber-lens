import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import { truncate } from '../shared/format.ts';
import type {
  LensDiffFile,
  LensError,
  LensHistoryPoint,
  LensInventory,
  LensSnapshot,
  LensTreeEntry,
} from '../shared/types.ts';
import { diffRowsFromFiles, type DiffRow } from '../shared/view.ts';
import {
  clearHistory,
  requestGitDiff,
  requestHistory,
  requestInterrupt,
  requestInventory,
  requestSnapshot,
  requestTree,
  requestTurnDiff,
} from './client.ts';
import {
  renderPanel,
  type DiffSource,
  type DiffView,
  type HistoryView,
  type InventoryView,
  type PanelTab,
  type TreeView,
} from './render.ts';
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
let treeRoot: string | null = null;
let treeEntries: Record<string, LensTreeEntry[]> = {};
let treeLoading = false;
let treeError: string | null = null;
const treeExpanded = new Set<string>();
let inventoryData: LensInventory | null = null;
let inventoryLoading = false;
let inventoryError: string | null = null;
let inventoryFilter = '';
let historyPoints: LensHistoryPoint[] = [];
let historyError: string | null = null;
let lastHistoryAt = 0;
let settingsOpen = false;
let brlRate = 0;
let brlInput = '';
let confirmingClear = false;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
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

const treeView = (): TreeView => ({
  root: treeRoot,
  entries: treeEntries,
  expanded: treeExpanded,
  loading: treeLoading,
  error: treeError,
});

const inventoryView = (): InventoryView => ({
  data: inventoryData,
  loading: inventoryLoading,
  error: inventoryError,
  filter: inventoryFilter,
});

const historyView = (): HistoryView => ({ points: historyPoints, error: historyError });

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
    tree: treeView(),
    inventory: inventoryView(),
    history: historyView(),
    brlRate,
    settingsOpen,
    brlInput,
    confirmingClear,
    stoppingAgents,
    confirmingStop,
    onTab: (next) => {
      tab = next;
      render();
      if (next === 'diffs' && diffSource !== 'session') void loadDiff();
      else if (next === 'tree') void loadTree();
      else if (next === 'inventory') void loadInventory();
      else if (next === 'overview' && Date.now() - lastHistoryAt > 10_000) void loadHistory();
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
    onTreeToggle: (path) => {
      if (treeExpanded.has(path)) {
        treeExpanded.delete(path);
        render();
      } else {
        treeExpanded.add(path);
        render();
        if (!treeEntries[path]) void loadTree(path);
      }
    },
    onInventoryFilter: (value) => {
      inventoryFilter = value;
      render();
      const input = root.querySelector<HTMLInputElement>('.inventory-filter');
      if (input) {
        input.focus();
        input.setSelectionRange(value.length, value.length);
      }
    },
    onSettings: () => {
      settingsOpen = !settingsOpen;
      render();
    },
    onBrlInput: (value) => {
      brlInput = value;
    },
    onSaveSettings: () => {
      void saveSettings();
    },
    onClearHistory: askClearHistory,
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
  treeRoot = null;
  treeEntries = {};
  treeExpanded.clear();
  treeLoading = false;
  treeError = null;
  inventoryData = null;
  inventoryLoading = false;
  inventoryError = null;
  inventoryFilter = '';
  historyPoints = [];
  historyError = null;
  lastHistoryAt = 0;
  confirmingClear = false;
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = null;
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
    if (tab === 'overview' && Date.now() - lastHistoryAt > 10_000) void loadHistory();
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

const loadTree = async (key = '.', force = false): Promise<void> => {
  if (!sessionId) return;
  if (!force && treeEntries[key]) return;
  const wanted = sessionId;
  treeLoading = true;
  treeError = null;
  render();
  try {
    const result = await requestTree(host, wanted, key === '.' ? undefined : key);
    if (sessionId !== wanted) return;
    if (result.data) {
      treeRoot = result.data.root;
      treeEntries = { ...treeEntries, [key]: result.data.entries };
    } else {
      treeError = result.error?.message ?? 'Não foi possível ler a árvore.';
    }
  } finally {
    treeLoading = false;
    render();
  }
};

const loadInventory = async (force = false): Promise<void> => {
  if (!sessionId || (inventoryData && !force)) return;
  const wanted = sessionId;
  inventoryLoading = true;
  inventoryError = null;
  render();
  try {
    const result = await requestInventory(host, wanted);
    if (sessionId !== wanted) return;
    if (result.data) {
      inventoryData = result.data;
    } else {
      inventoryError = result.error?.message ?? 'Não foi possível ler o inventário.';
    }
  } finally {
    inventoryLoading = false;
    render();
  }
};

const loadHistory = async (): Promise<void> => {
  if (!sessionId) return;
  const wanted = sessionId;
  lastHistoryAt = Date.now();
  try {
    const result = await requestHistory(host, wanted);
    if (sessionId !== wanted) return;
    if (result.data) {
      historyPoints = result.data;
      historyError = null;
    } else {
      historyError = result.error?.message ?? null;
    }
    render();
  } catch {
    // History is optional; the rest of the panel stays usable.
  }
};

const loadSettings = async (): Promise<void> => {
  try {
    const stored = await host.storage.get('settings');
    if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
      const rate = (stored as Record<string, unknown>).brlRate;
      if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
        brlRate = rate;
        brlInput = String(rate);
      }
    }
  } catch {
    // Settings are optional.
  }
  render();
};

const saveSettings = async (): Promise<void> => {
  const rate = Number(brlInput.replace(',', '.'));
  brlRate = Number.isFinite(rate) && rate > 0 ? Math.min(100, rate) : 0;
  brlInput = brlRate > 0 ? String(brlRate) : '';
  settingsOpen = false;
  render();
  try {
    await host.storage.set('settings', { brlRate });
    await host.toast({ kind: 'success', message: 'Cotação salva.' });
  } catch {
    await host.toast({ kind: 'error', message: 'Não foi possível salvar a cotação.' });
  }
};

const askClearHistory = (): void => {
  if (clearTimer) clearTimeout(clearTimer);
  if (!confirmingClear) {
    confirmingClear = true;
    render();
    clearTimer = setTimeout(() => {
      confirmingClear = false;
      clearTimer = null;
      render();
    }, 4_000);
    return;
  }
  confirmingClear = false;
  clearTimer = null;
  render();
  if (!sessionId) return;
  void clearHistory(host, sessionId).then((result) => {
    if (result.data) {
      historyPoints = [];
      historyError = null;
      render();
      void host.toast({ kind: 'success', message: 'Histórico limpo.' });
    } else {
      void host.toast({ kind: 'error', message: result.error?.message ?? 'Não foi possível limpar.' });
    }
  });
};

const mount = (): void => {
  if (mounted) return;
  mounted = true;
  render();
  void loadSettings();
  void loadHistory();
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

host.onResolve(async ({ command }) => {
  if (command !== 'lens') return null;
  await host.openSurface('plugin:lens');
  return null;
});

mount();
void poll();
