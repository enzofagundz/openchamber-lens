import { readdir, readFile, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export const defaultDataDir = (home = process.env.HOME ?? os.homedir()): string =>
  path.join(home, '.config', 'openchamber');

const readJson = async (file: string): Promise<Record<string, unknown> | null> => {
  try {
    const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
};

const portOf = (value: unknown): number | null => {
  const port = typeof value === 'string' ? Number(value) : value;
  return typeof port === 'number' && Number.isInteger(port) && port > 0 && port <= 65_535 ? port : null;
};

export const loopbackUrl = (value: string | null | undefined): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    const allowed = host === '127.0.0.1' || host === 'localhost' || host === '::1' || host === '[::1]';
    if (!allowed) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
};

export type DiscoveryInput = {
  dataDir: string;
  explicit?: string | null;
};

export const discoverBaseUrl = async ({ dataDir, explicit }: DiscoveryInput): Promise<string | null> => {
  const override = loopbackUrl(explicit ?? process.env.LENS_BASE_URL ?? null);
  if (override) return override;

  const settings = await readJson(path.join(dataDir, 'settings.json'));
  const desktopPort = portOf(settings?.desktopLocalPort);
  if (desktopPort) return `http://127.0.0.1:${desktopPort}`;

  const runDir = path.join(dataDir, 'run');
  let files: string[] = [];
  try {
    files = (await readdir(runDir)).filter(
      (file) => file.startsWith('openchamber-') && file.endsWith('.json'),
    );
  } catch {
    return null;
  }

  const candidates: Array<{ url: string; mtime: number }> = [];
  for (const file of files) {
    const full = path.join(runDir, file);
    const parsed = await readJson(full);
    const port = portOf(parsed?.port);
    if (!port) continue;
    const info = await stat(full).catch(() => null);
    candidates.push({ url: `http://127.0.0.1:${port}`, mtime: info?.mtimeMs ?? 0 });
  }

  candidates.sort((a, b) => b.mtime - a.mtime);
  return candidates[0]?.url ?? null;
};
