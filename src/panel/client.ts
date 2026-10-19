import { HostRequestError, type HostClient } from '@openchamber/sdk';

import type { LensDiffFile, LensError, LensGitDiff, SnapshotResponse, StripResponse } from '../shared/types.ts';

export type Failure = LensError;

export const failureOf = (error: unknown): Failure => {
  if (error instanceof HostRequestError) {
    switch (error.code) {
      case 'NO_SERVICE':
      case 'NOT_GRANTED':
        return { code: 'needs-approval', message: error.message };
      case 'DISABLED':
        return { code: 'paused', message: error.message };
      case 'SERVICE_FAILED':
        return { code: 'service-failed', message: error.message };
      case 'HOST_UNAVAILABLE':
      case 'HOST_TIMEOUT':
      case 'DISCONNECTED':
        return { code: 'unreachable', message: error.message };
      default:
        return { code: 'unreachable', message: error.message };
    }
  }
  return { code: 'unreachable', message: error instanceof Error ? error.message : 'Falha inesperada.' };
};

const parse = <T>(body: string): { data: T | null; error: Failure | null } => {
  try {
    const parsed = JSON.parse(body) as { data?: T | null; error?: Failure | null };
    if (parsed.error) return { data: null, error: parsed.error };
    if (parsed.data === null || parsed.data === undefined) {
      return { data: null, error: { code: 'bad-answer', message: 'Resposta sem dados.' } };
    }
    return { data: parsed.data, error: null };
  } catch {
    return { data: null, error: { code: 'bad-answer', message: 'Resposta não é JSON.' } };
  }
};

export const requestSnapshot = async (
  host: HostClient,
  sessionId: string,
): Promise<{ data: SnapshotResponse['data']; error: Failure | null }> => {
  try {
    const result = await host.serviceRequest({
      method: 'GET',
      path: '/snapshot',
      query: { sessionId },
    });
    return parse(result.body);
  } catch (error) {
    return { data: null, error: failureOf(error) };
  }
};

export const requestStrip = async (
  host: HostClient,
  sessionId: string,
): Promise<{ data: StripResponse['data']; error: Failure | null }> => {
  try {
    const result = await host.serviceRequest({
      method: 'GET',
      path: '/strip',
      query: { sessionId },
    });
    return parse(result.body);
  } catch (error) {
    return { data: null, error: failureOf(error) };
  }
};

export const requestGitDiff = async (
  host: HostClient,
  sessionId: string,
): Promise<{ data: LensGitDiff | null; error: Failure | null }> => {
  try {
    const result = await host.serviceRequest({
      method: 'GET',
      path: '/git-diff',
      query: { sessionId },
    });
    return parse(result.body);
  } catch (error) {
    return { data: null, error: failureOf(error) };
  }
};

export const requestTurnDiff = async (
  host: HostClient,
  sessionId: string,
  turn: number,
): Promise<{ data: LensDiffFile[] | null; error: Failure | null }> => {
  try {
    const result = await host.serviceRequest({
      method: 'GET',
      path: '/turn-diff',
      query: { sessionId, turn: String(turn) },
    });
    return parse(result.body);
  } catch (error) {
    return { data: null, error: failureOf(error) };
  }
};

export const requestInterrupt = async (
  host: HostClient,
  sessionId: string,
  parentId: string,
): Promise<{ data: { interrupted: boolean } | null; error: Failure | null }> => {
  try {
    const result = await host.serviceRequest({
      method: 'POST',
      path: '/interrupt',
      body: JSON.stringify({ sessionId, parentId }),
    });
    return parse(result.body);
  } catch (error) {
    return { data: null, error: failureOf(error) };
  }
};
