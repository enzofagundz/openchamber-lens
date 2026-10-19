import { appendFile, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { LensHistoryPoint, LensSnapshot } from '../shared/types.ts';

const MAX_POINTS = 2_000;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1_000;
const MIN_INTERVAL_MS = 10_000;

export class HistoryStore {
  private readonly lastWrite = new Map<string, number>();

  constructor(
    private readonly dir: string,
    private readonly now: () => number = Date.now,
  ) {}

  private file(sessionId: string): string {
    return path.join(this.dir, `${sessionId}.jsonl`);
  }

  async record(snapshot: LensSnapshot): Promise<void> {
    const id = snapshot.session.id;
    const current = this.now();
    const previous = this.lastWrite.get(id) ?? 0;
    if (current - previous < MIN_INTERVAL_MS) return;
    this.lastWrite.set(id, current);

    const point: LensHistoryPoint = {
      at: current,
      cost: snapshot.session.cost,
      contextPercent: snapshot.session.context.percent,
      contextUsed: snapshot.session.context.used,
      toolCalls: snapshot.counts.toolCalls,
      failures: snapshot.counts.toolFailures,
      turns: snapshot.counts.userTurns,
      filesChanged: snapshot.counts.filesChanged,
      runningAgents: snapshot.agents.filter((agent) => !agent.isMain && agent.status === 'running').length,
    };

    await mkdir(this.dir, { recursive: true });
    await appendFile(this.file(id), `${JSON.stringify(point)}\n`, 'utf8');
    await this.prune(id);
  }

  async read(sessionId: string, limit = 500): Promise<LensHistoryPoint[]> {
    try {
      const raw = await readFile(this.file(sessionId), 'utf8');
      const points: LensHistoryPoint[] = [];
      for (const line of raw.split('\n')) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as Partial<LensHistoryPoint>;
          if (typeof parsed.at !== 'number' || typeof parsed.cost !== 'number') continue;
          points.push({
            at: parsed.at,
            cost: parsed.cost,
            contextPercent: typeof parsed.contextPercent === 'number' ? parsed.contextPercent : null,
            contextUsed: typeof parsed.contextUsed === 'number' ? parsed.contextUsed : null,
            toolCalls: typeof parsed.toolCalls === 'number' ? parsed.toolCalls : 0,
            failures: typeof parsed.failures === 'number' ? parsed.failures : 0,
            turns: typeof parsed.turns === 'number' ? parsed.turns : 0,
            filesChanged: typeof parsed.filesChanged === 'number' ? parsed.filesChanged : 0,
            runningAgents: typeof parsed.runningAgents === 'number' ? parsed.runningAgents : 0,
          });
        } catch {
          // Ignore a torn line; the next append repairs the file.
        }
      }
      return points.slice(-Math.max(1, Math.min(limit, MAX_POINTS)));
    } catch {
      return [];
    }
  }

  async clear(sessionId: string): Promise<void> {
    await rm(this.file(sessionId), { force: true });
    this.lastWrite.delete(sessionId);
  }

  private async prune(sessionId: string): Promise<void> {
    try {
      const info = await stat(this.file(sessionId));
      if (info.size < 256_000) return;
      const points = await this.read(sessionId, MAX_POINTS);
      const cutoff = this.now() - MAX_AGE_MS;
      const kept = points.filter((point) => point.at >= cutoff).slice(-MAX_POINTS);
      await writeFile(
        this.file(sessionId),
        kept.map((point) => JSON.stringify(point)).join('\n') + (kept.length > 0 ? '\n' : ''),
        'utf8',
      );
    } catch {
      // Retention is housekeeping; a failed prune must not fail a request.
    }
  }
}
