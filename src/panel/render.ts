import { formatTokens } from '../shared/format.ts';
import { strings, errorText } from '../shared/strings.ts';
import type { LensSnapshot } from '../shared/types.ts';
import {
  agentRows,
  diffRows,
  overviewModel,
  tabCounts,
  turnRows,
  type AgentRow,
  type DiffRow,
  type Metric,
  type TurnMeta,
  type TurnRow,
} from '../shared/view.ts';
import { el } from './dom.ts';

export type PanelTab = 'overview' | 'agents' | 'turns' | 'diffs';

export type PanelProps = {
  snapshot: LensSnapshot | null;
  error: { code: string; message: string } | null;
  hasSession: boolean;
  tab: PanelTab;
  expandedTurns: ReadonlySet<number>;
  expandedDiffs: ReadonlySet<string>;
  onTab: (tab: PanelTab) => void;
  onOpenAgent: (id: string) => void;
  onToggleTurn: (index: number) => void;
  onToggleDiff: (path: string) => void;
};

const TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'overview', label: strings.tabs.overview },
  { id: 'agents', label: strings.tabs.agents },
  { id: 'turns', label: strings.tabs.turns },
  { id: 'diffs', label: strings.tabs.diffs },
];

const svgIcon = (paths: string[], size = 12): SVGSVGElement => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('aria-hidden', 'true');
  for (const d of paths) {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.4');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.append(path);
  }
  return svg;
};

const chevron = (open: boolean): SVGSVGElement => {
  const icon = svgIcon(['M6 4l4 4-4 4']);
  icon.classList.add('turn-chevron');
  if (open) icon.classList.add('open');
  return icon;
};

const statusPill = (label: string, tone: Metric['tone']): HTMLElement => {
  const pill = el('span', 'lens-status');
  pill.append(el('span', `status-dot ${tone}`), el('span', undefined, label));
  return pill;
};

const empty = (title: string, body?: string): HTMLElement =>
  el('div', 'empty', [
    el('div', 'empty-title', undefined, title),
    body ? el('div', 'empty-body', undefined, body) : null,
  ]);

const header = (props: PanelProps): HTMLElement => {
  const session = props.snapshot?.session;
  const title = session?.title ?? strings.app;
  const subtitle = session
    ? `${session.agent} · ${session.model.name}${session.model.variant ? ` · ${session.model.variant}` : ''}`
    : props.hasSession
      ? 'Lendo sessão…'
      : strings.empty.noSessionHint;
  const tone: Metric['tone'] =
    session?.status === 'running' ? 'normal' : session?.status === 'failed' ? 'danger' : 'muted';
  const statusLabel = session
    ? strings.status[session.status as keyof typeof strings.status] ?? strings.labels.unknown
    : '';

  return el('div', 'lens-header', [
    el('div', 'lens-header-main', [
      el('div', 'lens-title', undefined, title),
      el('div', 'lens-sub', undefined, subtitle),
    ]),
    session ? statusPill(statusLabel, tone) : null,
  ]);
};

const tabCount = (snapshot: LensSnapshot | null, id: PanelTab): number | null => {
  if (!snapshot) return null;
  const counts = tabCounts(snapshot);
  if (id === 'agents') return counts.agents;
  if (id === 'turns') return counts.turns;
  if (id === 'diffs') return counts.diffs;
  return null;
};

const tabs = (props: PanelProps): HTMLElement => {
  const bar = el('div', 'lens-tabs');
  for (const tab of TABS) {
    const node = el('button', `lens-tab ${props.tab === tab.id ? 'active' : ''}`);
    node.type = 'button';
    node.setAttribute('aria-pressed', String(props.tab === tab.id));
    node.append(el('span', undefined, tab.label));
    const count = tabCount(props.snapshot, tab.id);
    if (count !== null && count > 0) {
      node.append(el('span', 'lens-tab-count', String(count)));
    }
    node.addEventListener('click', () => props.onTab(tab.id));
    bar.append(node);
  }
  return bar;
};

const sectionBar = (number: number, label: string, count?: number): HTMLElement => {
  const bar = el('div', 'section-bar');
  bar.append(
    el('span', 'section-number', String(number).padStart(2, '0')),
    el('span', 'section-label', label),
  );
  if (count !== undefined) bar.append(el('span', 'section-count', String(count)));
  return bar;
};

const section = (number: number, label: string, content: HTMLElement, count?: number): HTMLElement =>
  el('div', 'lens-section', [sectionBar(number, label, count), content]);

const statCard = (metric: Metric): HTMLElement => {
  const card = el('div', 'stat-card', [
    el('div', 'stat-label', undefined, metric.label),
    el('div', `stat-value ${metric.tone}`, undefined, metric.value),
    metric.hint ? el('div', 'stat-hint', undefined, metric.hint) : null,
  ]);
  if (metric.label === strings.labels.duration) card.classList.add('duration-card');
  if (metric.label === strings.labels.model) card.classList.add('model-card');
  return card;
};

const contextCard = (snapshot: LensSnapshot, metric: Metric): HTMLElement => {
  const { percent, used, limit } = snapshot.session.context;
  const fill = el('div', `context-fill ${metric.tone}`);
  fill.style.transform = `scaleX(${Math.max(0, Math.min(100, percent ?? 0)) / 100})`;
  const meter = el('div', 'context-meter');
  meter.append(fill);
  return el('div', 'stat-card context-card', [
    el('div', 'stat-label', undefined, metric.label),
    el('div', `stat-value ${metric.tone}`, undefined, metric.value),
    meter,
    el('div', 'context-meta', [el('span', undefined, metric.hint ?? 'sem leitura')]),
  ]);
};

const tokenCard = (tokens: Metric[]): HTMLElement => {
  const grid = el('div', 'token-grid');
  for (const token of tokens) {
    grid.append(
      el('div', 'token-item', [
        el('div', 'stat-label', undefined, token.label),
        el('div', 'token-value', undefined, token.value),
      ]),
    );
  }
  return el('div', 'stat-card token-card', [el('div', 'stat-label', undefined, strings.labels.tokens), grid]);
};

const metaList = (items: TurnMeta[], className = 'turn-meta'): HTMLElement => {
  const wrap = el('div', className);
  items.forEach((item, index) => {
    if (index > 0) wrap.append(el('span', 'meta-sep', '·'));
    wrap.append(el('span', `meta-${item.tone}`, item.text));
  });
  return wrap;
};

const lastTurnCard = (turn: TurnRow): HTMLElement =>
  el('div', 'panel-card turn-summary', [
    el('div', 'turn-summary-request', undefined, turn.request),
    metaList(turn.meta),
  ]);

const recentFiles = (
  files: Array<{ path: string; action: string; age: string }>,
): HTMLElement => {
  if (files.length === 0) return empty(strings.empty.noRecent);
  const card = el('div', 'panel-card');
  for (const file of files) {
    card.append(
      el('div', 'list-row', [
        el('div', 'list-main', [
          el('div', 'list-path', undefined, file.path),
          el('div', 'list-meta', undefined, file.action),
        ]),
        el('div', 'list-age', undefined, file.age),
      ]),
    );
  }
  return card;
};

const overview = (snapshot: LensSnapshot): HTMLElement => {
  const model = overviewModel(snapshot);
  const context = model.metrics[0];
  const cards = model.metrics.slice(1).map(statCard);
  const grid = el('div', 'lens-grid');
  if (context) grid.append(contextCard(snapshot, context));
  grid.append(...cards);

  return el('div', undefined, [
    grid,
    tokenCard(model.tokens),
    section(
      1,
      strings.sections.lastTurn,
      model.lastTurn ? lastTurnCard(model.lastTurn) : empty(strings.empty.noTurns),
    ),
    section(2, strings.sections.recentFiles, recentFiles(model.recentFiles)),
  ]);
};

const agentIcon = (main: boolean): SVGSVGElement =>
  main
    ? svgIcon(['M8 2.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z', 'M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z'])
    : svgIcon(['M8 3a5 5 0 1 0 0 10A5 5 0 0 0 8 3Z', 'M5.5 8h5']);

const agentCard = (row: AgentRow, props: PanelProps): HTMLElement => {
  const card = el('div', `agent-card ${row.canOpen ? 'clickable' : ''}`);
  card.style.marginLeft = `${row.depth * 10}px`;

  const avatar = el('span', `agent-avatar ${row.tone}`);
  avatar.append(agentIcon(row.isMain));

  const head = el('div', 'agent-head', [
    el('span', 'agent-title', undefined, row.title),
    el('span', `status-dot ${row.tone}`),
    el('span', 'muted', undefined, row.status),
  ]);

  const meta = el('div', 'agent-meta');
  if (row.parentTitle) meta.append(el('span', undefined, `${strings.labels.parent}: ${row.parentTitle}`));
  meta.append(el('span', undefined, row.model));

  const figures = el('div', 'agent-figures', [
    el('span', undefined, [el('b', undefined, undefined, row.cost), ' custo']),
    el('span', undefined, [el('b', undefined, undefined, row.tokens), ' tokens']),
    el('span', undefined, [el('b', undefined, undefined, row.tools), ' ferramentas']),
  ]);

  const body = el('div', 'agent-body', [head, meta, figures]);
  card.append(avatar, body);

  if (row.canOpen) {
    const open = el('button', 'agent-open', undefined, strings.labels.open);
    open.type = 'button';
    open.addEventListener('click', (event) => {
      event.stopPropagation();
      props.onOpenAgent(row.id);
    });
    card.append(open);
    card.addEventListener('click', () => props.onOpenAgent(row.id));
  }

  return card;
};

const agents = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = agentRows(snapshot);
  const children = rows.filter((row) => !row.isMain);
  const content =
    children.length === 0
      ? empty(strings.empty.noAgents)
      : el('div', undefined, children.map((row) => agentCard(row, props)));
  return section(1, strings.sections.agents, content, children.length);
};

const turnCard = (row: TurnRow, snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const turn = snapshot.turns.find((entry) => entry.index === row.index);
  const open = props.expandedTurns.has(row.index);
  const card = el('div', 'turn-card');
  const head = el('button', 'turn-head');
  head.type = 'button';
  head.setAttribute('aria-expanded', String(open));

  const body = el('div', 'list-main', [
    el('div', 'turn-request', undefined, row.request),
    metaList(row.meta),
  ]);

  head.append(el('span', 'turn-index', undefined, `#${row.index}`), body);

  if (row.running) {
    const state = el('span', 'turn-state');
    state.append(el('span', 'status-dot normal'), el('span', undefined, strings.labels.runningTurn));
    head.append(state);
  }

  head.append(chevron(open));
  head.addEventListener('click', () => props.onToggleTurn(row.index));
  card.append(head);

  if (open && turn) {
    const agentsText = turn.agents
      .map((id) => snapshot.agents.find((agent) => agent.id === id)?.title ?? id)
      .join(', ');
    const tokens =
      turn.tokens.input + turn.tokens.output + turn.tokens.reasoning + turn.tokens.cacheRead + turn.tokens.cacheWrite;

    const detail = el('div', 'turn-detail', [
      el('div', 'detail-item detail-full', [
        el('div', 'detail-label', undefined, strings.labels.request),
        el('div', 'detail-value', undefined, turn.request || '—'),
      ]),
      el('div', 'detail-item', [
        el('div', 'detail-label', undefined, strings.labels.tools),
        el('div', 'detail-value', undefined, `${turn.toolCalls} ferramentas · ${turn.failures} falhas`),
      ]),
      el('div', 'detail-item', [
        el('div', 'detail-label', undefined, strings.labels.agentTree),
        el('div', 'detail-value', undefined, agentsText || '—'),
      ]),
      el('div', 'detail-item', [
        el('div', 'detail-label', undefined, strings.labels.start),
        el('div', 'detail-value', undefined, new Date(turn.startedAt).toLocaleTimeString('pt-BR')),
      ]),
      el('div', 'detail-item', [
        el('div', 'detail-label', undefined, strings.labels.tokens),
        el('div', 'detail-value', undefined, formatTokens(tokens)),
      ]),
    ]);
    card.append(detail);
  }

  return card;
};

const turns = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = turnRows(snapshot);
  const content =
    rows.length === 0
      ? empty(strings.empty.noTurns)
      : el('div', undefined, rows.map((row) => turnCard(row, snapshot, props)));
  return section(1, strings.sections.turns, content, rows.length);
};

const patchLines = (patch: string): HTMLElement => {
  const wrap = el('div', 'patch');
  for (const line of patch.split('\n')) {
    const kind =
      line === '…'
        ? 'meta'
        : line.startsWith('diff --git') || line.startsWith('index ') || line.startsWith('--- ') || line.startsWith('+++ ')
          ? 'meta'
          : line.startsWith('@@')
            ? 'hunk'
            : line.startsWith('+')
              ? 'add'
              : line.startsWith('-')
                ? 'del'
                : 'context';
    wrap.append(el('div', `patch-line ${kind}`, undefined, line.length > 0 ? line : ' '));
  }
  return wrap;
};

const diffCard = (row: DiffRow, props: PanelProps): HTMLElement => {
  const open = props.expandedDiffs.has(row.fullPath);
  const card = el('div', 'diff-card');
  const head = el('button', 'diff-head');
  head.type = 'button';
  head.setAttribute('aria-expanded', String(open));

  const status = el('span', `diff-badge ${row.tone}`, undefined, row.status);
  const counts = el('span', 'diff-counts', [
    el('span', 'add', undefined, `+${row.additions}`),
    el('span', 'del', undefined, `−${row.deletions}`),
  ]);
  head.append(
    el('span', 'diff-path', undefined, row.path),
    status,
    counts,
    chevron(open),
  );
  head.addEventListener('click', () => props.onToggleDiff(row.fullPath));
  card.append(head);

  if (open) {
    card.append(patchLines(row.patch));
    if (row.truncated) card.append(el('div', 'truncated', undefined, strings.labels.patchTruncated));
  }
  return card;
};

const diffs = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = diffRows(snapshot);
  const content =
    rows.length === 0
      ? empty(strings.empty.noDiff)
      : el('div', undefined, rows.map((row) => diffCard(row, props)));
  return section(1, strings.sections.diffs, content, rows.length);
};

const errorBanner = (props: PanelProps): HTMLElement | null => {
  if (!props.error) return null;
  const copy = errorText(props.error.code);
  const body = props.snapshot
    ? `${copy.body} Os números abaixo podem estar desatualizados.`
    : copy.body;
  return el('div', 'banner error', [
    el('div', 'banner-title', undefined, copy.title),
    el('div', 'banner-body', undefined, body),
  ]);
};

export const renderPanel = (root: HTMLElement, props: PanelProps): void => {
  root.replaceChildren();
  root.append(header(props));

  if (!props.hasSession) {
    root.append(empty(strings.empty.noSession, strings.empty.noSessionHint));
    return;
  }

  root.append(tabs(props));
  const banner = errorBanner(props);
  if (banner) root.append(banner);

  if (!props.snapshot) {
    root.append(empty(props.error ? 'Sem dados' : 'Lendo sessão…'));
    return;
  }

  if (props.tab === 'overview') root.append(overview(props.snapshot));
  else if (props.tab === 'agents') root.append(agents(props.snapshot, props));
  else if (props.tab === 'turns') root.append(turns(props.snapshot, props));
  else root.append(diffs(props.snapshot, props));
};
