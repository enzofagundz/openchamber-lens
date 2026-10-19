import { formatPercent, formatTokens } from '../shared/format.ts';
import { strings, errorText } from '../shared/strings.ts';
import type { LensSnapshot } from '../shared/types.ts';
import { agentRows, diffRows, overviewModel, turnRows, type AgentRow, type Metric } from '../shared/view.ts';
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

const toneClass = (tone: Metric['tone']): string => (tone === 'normal' ? 'normal' : tone);

const metricCard = (metric: Metric): HTMLElement =>
  el('div', 'card', [
    el('div', 'card-label', undefined, metric.label),
    el('div', `card-value ${toneClass(metric.tone)}`, undefined, metric.value),
    metric.hint ? el('div', 'card-hint', undefined, metric.hint) : null,
  ]);

const ring = (percent: number | null): SVGSVGElement => {
  const size = 86;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const bounded = Math.max(0, Math.min(100, percent ?? 0));
  const offset = circumference * (1 - bounded / 100);
  const tone = percent === null ? 'var(--oc-muted, #888)' : percent >= 90 ? 'var(--oc-error-text, #b91c1c)' : percent >= 70 ? 'var(--oc-warning-text, #b45309)' : 'var(--oc-primary-text, #2563eb)';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.classList.add('context-ring');

  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', String(size / 2));
  track.setAttribute('cy', String(size / 2));
  track.setAttribute('r', String(radius));
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke', 'var(--oc-border, #ddd)');
  track.setAttribute('stroke-width', String(stroke));
  svg.append(track);

  const value = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  value.setAttribute('cx', String(size / 2));
  value.setAttribute('cy', String(size / 2));
  value.setAttribute('r', String(radius));
  value.setAttribute('fill', 'none');
  value.setAttribute('stroke', tone);
  value.setAttribute('stroke-width', String(stroke));
  value.setAttribute('stroke-linecap', 'round');
  value.setAttribute('stroke-dasharray', String(circumference));
  value.setAttribute('stroke-dashoffset', String(offset));
  value.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
  svg.append(value);

  const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  label.setAttribute('x', String(size / 2));
  label.setAttribute('y', String(size / 2 + 4));
  label.setAttribute('text-anchor', 'middle');
  label.setAttribute('fill', 'currentColor');
  label.setAttribute('font-size', '14');
  label.setAttribute('font-weight', '700');
  label.textContent = formatPercent(percent);
  svg.append(label);

  return svg;
};

const empty = (title: string, body?: string): HTMLElement =>
  el('div', 'empty', [
    el('div', 'empty-title', undefined, title),
    body ? el('div', undefined, undefined, body) : null,
  ]);

const header = (props: PanelProps): HTMLElement => {
  const session = props.snapshot?.session;
  const title = session?.title ?? strings.app;
  const subtitle = session
    ? `${session.agent} · ${session.model.name}${session.model.variant ? ` · ${session.model.variant}` : ''}`
    : props.hasSession
      ? 'Lendo sessão…'
      : strings.empty.noSession;
  const status = session?.status;
  const statusLabel =
    status === 'running'
      ? strings.status.running
      : status === 'completed'
        ? strings.status.completed
        : status === 'failed'
          ? strings.status.failed
          : strings.labels.unknown;

  return el('div', 'lens-header', [
    el('div', 'lens-header-main', [
      el('div', 'lens-title', undefined, title),
      el('div', 'lens-sub', undefined, subtitle),
    ]),
    status
      ? el('span', `badge ${status === 'running' ? 'normal' : status === 'failed' ? 'danger' : ''}`, undefined, statusLabel)
      : null,
  ]);
};

const tabs = (props: PanelProps): HTMLElement => {
  const bar = el('div', 'lens-tabs');
  for (const tab of TABS) {
    const node = el('button', `lens-tab ${props.tab === tab.id ? 'active' : ''}`, undefined, tab.label);
    node.type = 'button';
    node.addEventListener('click', () => props.onTab(tab.id));
    bar.append(node);
  }
  return bar;
};

const errorBanner = (props: PanelProps): HTMLElement | null => {
  if (!props.error) return null;
  const copy = errorText(props.error.code);
  const body = props.snapshot ? `${copy.body} Os números abaixo podem estar desatualizados.` : copy.body;
  return el('div', 'banner error', [
    el('div', 'banner-title', undefined, copy.title),
    el('div', 'banner-body', undefined, body),
  ]);
};

const overview = (snapshot: LensSnapshot): HTMLElement => {
  const model = overviewModel(snapshot);
  const contextCard = el('div', 'card context-card', [
    ring(model.contextPercent),
    el('div', 'context-copy', [
      el('div', 'card-label', undefined, strings.labels.context),
      el('div', 'context-value', undefined, formatPercent(model.contextPercent)),
      el(
        'div',
        'card-hint',
        undefined,
        snapshot.session.context.used === null
          ? 'sem leitura'
          : `${formatTokens(snapshot.session.context.used)} de ${formatTokens(snapshot.session.context.limit)}`,
      ),
    ]),
  ]);

  const tokenChips = el('div', 'chips');
  for (const token of model.tokens) {
    tokenChips.append(el('span', 'chip', [el('strong', undefined, undefined, token.value), ` ${token.label}`]));
  }

  const lastTurn = model.lastTurn
    ? el('div', 'card', [
        el('div', 'row-title', undefined, model.lastTurn.request),
        el('div', 'turn-meta', [
          `#${model.lastTurn.index}`,
          model.lastTurn.duration,
          model.lastTurn.cost,
          model.lastTurn.tools,
          model.lastTurn.failures,
        ]),
      ])
    : empty(strings.empty.noTurns);

  const recent = model.recentFiles.length
    ? el(
        'div',
        undefined,
        model.recentFiles.map((file) =>
          el('div', 'row', [
            el('div', 'row-main', [
              el('div', 'file-line', [
                el('span', 'row-title', undefined, file.path),
                el('span', 'file-action', undefined, file.action),
              ]),
            ]),
            el('span', 'row-figures', undefined, file.age),
          ]),
        ),
      )
    : empty(strings.empty.noRecent);

  return el('div', undefined, [
    contextCard,
    el('div', 'grid three', model.metrics.filter((metric) => metric.label !== strings.labels.context).map(metricCard)),
    el('div', 'section', [
      el('div', 'section-head', [el('span', 'section-title', undefined, strings.labels.tokens)]),
      tokenChips,
    ]),
    el('div', 'section', [
      el('div', 'section-head', [el('span', 'section-title', undefined, strings.labels.lastTurn)]),
      lastTurn,
    ]),
    el('div', 'section', [
      el('div', 'section-head', [el('span', 'section-title', undefined, strings.labels.recentFiles)]),
      recent,
    ]),
  ]);
};

const agentNode = (row: AgentRow, props: PanelProps): HTMLElement => {
  const node = el('div', `row agent-row ${row.canOpen ? 'clickable' : ''}`, [
    el('div', 'agent-main', [
      el('div', 'agent-head', [
        el('span', 'agent-title', undefined, `${row.isMain ? '◉' : '◈'} ${row.title}`),
        el('span', `badge ${toneClass(row.tone)}`, undefined, row.status),
      ]),
      el('div', 'agent-meta', [
        row.model,
        row.cost,
        `${row.tokens} tokens`,
        `${row.tools} ferramentas`,
      ]),
    ]),
  ]);
  node.style.paddingLeft = `${8 + row.depth * 14}px`;
  if (row.canOpen) {
    node.setAttribute('role', 'button');
    node.setAttribute('tabindex', '0');
    node.title = strings.labels.openSession;
    node.addEventListener('click', () => props.onOpenAgent(row.id));
    node.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        props.onOpenAgent(row.id);
      }
    });
  }
  return node;
};

const agents = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = agentRows(snapshot);
  if (rows.length === 0) return empty(strings.empty.noAgents);
  return el(
    'div',
    undefined,
    rows.map((row) => agentNode(row, props)),
  );
};

const turns = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = turnRows(snapshot);
  if (rows.length === 0) return empty(strings.empty.noTurns);

  return el(
    'div',
    undefined,
    rows.map((row) => {
      const turn = snapshot.turns.find((entry) => entry.index === row.index);
      const isOpen = props.expandedTurns.has(row.index);
      const card = el('div', 'row turn-card');
      const head = el('div', 'turn-head', [
        el('span', 'turn-index', undefined, `#${row.index}`),
        el('div', 'row-main', [
          el('div', 'turn-request', undefined, row.request),
          el('div', 'turn-meta', [
            row.duration,
            row.cost,
            row.tools,
            row.failures,
            row.agents > 0 ? `${row.agents} agentes` : null,
            row.running ? strings.labels.runningTurn : null,
          ]),
        ]),
      ]);
      head.addEventListener('click', () => props.onToggleTurn(row.index));
      card.append(head);

      if (isOpen && turn) {
        card.append(
          el('div', 'turn-detail', [
            el('div', 'turn-detail-label', undefined, strings.labels.request),
            el('div', 'turn-detail-text', undefined, turn.request || '—'),
            el('div', 'turn-detail-label', undefined, strings.labels.tools),
            el('div', 'turn-detail-text', undefined, `${turn.toolCalls} ferramentas · ${turn.failures} falhas`),
            turn.agents.length > 0
              ? el('div', 'turn-detail-label', undefined, strings.labels.agentTree)
              : null,
            turn.agents.length > 0
              ? el('div', 'turn-detail-text', undefined, turn.agents.join(', '))
              : null,
          ]),
        );
      }

      return card;
    }),
  );
};

const useLine = (value: string): HTMLElement =>
  el('pre', 'patch', undefined, value.length > 0 ? value : '—');

const diffs = (snapshot: LensSnapshot, props: PanelProps): HTMLElement => {
  const rows = diffRows(snapshot);
  if (rows.length === 0) return empty(strings.empty.noDiff);

  return el(
    'div',
    undefined,
    rows.map((row) => {
      const card = el('div', 'row diff-row');
      const head = el('div', 'diff-head', [
        el('span', `row-title diff-path`, undefined, row.path),
        el('span', 'row-figures', [
          el('span', 'add', undefined, `+${row.additions}`),
          el('span', 'del', undefined, `−${row.deletions}`),
        ]),
        el('span', 'file-action', undefined, row.status),
      ]);
      head.addEventListener('click', () => props.onToggleDiff(row.fullPath));
      card.append(head);
      if (props.expandedDiffs.has(row.fullPath)) {
        card.append(useLine(row.patch));
        if (row.truncated) card.append(el('div', 'truncated', undefined, strings.labels.patchTruncated));
      }
      return card;
    }),
  );
};

export const renderPanel = (root: HTMLElement, props: PanelProps): void => {
  root.replaceChildren();

  if (!props.hasSession) {
    root.append(header(props), empty(strings.empty.noSession, strings.empty.noSessionHint));
    return;
  }

  root.append(header(props), tabs(props));
  const banner = errorBanner(props);
  if (banner) root.append(banner);

  const snapshot = props.snapshot;
  if (!snapshot) {
    root.append(empty(props.error ? 'Sem dados' : 'Lendo sessão…'));
    return;
  }

  if (props.tab === 'overview') root.append(overview(snapshot));
  else if (props.tab === 'agents') root.append(agents(snapshot, props));
  else if (props.tab === 'turns') root.append(turns(snapshot, props));
  else root.append(diffs(snapshot, props));
};
