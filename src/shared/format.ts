export const formatTokens = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 100_000 ? 0 : 1).replace('.', ',')}k`;
  return String(Math.round(value));
};

export const formatUsd = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const digits = value > 0 && value < 0.01 ? 5 : value < 1 ? 4 : 2;
  return `US$ ${value.toFixed(digits).replace('.', ',')}`;
};

export const formatBrl = (usd: number | null | undefined, rate: number): string => {
  if (usd === null || usd === undefined || !Number.isFinite(usd) || !Number.isFinite(rate) || rate <= 0) {
    return '—';
  }
  return `R$ ${(usd * rate).toFixed(2).replace('.', ',')}`;
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(value % 1 === 0 ? 0 : 1).replace('.', ',')}%`;
};

export const formatDuration = (ms: number | null | undefined): string => {
  if (ms === null || ms === undefined || !Number.isFinite(ms) || ms < 0) return '—';
  const total = Math.round(ms / 1000);
  if (total < 60) return `${total}s`;
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, '0')}m`;
};

export const formatAge = (now: number, at: number | null | undefined): string => {
  if (at === null || at === undefined || !Number.isFinite(at)) return '—';
  const delta = Math.max(0, now - at);
  if (delta < 5_000) return 'agora';
  if (delta < 60_000) return `há ${Math.round(delta / 1000)}s`;
  if (delta < 3_600_000) return `há ${Math.round(delta / 60_000)}m`;
  if (delta < 86_400_000) return `há ${Math.round(delta / 3_600_000)}h`;
  return `há ${Math.round(delta / 86_400_000)}d`;
};

export const formatClock = (at: number | null | undefined): string => {
  if (at === null || at === undefined || !Number.isFinite(at)) return '—';
  const date = new Date(at);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

export const shortPath = (path: string, max = 44): string => {
  if (path.length <= max) return path;
  const parts = path.split('/');
  let result = parts.at(-1) ?? path;
  for (let index = parts.length - 2; index >= 0; index -= 1) {
    const next = `${parts[index]}/${result}`;
    if (next.length > max) break;
    result = next;
  }
  return `…/${result}`;
};

export const truncate = (value: string, max: number): string => {
  const clean = value.trim();
  return clean.length > max ? `${clean.slice(0, max)}…` : clean;
};
