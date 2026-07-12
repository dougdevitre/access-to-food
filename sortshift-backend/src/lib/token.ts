import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import type { Mode, ShiftTokenPayload } from "../types.js";

const b64u = (b: Buffer) => b.toString("base64url");
const fromB64u = (s: string) => Buffer.from(s, "base64url");

function sig(body: string, key: string): Buffer {
  return createHmac("sha256", key).update(body).digest();
}

export function issueShiftToken(key: string, mode: Mode, eventCode?: string, now = Date.now()): string {
  const payload: ShiftTokenPayload = { jti: randomUUID(), iat: now, mode, ...(eventCode ? { eventCode } : {}) };
  const body = b64u(Buffer.from(JSON.stringify(payload)));
  return `${body}.${b64u(sig(body, key))}`;
}

export function verifyShiftToken(key: string, token: string): ShiftTokenPayload | null {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const given = token.slice(dot + 1);
  const expected = sig(body, key);
  const givenBuf = fromB64u(given);
  if (givenBuf.length !== expected.length || !timingSafeEqual(givenBuf, expected)) return null;
  try {
    const p = JSON.parse(fromB64u(body).toString()) as ShiftTokenPayload;
    if (typeof p.jti !== "string" || typeof p.iat !== "number") return null;
    if (p.mode !== "solo" && p.mode !== "team") return null;
    return p;
  } catch {
    return null;
  }
}
