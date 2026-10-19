import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import { strings } from '../shared/strings.ts';
import type { LensStrip } from '../shared/types.ts';
import { stripModel } from '../shared/view.ts';
import { failureOf, requestStrip, type Failure } from '../panel/client.ts';

const host = connectHost();
const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('Lens: missing #root');

const style = document.createElement('style');
style.textContent = `
  #root {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
    height: 100%;
    padding: 8px 10px;
    color: var(--oc-fg, #ddd);
    background: transparent;
    font-family: var(--oc-font, system-ui, sans-serif);
    font-size: 11px;
  }
  #root .strip-head { display: flex; align-items: center; gap: 6px; min-width: 0; }
  #root .strip-title { font-weight: 700; font-size: 11px; letter-spacing: .01em; white-space: nowrap; }
  #root .strip-session { color: var(--oc-muted, #999); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
  #root .strip-status { color: var(--oc-muted, #999); font-size: 10px; white-space: nowrap; }
  #root .strip-pills { display: flex; flex-wrap: wrap; gap: 4px 7px; align-items: baseline; }
  #root .strip-pill { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
  #root .strip-pill .label { color: var(--oc-muted, #999); font-size: 9px; text-transform: uppercase; letter-spacing: .04em; }
  #root .strip-pill .value { font-weight: 650; font-variant-numeric: tabular-nums; }
  #root .strip-pill .value.normal { color: var(--oc-primary-text, #2563eb); }
  #root .strip-pill .value.warning { color: var(--oc-warning-text, #b45309); }
  #root .strip-pill .value.danger { color: var(--oc-error-text, #b91c1c); }
  #root .strip-pill .value.muted { color: var(--oc-fg, inherit); }
  #root .strip-error { color: var(--oc-error-text, #b91c1c); font-size: 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  #root .strip-empty { color: var(--oc-muted, #999); font-size: 10px; }
`;
document.head.append(style);

let sessionId: string | null = null;
let strip: LensStrip | null = null;
let error: Failure | null = null;
let inFlight = false;
let timer: ReturnType<typeof setInterval> | null = null;

const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

const statusText = (status: string): string =>
  strings.status[status as keyof typeof strings.status] ?? strings.labels.unknown;

const pill = (label: string, value: string, tone = 'muted'): HTMLElement => {
  const node = el('span', 'strip-pill');
  node.append(el('span', 'label', label), el('span', `value ${tone}`, value));
  return node;
};

const paint = (): void => {
  root.replaceChildren();
  const head = el('div', 'strip-head');

  if (!sessionId) {
    head.append(el('span', 'strip-empty', strings.empty.noSession));
    root.append(head);
    return;
  }

  if (!strip) {
    head.append(el('span', 'strip-empty', error ? 'sem dados' : 'lendo…'));
    root.append(head);
    if (error) root.append(el('div', 'strip-error', error.message));
    return;
  }

  const model = stripModel(strip);
  head.append(
    el('span', 'strip-session', strip.title),
    el('span', 'strip-status', model.status),
  );

  const pills = el('div', 'strip-pills');
  pills.append(
    pill(strings.labels.context, model.context, model.tone === 'warning' || model.tone === 'danger' ? model.tone : 'muted'),
    pill(strings.labels.cost, model.cost),
    pill('agentes', model.running),
    pill('arquivos', model.files),
    pill(strings.labels.model, model.model),
  );

  root.append(head, pills);
  if (error) root.append(el('div', 'strip-error', error.message));
};

const poll = async (): Promise<void> => {
  if (!sessionId || inFlight) return;
  if (document.hidden || root.getBoundingClientRect().width <= 0) return;

  const wanted = sessionId;
  inFlight = true;
  try {
    const result = await requestStrip(host, wanted);
    if (sessionId !== wanted) return;
    if (result.data) {
      strip = result.data;
      error = null;
    } else {
      error = result.error ?? { code: 'bad-answer', message: 'Sem dados do serviço.' };
    }
    paint();
  } finally {
    inFlight = false;
  }
};

const setSession = (next: string | null): void => {
  if (next === sessionId) {
    paint();
    return;
  }
  sessionId = next;
  strip = null;
  error = null;
  paint();
  void poll();
};

host.onReady((ctx) => {
  applyHostReady(ctx, document.documentElement);
  setSession(ctx.session?.id ?? null);
});

host.onSession((session) => {
  setSession(session?.id ?? null);
});

host.onSessionLifecycle((event) => {
  if (event.sessionId === sessionId) void poll();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) void poll();
});

timer = setInterval(() => {
  void poll();
}, 2_000);

window.addEventListener('pagehide', () => {
  if (timer) clearInterval(timer);
  timer = null;
});

paint();
