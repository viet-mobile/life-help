import { describe, it, expect } from "vitest";
import { thinkCadence } from "../../lib/think/cadence";

describe("thinking cadence: 1 challenge per 10 regular questions", () => {
  it("earns one per ten answers", () => {
    expect(thinkCadence(0, 0)).toEqual({ earned: 0, owed: 0, toNext: 10 });
    expect(thinkCadence(9, 0)).toEqual({ earned: 0, owed: 0, toNext: 1 });
    expect(thinkCadence(10, 0)).toEqual({ earned: 1, owed: 1, toNext: 10 });
    expect(thinkCadence(35, 1)).toEqual({ earned: 3, owed: 2, toNext: 5 });
  });
  it("never owes a negative number", () => {
    expect(thinkCadence(10, 5).owed).toBe(0);
  });
});
