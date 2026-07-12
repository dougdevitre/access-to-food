// Hermetic tests for the /api serverless handlers' gating and validation.
// The Anthropic key is left unset (or set to a fake value only for cases that
// return *before* any Anthropic call), so nothing here touches the network.
import { describe, it, expect, beforeEach } from 'vitest';
import assistant from '../api/assistant';
import scan from '../api/scan';

interface MockRes {
  statusCode: number;
  body: any;
  status(code: number): MockRes;
  json(payload: unknown): MockRes;
}

function mockRes(): MockRes {
  const res: MockRes = {
    statusCode: 0,
    body: undefined,
    status(code: number) { this.statusCode = code; return this; },
    json(payload: unknown) { this.body = payload; return this; },
  };
  return res;
}

async function call(handler: any, method: string, body?: unknown): Promise<MockRes> {
  const res = mockRes();
  await handler({ method, body } as any, res as any);
  return res;
}

describe('/api/assistant gating', () => {
  beforeEach(() => { delete process.env.ANTHROPIC_API_KEY; });

  it('GET health reports configured=false with no key', async () => {
    const res = await call(assistant, 'GET');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ configured: false });
  });

  it('GET health reports configured=true with a key', async () => {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-fake';
    const res = await call(assistant, 'GET');
    expect(res.body).toEqual({ configured: true });
  });

  it('rejects non-GET/POST methods with 405', async () => {
    const res = await call(assistant, 'DELETE');
    expect(res.statusCode).toBe(405);
    expect(res.body.error.code).toBe('method_not_allowed');
  });

  it('returns 503 not_configured for POST without a key', async () => {
    const res = await call(assistant, 'POST', { messages: [{ role: 'user', content: 'hi' }] });
    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('not_configured');
  });

  describe('with a key set (validation runs before any Anthropic call)', () => {
    beforeEach(() => { process.env.ANTHROPIC_API_KEY = 'sk-ant-fake'; });

    it('400 on empty messages array', async () => {
      const res = await call(assistant, 'POST', { messages: [] });
      expect(res.statusCode).toBe(400);
      expect(res.body.error.code).toBe('invalid_request');
    });

    it('400 on a non-user/assistant role', async () => {
      const res = await call(assistant, 'POST', { messages: [{ role: 'system', content: 'x' }] });
      expect(res.statusCode).toBe(400);
    });

    it('400 on more than 40 messages', async () => {
      const messages = Array.from({ length: 41 }, () => ({ role: 'user', content: 'x' }));
      const res = await call(assistant, 'POST', { messages });
      expect(res.statusCode).toBe(400);
    });

    it('400 on a missing body', async () => {
      const res = await call(assistant, 'POST', undefined);
      expect(res.statusCode).toBe(400);
    });
  });
});

describe('/api/scan gating', () => {
  beforeEach(() => { process.env.ANTHROPIC_API_KEY = 'sk-ant-fake'; });

  it('GET health reports a configured boolean', async () => {
    const res = await call(scan, 'GET');
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.configured).toBe('boolean');
  });

  it('503 not_configured for POST without a key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await call(scan, 'POST', { mimeType: 'image/jpeg', base64Data: 'abc' });
    expect(res.statusCode).toBe(503);
    expect(res.body.error.code).toBe('not_configured');
  });

  it('400 on a disallowed mimeType', async () => {
    const res = await call(scan, 'POST', { mimeType: 'image/tiff', base64Data: 'abc' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe('invalid_request');
  });

  it('400 on missing base64Data', async () => {
    const res = await call(scan, 'POST', { mimeType: 'image/jpeg' });
    expect(res.statusCode).toBe(400);
  });

  it('413 when base64Data exceeds the size cap', async () => {
    const res = await call(scan, 'POST', { mimeType: 'image/jpeg', base64Data: 'a'.repeat(4_000_001) });
    expect(res.statusCode).toBe(413);
    expect(res.body.error.code).toBe('image_too_large');
  });
});
