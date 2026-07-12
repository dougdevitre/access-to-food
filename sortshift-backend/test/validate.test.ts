import { describe, it, expect } from "vitest";
import {
  sanitizeInitials, validEventCode, elapsedOk, plausibleScore,
  generateEventCode, MIN_ELAPSED_MS, MAX_ELAPSED_MS, MAX_MEALS_PER_SHIFT,
} from "../src/lib/validate.js";

describe("sanitizeInitials", () => {
  it("uppercases and trims to 3 letters", () => {
    expect(sanitizeInitials("dld")).toBe("DLD");
    expect(sanitizeInitials("d.l.d.")).toBe("DLD");
    expect(sanitizeInitials("douglas")).toBe("DOU");
  });
  it("rejects empty and non-letters", () => {
    expect(sanitizeInitials("")).toBeNull();
    expect(sanitizeInitials("123")).toBeNull();
    expect(sanitizeInitials("   ")).toBeNull();
  });
  it("rejects blocklisted initials", () => {
    expect(sanitizeInitials("KKK")).toBeNull();
    expect(sanitizeInitials("kkk")).toBeNull();
  });
});

describe("validEventCode", () => {
  it("accepts 3-8 uppercase alphanumerics", () => {
    expect(validEventCode("ACME7")).toBe(true);
    expect(validEventCode("AB1")).toBe(true);
    expect(validEventCode("ABCD1234")).toBe(true);
  });
  it("rejects bad codes", () => {
    expect(validEventCode("ab")).toBe(false);
    expect(validEventCode("TOOLONGCODE")).toBe(false);
    expect(validEventCode("BAD CODE")).toBe(false);
    expect(validEventCode("")).toBe(false);
  });
});

describe("elapsedOk", () => {
  const now = 1_752_000_000_000;
  it("accepts a real shift window", () => {
    expect(elapsedOk(now - MIN_ELAPSED_MS, now)).toBe(true);
    expect(elapsedOk(now - 61_000, now)).toBe(true);
    expect(elapsedOk(now - MAX_ELAPSED_MS, now)).toBe(true);
  });
  it("rejects too-fast and too-stale submissions", () => {
    expect(elapsedOk(now - 5_000, now)).toBe(false);        // nobody finished a shift in 5s
    expect(elapsedOk(now - MAX_ELAPSED_MS - 1, now)).toBe(false);
    expect(elapsedOk(now + 60_000, now)).toBe(false);       // future iat
  });
});

describe("plausibleScore", () => {
  it("accepts consistent lbs/meals at ~1.2 lbs per meal", () => {
    expect(plausibleScore(418, 502, 3)).toBe(true);   // 502/1.2 = 418.3
    expect(plausibleScore(0, 0, 0)).toBe(true);
    expect(plausibleScore(100, 120, 0)).toBe(true);
  });
  it("rejects inconsistent lbs/meals pairs", () => {
    expect(plausibleScore(500, 120, 0)).toBe(false);
    expect(plausibleScore(10, 500, 0)).toBe(false);
  });
  it("rejects values over ceilings or non-integers", () => {
    expect(plausibleScore(MAX_MEALS_PER_SHIFT + 1, (MAX_MEALS_PER_SHIFT + 1) * 1.2, 0)).toBe(false);
    expect(plausibleScore(-5, -6, 0)).toBe(false);
    expect(plausibleScore(10.5 as unknown as number, 13, 0)).toBe(false);
    expect(plausibleScore(100, 120, 61)).toBe(false);
  });
});

describe("generateEventCode", () => {
  it("produces 5-char codes from the safe alphabet", () => {
    for (let i = 0; i < 50; i++) {
      const c = generateEventCode();
      expect(c).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}$/);
      expect(validEventCode(c)).toBe(true);
    }
  });
});
