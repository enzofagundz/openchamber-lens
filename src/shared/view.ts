import {
  formatAge,
  formatDuration,
  formatPercent,
  formatTokens,
  formatUsd,
  shortPath,
  truncate,
} from './format.ts';
import { strings } from './strings.ts';
import type { LensSnapshot, LensStrip, LensTurn } from './types.ts';

export type Tone = 'normal' | 'warning' | 'danger' | 'muted';

export type Metric = {
  label: string;
  value: string;
  hint?: string;
  tone: Tone;
};

export type TabCounts = {
  agents: number;
  turns: number;
  diffs: number;
};

export type TurnMeta = {
  key: string;
  text: string;
  tone: Tone;
};

export type OverviewModel = {
  title: string;
  subtitle: string;
  status: string;
  contextPercent: number | null;
  metrics: Metric[];
  tokens: Metric[];
  lastTurn: TurnRow | null;
  recentFiles: Array<{ path: string; action: string; age: string }>;
};

export type AgentRow = {
  id: string;
  title: string;
  parentTitle: string | null;
  depth: number;
  isMain: boolean;
  model: string;
  status: string;
  tone: Tone;
  cost: string;
  tokens: string;
  tools: string;
  canOpen: boolean;
};

export type TurnRow = {
  index: number;
  request: string;
  duration: string;
  cost: string;
  tools: string;
  failures: string;
  running: boolean;
  agents: number;
  meta: TurnMeta[];
  tone: Tone;
};

export type DiffRow = {
  path: string;
  fullPath: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
  truncated: boolean;
  tone: Tone;
};

export type StripModel = {
  context: string;
  contextHint: string;
  cost: string;
  running: string;
  model: string;
  files: string;
  status: string;
  tone: Tone;
};

const statusTone = (status: string): Tone => {
  if (status === 'running') return 'normal';
  if (status === 'failed') return 'danger';
  if (status === 'completed') return 'muted';
  return 'muted';
};

const statusText = (status: string): string =>
  strings.status[status as keyof typeof strings.status] ?? strings.labels.unknown;

const contextTone = (percent: number | null): Tone => {
  if (percent === null) return 'muted';
  if (percent >= 90) return 'danger';
  if (percent >= 70) return 'warning';
  return 'normal';
};

const turnRow = (turn: LensTurn): TurnRow => {
  const meta: TurnMeta[] = [
    { key: 'duration', text: formatDuration(turn.durationMs), tone: 'muted' },
    { key: 'cost', text: formatUsd(turn.cost), tone: 'muted' },
    {
      key: 'tools',
      text: `${turn.toolCalls} ${turn.toolCalls === 1 ? 'ferramenta' : 'ferramentas'}`,
      tone: 'muted',
    },
    {
      key: 'failures',
      text: turn.failures > 0 ? `${turn.failures} ${turn.failures === 1 ? 'falha' : 'falhas'}` : 'sem falhas',
      tone: turn.failures > 0 ? 'warning' : 'muted',
    },
  ];

  if (turn.agents.length > 0) {
    meta.push({
      key: 'agents',
      text: `${turn.agents.length} ${turn.agents.length === 1 ? 'agente' : 'agentes'}`,
      tone: 'muted',
    });
  }

  return {
    index: turn.index,
    request: truncate(turn.request || `Turno ${turn.index}`, 120),
    duration: formatDuration(turn.durationMs),
    cost: formatUsd(turn.cost),
    tools: `${turn.toolCalls} ${turn.toolCalls === 1 ? 'ferramenta' : 'ferramentas'}`,
    failures: turn.failures > 0 ? `${turn.failures} ${turn.failures === 1 ? 'falha' : 'falhas'}` : 'sem falhas',
    running: turn.running,
    agents: turn.agents.length,
    meta,
    tone: turn.failures > 0 ? 'warning' : turn.running ? 'normal' : 'muted',
  };
};

export const tabCounts = (snapshot: LensSnapshot): TabCounts => ({
  agents: snapshot.agents.filter((agent) => !agent.isMain).length,
  turns: snapshot.turns.length,
  diffs: snapshot.diff.length,
});

export const overviewModel = (snapshot: LensSnapshot): OverviewModel => {
  const { session, counts, recentFiles } = snapshot;
  const now = snapshot.at;
  const contextHint =
    session.context.used === null
      ? 'sem leitura'
      : `${formatTokens(session.context.used)} de ${formatTokens(session.context.limit)}`;

  return {
    title: session.title,
    subtitle: `${session.agent} · ${session.model.name}${session.model.variant ? ` · ${session.model.variant}` : ''}`,
    status: statusText(session.status),
    contextPercent: session.context.percent,
    metrics: [
      {
        label: strings.labels.context,
        value: formatPercent(session.context.percent),
        hint: contextHint,
        tone: contextTone(session.context.percent),
      },
      { label: strings.labels.cost, value: formatUsd(session.cost), hint: `${counts.userTurns} turnos`, tone: 'normal' },
      {
        label: strings.labels.tools,
        value: String(counts.toolCalls),
        hint: counts.toolFailures > 0 ? `${counts.toolFailures} falhas` : 'sem falhas',
        tone: counts.toolFailures > 0 ? 'warning' : 'muted',
      },
      {
        label: strings.labels.files,
        value: String(counts.filesChanged),
        hint: counts.assistantMessages + ' respostas',
        tone: 'muted',
      },
      {
        label: strings.labels.model,
        value: session.model.name,
        hint: session.model.variant ?? undefined,
        tone: 'muted',
      },
      {
        label: strings.labels.duration,
        value: formatAge(now, session.createdAt),
        hint: `atualizada ${formatAge(now, session.updatedAt)}`,
        tone: 'muted',
      },
    ],
    tokens: [
      { label: strings.labels.input, value: formatTokens(session.tokens.input), tone: 'muted' },
      { label: strings.labels.output, value: formatTokens(session.tokens.output), tone: 'muted' },
      { label: strings.labels.reasoning, value: formatTokens(session.tokens.reasoning), tone: 'muted' },
      { label: strings.labels.cacheRead, value: formatTokens(session.tokens.cacheRead), tone: 'muted' },
      { label: strings.labels.cacheWrite, value: formatTokens(session.tokens.cacheWrite), tone: 'muted' },
    ],
    lastTurn: snapshot.turns.length > 0 ? turnRow(snapshot.turns[snapshot.turns.length - 1]!) : null,
    recentFiles: recentFiles.map((file) => ({
      path: shortPath(file.path, 46),
      action: file.action === 'edit' ? 'editado' : 'lido',
      age: formatAge(now, file.at),
    })),
  };
};

export const agentRows = (snapshot: LensSnapshot): AgentRow[] =>
  snapshot.agents.map((agent) => {
    const parent = agent.parentId
      ? snapshot.agents.find((candidate) => candidate.id === agent.parentId)
      : null;
    return {
      id: agent.id,
      title: agent.title,
      parentTitle: parent?.title ?? null,
      depth: agent.depth,
      isMain: agent.isMain,
      model: agent.model,
      status: statusText(agent.status),
      tone: statusTone(agent.status),
      cost: formatUsd(agent.cost),
      tokens: formatTokens(
        agent.tokens.input + agent.tokens.output + agent.tokens.reasoning + agent.tokens.cacheRead,
      ),
      tools: `${agent.toolCalls}`,
      canOpen: !agent.isMain,
    };
  });

export const turnRows = (snapshot: LensSnapshot): TurnRow[] => snapshot.turns.map(turnRow);

export const diffRows = (snapshot: LensSnapshot): DiffRow[] =>
  snapshot.diff.map((file) => ({
    path: shortPath(file.path, 52),
    fullPath: file.path,
    status:
      file.status === 'added'
        ? 'novo'
        : file.status === 'deleted'
          ? 'apagado'
          : file.status === 'modified'
            ? 'alterado'
            : '—',
    additions: file.additions,
    deletions: file.deletions,
    patch: file.patch,
    truncated: file.truncated,
    tone: file.status === 'deleted' ? 'danger' : file.status === 'added' ? 'normal' : 'muted',
  }));

export const stripModel = (strip: LensStrip): StripModel => ({
  context: formatPercent(strip.contextPercent),
  contextHint: `${formatTokens(strip.contextUsed)} de ${formatTokens(strip.contextLimit)}`,
  cost: formatUsd(strip.cost),
  running:
    strip.runningAgents === 0
      ? 'sem agentes'
      : `${strip.runningAgents} ${strip.runningAgents === 1 ? 'agente' : 'agentes'}`,
  model: strip.model,
  files: `${strip.changedFiles} ${strip.changedFiles === 1 ? 'arquivo' : 'arquivos'}`,
  status: statusText(strip.status),
  tone: contextTone(strip.contextPercent),
});
