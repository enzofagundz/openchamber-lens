import { describe, expect, test } from 'bun:test';

import { buildSnapshot, buildStrip } from '../src/shared/derive.ts';
import { formatAge, formatDuration, formatPercent, formatTokens, formatUsd } from '../src/shared/format.ts';
import { agentRows, diffRows, overviewModel, stripModel, turnRows } from '../src/shared/view.ts';
import { errorText, strings } from '../src/shared/strings.ts';
import { active, childMessages, childSession, diff, grandchildSession, models, rootMessages, rootSession } from './fixtures.ts';

const snapshot = buildSnapshot({
  session: rootSession,
  sessions: [rootSession, childSession, grandchildSession],
  messagesBySession: { ses_root: rootMessages, ses_child: childMessages, ses_grand: [] },
  diff,
  models,
  active,
  now: 3_000,
});

describe('formatters', () => {
  test('formats tokens', () => {
    expect(formatTokens(999)).toBe('999');
    expect(formatTokens(1_500)).toBe('1,5k');
    expect(formatTokens(2_000_000)).toBe('2,0M');
    expect(formatTokens(null)).toBe('—');
  });

  test('formats money and percentage in pt-BR', () => {
    expect(formatUsd(0.1234)).toBe('US$ 0,1234');
    expect(formatUsd(2.5)).toBe('US$ 2,50');
    expect(formatPercent(53)).toBe('53%');
    expect(formatPercent(null)).toBe('—');
  });

  test('formats duration and age', () => {
    expect(formatDuration(12_000)).toBe('12s');
    expect(formatDuration(65_000)).toBe('1m 05s');
    expect(formatAge(3_000, 1_000)).toBe('agora');
    expect(formatAge(70_000, 1_000)).toBe('há 1m');
  });
});

describe('view models', () => {
  test('overview exposes context, cost, tokens and last turn', () => {
    const model = overviewModel(snapshot);
    expect(model.title).toBe('Sessão de teste');
    expect(model.contextPercent).toBe(53);
    expect(model.metrics[0]?.value).toBe('53%');
    expect(model.tokens.find((token) => token.label === strings.labels.cacheRead)?.value).toBe('500');
    expect(model.lastTurn?.index).toBe(2);
    expect(model.recentFiles[0]?.action).toBe('editado');
  });

  test('agent rows keep depth and openability', () => {
    const rows = agentRows(snapshot);
    expect(rows.map((row) => [row.title, row.depth, row.canOpen])).toEqual([
      ['Sessão de teste', 0, false],
      ['Investigar', 1, true],
      ['Detalhe', 2, true],
    ]);
    expect(rows[1]?.status).toBe('rodando');
  });

  test('turn rows mark running and failures', () => {
    const rows = turnRows(snapshot);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.failures).toBe('1 falha');
    expect(rows[1]?.running).toBe(true);
    expect(rows[1]?.agents).toBe(2);
  });

  test('diff rows translate status and keep counts', () => {
    const rows = diffRows(snapshot);
    expect(rows.map((row) => row.status)).toEqual(['alterado', 'novo', 'apagado']);
    expect(rows[0]?.additions).toBe(2);
    expect(rows[0]?.deletions).toBe(1);
  });

  test('strip is compact', () => {
    const model = stripModel(buildStrip(snapshot));
    expect(model.context).toBe('53%');
    expect(model.running).toBe('1 agente');
    expect(model.files).toBe('3 arquivos');
    expect(model.model).toBe('DeepSeek V4');
  });
});

describe('error copy', () => {
  test('known codes have pt-BR copy', () => {
    expect(errorText('no-server').title).toContain('Servidor');
    expect(errorText('auth-required').body).toContain('senha');
  });

  test('unknown codes fall back safely', () => {
    expect(errorText('wat').title).toBe('Falha no Lens');
  });
});
