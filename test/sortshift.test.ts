// Sort the Shift: the browser client must only ever send scores the backend
// will accept, or a player who just finished a 75-second shift sees their
// score bounced. The backend's integrity rules (sortshift-backend/src/lib/
// validate.ts) are imported directly so a change on either side fails here:
//   - a shift must last at least 55 s before a score may be posted
//   - meals = round(lbs / 1.2)
//   - initials are [A-Z]{1,3}
// With no VITE_SORTSHIFT_API_URL the game is in practice mode and must never
// try to post a score.
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { elapsedOk, plausibleScore, sanitizeInitials, MIN_ELAPSED_MS } from '../sortshift-backend/src/lib/validate';

type SortShiftModule = typeof import('../src/lib/sortshift');

async function loadClient(apiUrl: string | undefined): Promise<SortShiftModule> {
  vi.resetModules();
  if (apiUrl === undefined) {
    vi.stubEnv('VITE_SORTSHIFT_API_URL', '');
  } else {
    vi.stubEnv('VITE_SORTSHIFT_API_URL', apiUrl);
  }
  return import('../src/lib/sortshift');
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('practice mode (VITE_SORTSHIFT_API_URL unset)', () => {
  it('reports the game server as disabled', async () => {
    const client = await loadClient(undefined);
    expect(client.sortshiftEnabled).toBe(false);
  });

  it('refuses to post a score client-side and never touches the network', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const client = await loadClient(undefined);

    const err = await client
      .submitScore({ token: 't', initials: 'ABC', meals: 10, lbs: 12, flagged: 1 })
      .catch((e) => e);

    expect(err).toBeInstanceOf(client.SortShiftError);
    expect(err.code).toBe('not_configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to start a shift or load a leaderboard', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const client = await loadClient(undefined);
    await expect(client.startShift('solo')).rejects.toMatchObject({ code: 'not_configured' });
    await expect(client.fetchLeaderboard()).rejects.toMatchObject({ code: 'not_configured' });
  });

  it('the page tells the player they are in practice mode', async () => {
    await loadClient(undefined);
    const { default: SortShift } = await import('../src/pages/SortShift');
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SortShift)));
    expect(html).toContain('practice mode');
    expect(html).toContain('VITE_SORTSHIFT_API_URL');
  });
});

describe('with a game server configured', () => {
  it('strips a trailing slash and posts to /v1/scores', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true, id: 'abc' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const client = await loadClient('https://game.example.test/');
    expect(client.sortshiftEnabled).toBe(true);

    const result = await client.submitScore({ token: 't', initials: 'DD', meals: 10, lbs: 12, flagged: 0 });

    expect(result).toEqual({ ok: true, id: 'abc' });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://game.example.test/v1/scores');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body as string)).toEqual({ token: 't', initials: 'DD', meals: 10, lbs: 12, flagged: 0 });
  });

  it('maps a too-short shift (implausible_duration) to a message a player can act on', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      new Response(JSON.stringify({ error: 'implausible_duration' }), { status: 422 }),
    ));
    const client = await loadClient('https://game.example.test');

    const err = await client
      .submitScore({ token: 't', initials: 'DD', meals: 1, lbs: 1, flagged: 0 })
      .catch((e) => e);

    expect(err).toBeInstanceOf(client.SortShiftError);
    expect(err.code).toBe('implausible_duration');
    expect(err.message).toMatch(/full shifts/);
  });

  it('maps invalid_initials and implausible_score to friendly messages', async () => {
    for (const code of ['invalid_initials', 'implausible_score'] as const) {
      vi.stubGlobal('fetch', vi.fn(async () =>
        new Response(JSON.stringify({ error: code }), { status: 422 }),
      ));
      const client = await loadClient('https://game.example.test');
      const err = await client
        .submitScore({ token: 't', initials: 'DD', meals: 1, lbs: 1, flagged: 0 })
        .catch((e) => e);
      expect(err.code).toBe(code);
      expect(err.message).not.toMatch(/Request failed/);
    }
  });

  it('miss telemetry failures never block the score', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('oops', { status: 500 })));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const client = await loadClient('https://game.example.test');
    await expect(client.submitMisses('t', [{ actual: 'produce', chosen: 'pantry', n: 1 }])).resolves.toBeUndefined();
  });
});

describe('client rules match the backend integrity checks', () => {
  it('the shift the page runs is long enough for the backend to accept a score', async () => {
    await loadClient('https://game.example.test');
    const { default: SortShift } = await import('../src/pages/SortShift');
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(SortShift)));
    const match = html.match(/Your shift lasts (\d+) seconds/);
    expect(match, 'intro copy states the shift length').not.toBeNull();
    const shiftSeconds = Number(match![1]);
    expect(shiftSeconds * 1000).toBeGreaterThanOrEqual(MIN_ELAPSED_MS);
    // A score posted the instant the shift ends is accepted...
    expect(elapsedOk(0, shiftSeconds * 1000)).toBe(true);
    // ...and one posted before the 55 s minimum is not.
    expect(elapsedOk(0, MIN_ELAPSED_MS - 1)).toBe(false);
  });

  it('meals = round(lbs / 1.2) is accepted for every pound total a shift can reach', () => {
    // Items weigh 1-5 lbs each; a 75 s shift with a 6 s item timer cannot
    // plausibly exceed a few hundred pounds. The client computes
    // Math.round(lbs / 1.2) (src/pages/SortShift.tsx, LBS_PER_MEAL).
    for (let lbs = 0; lbs <= 400; lbs++) {
      const meals = Math.round(lbs / 1.2);
      expect(plausibleScore(meals, lbs, 0), `lbs=${lbs}`).toBe(true);
    }
    // A fudged meal count is rejected.
    expect(plausibleScore(Math.round(120 / 1.2) + 2, 120, 0)).toBe(false);
  });

  it('the initials the page lets a player type are the ones the backend accepts', () => {
    // The page's onChange sanitizer (src/pages/SortShift.tsx).
    const pageClean = (raw: string) => raw.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    for (const raw of ['dd', 'Doug', 'a1b2c3', ' jm ', 'ÁBC', 'xyz!']) {
      const clean = pageClean(raw);
      expect(clean).toMatch(/^[A-Z]{1,3}$/);
      expect(sanitizeInitials(clean), raw).toBe(clean);
    }
    // Empty after sanitizing: the page's submit guard rejects it, as does the backend.
    expect(pageClean('123')).toBe('');
    expect(sanitizeInitials('')).toBeNull();
    expect(sanitizeInitials('ABCD')).toBe('ABC');
  });
});
