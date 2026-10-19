import type { FetchLike } from './upstream.ts';

export type UpstreamEvent = {
  type?: string;
  data?: {
    sessionID?: string;
    [key: string]: unknown;
  };
};

export class EventStream {
  private controller: AbortController | null = null;
  private stopped = false;
  private retry = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly onEvent: (event: UpstreamEvent) => void,
    private readonly fetchImpl: FetchLike = fetch,
  ) {}

  start(): void {
    if (this.controller || this.timer) return;
    this.stopped = false;
    void this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.controller?.abort();
    this.controller = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private schedule(): void {
    if (this.stopped) return;
    const delay = Math.min(15_000, 1_000 * 2 ** Math.min(this.retry, 4));
    this.retry += 1;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.connect();
    }, delay);
  }

  private async connect(): Promise<void> {
    if (this.stopped) return;
    const controller = new AbortController();
    this.controller = controller;

    try {
      const response = await this.fetchImpl(new URL('/api/event', this.baseUrl), {
        method: 'GET',
        headers: { accept: 'text/event-stream' },
        signal: controller.signal,
      });
      if (!response.ok || !response.body) throw new Error(`SSE ${response.status}`);

      this.retry = 0;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!this.stopped) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let index = buffer.indexOf('\n');
        while (index >= 0) {
          const line = buffer.slice(0, index).replace(/\r$/, '');
          buffer = buffer.slice(index + 1);
          if (line.startsWith('data:')) {
            const raw = line.slice(5).trim();
            if (raw) {
              try {
                this.onEvent(JSON.parse(raw) as UpstreamEvent);
              } catch {
                // A malformed event is not worth dropping the stream.
              }
            }
          }
          index = buffer.indexOf('\n');
        }
      }
    } catch {
      // Dropped stream: reconnect below.
    } finally {
      this.controller = null;
    }

    this.schedule();
  }
}
