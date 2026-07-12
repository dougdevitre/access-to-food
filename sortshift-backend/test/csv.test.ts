import { describe, it, expect } from "vitest";
import { csvEscape, toCsv } from "../src/lib/csv.js";

describe("csv", () => {
  it("passes plain values through", () => {
    expect(csvEscape("DLD")).toBe("DLD");
    expect(csvEscape(418)).toBe("418");
  });
  it("quotes commas, quotes, and newlines", () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
  });
  it("builds a full document", () => {
    const out = toCsv(["initials", "meals"], [["DLD", 418], ["A,B", 12]]);
    expect(out).toBe('initials,meals\nDLD,418\n"A,B",12');
  });
});
