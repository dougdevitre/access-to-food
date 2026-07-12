// Thin client for the /api serverless functions. All Anthropic calls happen
// server-side — the browser never sees the API key.

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let code = 'unknown_error';
    let message = `Request failed with status ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error?.code) code = data.error.code;
      if (data?.error?.message) message = data.error.message;
    } catch {
      // Non-JSON error body (e.g. a 404 from a host without the functions).
    }
    throw new ApiError(response.status, code, message);
  }

  return response.json() as Promise<T>;
}

// Health check: GET on an API route returns {configured: boolean}. Returns
// null when the backend is unreachable (e.g. plain `npm run dev` without
// `vercel dev`), so callers can distinguish "unknown" from a definite no.
export async function getConfigured(path: string): Promise<boolean | null> {
  try {
    const response = await fetch(path, { method: 'GET' });
    if (!response.ok) return null;
    const data = await response.json();
    return typeof data?.configured === 'boolean' ? data.configured : null;
  } catch {
    return null;
  }
}
