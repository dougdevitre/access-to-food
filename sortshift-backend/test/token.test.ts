import { describe, it, expect } from "vitest";
import { issueShiftToken, verifyShiftToken } from "../src/lib/token.js";

const KEY = "test-key-32-chars-minimum-entropy!!";

describe("shift tokens", () => {
  it("round-trips a solo token", () => {
    const t = issueShiftToken(KEY, "solo");
    const p = verifyShiftToken(KEY, t);
    expect(p).not.toBeNull();
    expect(p!.mode).toBe("solo");
    expect(p!.eventCode).toBeUndefined();
    expect(typeof p!.jti).toBe("string");
  });

  it("round-trips a team token with event code", () => {
    const t = issueShiftToken(KEY, "team", "ACME7");
    const p = verifyShiftToken(KEY, t);
    expect(p!.mode).toBe("team");
    expect(p!.eventCode).toBe("ACME7");
  });

  it("rejects a tampered payload", () => {
    const t = issueShiftToken(KEY, "solo");
    const [body, sig] = t.split(".");
    const evil = JSON.parse(Buffer.from(body!, "base64url").toString());
    evil.iat = evil.iat - 120_000; // pretend the shift started earlier
    const forged = Buffer.from(JSON.stringify(evil)).toString("base64url") + "." + sig;
    expect(verifyShiftToken(KEY, forged)).toBeNull();
  });

  it("rejects a token signed with a different key", () => {
    const t = issueShiftToken("some-other-key", "solo");
    expect(verifyShiftToken(KEY, t)).toBeNull();
  });

  it("rejects garbage", () => {
    expect(verifyShiftToken(KEY, "not-a-token")).toBeNull();
    expect(verifyShiftToken(KEY, "")).toBeNull();
    expect(verifyShiftToken(KEY, "a.b")).toBeNull();
  });

  it("issues unique jtis", () => {
    const a = verifyShiftToken(KEY, issueShiftToken(KEY, "solo"))!;
    const b = verifyShiftToken(KEY, issueShiftToken(KEY, "solo"))!;
    expect(a.jti).not.toBe(b.jti);
  });
});
