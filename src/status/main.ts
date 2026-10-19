import { connectHost } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

import { strings } from '../shared/strings.ts';
import type { LensStrip } from '../shared/types.ts';
import { stripModel } from '../shared/view.ts';
import { failureOf, requestStrip, type Failure } from '../panel/client.ts';
import { STATUS_STYLE } from '../panel/styles.ts';

const host = connectHost();
const root = document.querySelector<HTMLElement>('#root');
if (!root) throw new Error('Lens: missing #root');

const style = document.createElement('style');
style.textContent = STATUS_STYLE;
document.head.append(style);

root.classList.add('open-panel');
root.title = 'Abrir o painel Lens';
root.addEventListener('click', () => {
  void host.openSurface('plugin:lens').catch(() => undefined);
});

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

const statusTone = (status: string): 'normal' | 'warning' | 'danger' | 'muted' =>
  status === 'running' ? 'normal' : status === 'failed' ? 'danger' : 'muted';

const pill = (label: string, value: string, tone = 'muted', title?: string): HTMLElement => {
  const node = el('span', 'strip-pill');
  node.append(el('span', 'label', label), el('span', `value ${tone}`, value));
  if (title) node.title = title;
  return node;
};

const paint = (): void => {
  root.replaceChildren();

  if (!sessionId) {
    root.append(el('div', 'strip-empty', strings.empty.noSession));
    return;
  }

  if (!strip) {
    root.append(el('div', 'strip-empty', error ? 'Sem dados do serviço.' : 'Lendo sessão…'));
    if (error) root.append(el('div', 'strip-error', error.message));
    return;
  }

  const model = stripModel(strip);
  const head = el('div', 'strip-head');
  const title = el('span', 'strip-session', strip.title);
  const state = el('span', 'strip-status');
  state.append(el('span', `status-dot ${statusTone(strip.status)}`), el('span', undefined, model.status));
  head.append(title, state);

  const pills = el('div', 'strip-pills');
  const modelPill = pill(strings.labels.model, model.model);
  modelPill.classList.add('strip-model');
  pills.append(
    pill(strings.labels.context, model.context, model.tone, model.contextHint),
    pill(strings.labels.cost, model.cost),
    pill('agentes', model.running),
    pill('arquivos', model.files),
    modelPill,
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
