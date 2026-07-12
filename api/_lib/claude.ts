import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export const MODEL = 'claude-sonnet-5';

export function isConfigured(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

export function createClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export function sendError(
  res: VercelResponse,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ error: { code, message } });
}

// Shared method/config gate for both endpoints. Returns false when the
// response has already been written (health check, wrong method, missing key).
export function gateRequest(req: VercelRequest, res: VercelResponse): boolean {
  if (req.method === 'GET') {
    res.status(200).json({ configured: isConfigured() });
    return false;
  }
  if (req.method !== 'POST') {
    sendError(res, 405, 'method_not_allowed', 'Only GET and POST are supported.');
    return false;
  }
  if (!isConfigured()) {
    sendError(
      res,
      503,
      'not_configured',
      'The AI backend is not configured. Set the ANTHROPIC_API_KEY environment variable on the server.',
    );
    return false;
  }
  return true;
}

// Never echo upstream error bodies to the client — they can carry request
// details we don't want to expose.
export function sendUpstreamError(res: VercelResponse, err: unknown): void {
  console.error('Anthropic API error:', err);
  if (err instanceof Anthropic.RateLimitError) {
    sendError(res, 429, 'rate_limited', 'The AI service is receiving too many requests. Please try again in a moment.');
  } else if (err instanceof Anthropic.APIError) {
    sendError(res, 502, 'upstream_error', 'The AI service returned an error. Please try again.');
  } else {
    sendError(res, 502, 'upstream_error', 'Unexpected error while contacting the AI service.');
  }
}
