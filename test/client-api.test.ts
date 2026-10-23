// The browser-side fetch helper every AI page goes through. What matters to a
// person using the app: a working backend answers, a server error turns into
// something the page can act on (ApiError with the server's code), a dead
// network does not hang or crash, and an unconfigured backend is reported as
// a definite "no" so the page shows its "not configured" banner.
import { afterEach, describe, it, expect, vi } from 'vitest';
import { ApiError, getConfigured, postJson } from '../src/lib/api';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('postJson', () => {
  it('POSTs JSON and returns the parsed body on success', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { content: [], stop_reason: 'end_turn' }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await postJson<{ stop_reason: string }>('/api/assistant', { messages: [] });

    expect(result.stop_reason).toBe('end_turn');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/assistant');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(JSON.parse(init.body as string)).toEqual({ messages: [] });
  });

  it('turns a {error:{code,message}} body into a typed ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn(async () =>
      jsonResponse(503, { error: { code: 'not_configured', message: 'No API key on the server.' } }),
    ));

    const err = await postJson('/api/assistant', { messages: [] }).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) throw err;
    expect(err.name).toBe('ApiError');
    expect(err.status).toBe(503);
    expect(err.code).toBe('not_configured');
    expect(err.message).toBe('No API key on the server.');
  });

  it('still throws an ApiError when the error body is not JSON (e.g. a host 404)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>Not found</html>', { status: 404 })));

    const err = await postJson('/api/scan', {}).catch((e: unknown) => e);

    expect(err).toBeInstanceOf(ApiError);
    if (!(err instanceof ApiError)) throw err;
    expect(err.status).toBe(404);
    expect(err.code).toBe('unknown_error');
    expect(err.message).toBe('Request failed with status 404');
  });

  it('rejects (does not hang) when the network fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));

    await expect(postJson('/api/assistant', {})).rejects.toThrow('Failed to fetch');
  });
});

describe('getConfigured', () => {
  it('returns false when the endpoint reports it is not configured', async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, { configured: false }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getConfigured('/api/assistant')).resolves.toBe(false);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('GET');
  });

  it('returns true when the endpoint reports it is configured', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { configured: true })));
    await expect(getConfigured('/api/scan')).resolves.toBe(true);
  });

  it('returns null (unknown) when the route is missing, e.g. plain `npm run dev`', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Not found', { status: 404 })));
    await expect(getConfigured('/api/assistant')).resolves.toBeNull();
  });

  it('returns null when the network fails instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(getConfigured('/api/assistant')).resolves.toBeNull();
  });

  it('returns null when the body has no boolean `configured`', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(200, { configured: 'yes' })));
    await expect(getConfigured('/api/assistant')).resolves.toBeNull();
  });
});
