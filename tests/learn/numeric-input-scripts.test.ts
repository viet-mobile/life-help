import { describe, expect, it } from "vitest";
import { parseNumeric } from "@/lib/learn/domain/answers";

describe("numeric answers typed on a local keyboard", () => {
  it("accepts digits of every supported script and the decimal comma", () => {
    for (const [input, value] of [
      ["12", 12], ["１２", 12], ["١٢", 12], ["۱۲", 12], ["১২", 12], ["१२", 12], ["੧੨", 12], ["૧૨", 12], ["௧௨", 12], ["౧౨", 12], ["೧೨", 12], ["൧൨", 12], ["๑๒", 12], ["၁၂", 12], ["១២", 12], ["෧෨", 12],
      ["1,5", 1.5], ["١٫٥", 1.5], ["-3,25", -3.25], ["٣/٤", 0.75], ["x=४", 4],
    ] as const) expect(parseNumeric(input), input).toBeCloseTo(value);
  });
  it("still rejects what is not a plain number", () => {
    for (const input of ["", "abc", "1,500", "1,2,3", "3/0", "१२ ए"]) expect(parseNumeric(input), input).toBeNull();
  });
});
