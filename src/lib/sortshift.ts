// Client for the Sort the Shift backend (sortshift-backend/ — API Gateway +
// Lambda). The backend is deployed separately with CDK; point the SPA at it
// via VITE_SORTSHIFT_API_URL. When unset, the game runs in practice mode
// (no leaderboard, no score submission).

const API_BASE = (import.meta.env.VITE_SORTSHIFT_API_URL as string | undefined)?.replace(/\/+$/, '');

export const sortshiftEnabled = !!API_BASE;

export type Mode = 'solo' | 'team';

export interface LeaderboardRow {
  initials: string;
  meals: number;
  flagged: number;
  ts: string;
  eventCode: string | null;
}

export interface Miss {
  actual: string;
  chosen: string;
  n: number;
}

export class SortShiftError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'SortShiftError';
    this.code = code;
  }
}

const FRIENDLY: Record<string, string> = {
  invalid_event_code: 'That team code is not valid (3-8 letters/numbers).',
  bad_token: 'This shift is no longer valid. Start a new shift and try again.',
  implausible_duration: 'Scores can only be posted for full shifts (about a minute of play) and within 15 minutes of starting.',
  invalid_initials: 'Initials must be 1-3 letters. Keep it clean!',
  implausible_score: 'That score could not be verified. Start a new shift and try again.',
  already_posted: 'This shift was already posted to the leaderboard.',
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE) throw new SortShiftError('not_configured', 'The SortShift backend is not configured.');
  const res = await fetch(`${API_BASE}${path}`, init);
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // fall through with null data
  }
  if (!res.ok) {
    const code = data?.error ?? 'unknown_error';
    throw new SortShiftError(code, FRIENDLY[code] ?? `Request failed (${res.status}).`);
  }
  return data as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function startShift(mode: Mode, eventCode?: string): Promise<{ token: string }> {
  return post('/v1/shifts/start', mode === 'team' ? { mode, eventCode } : { mode });
}

export function submitScore(input: {
  token: string;
  initials: string;
  meals: number;
  lbs: number;
  flagged: number;
}): Promise<{ ok: boolean; id: string }> {
  return post('/v1/scores', input);
}

// Best-effort training telemetry — failures here shouldn't block the score.
export async function submitMisses(token: string, misses: Miss[]): Promise<void> {
  if (misses.length === 0) return;
  try {
    await post('/v1/misses', { token, misses: misses.slice(0, 20) });
  } catch (err) {
    console.error('miss batch failed', err);
  }
}

export function fetchLeaderboard(eventCode?: string): Promise<{ scope: string; rows: LeaderboardRow[] }> {
  return request(eventCode ? `/v1/events/${eventCode}/leaderboard?limit=10` : '/v1/leaderboard/global?limit=10');
}
