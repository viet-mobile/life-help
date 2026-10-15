import { describe, expect, it } from "vitest";
import { recoveryToken } from "@/lib/learn/review/recovery";

describe("review recovery fragment", () => {
  const token = "a".repeat(64);
  it("accepts only a well formed recovery hash", () => {
    expect(recoveryToken(`#token_hash=${token}&type=recovery`)).toBe(token);
  });
  it("rejects other email actions and absent or malformed tokens", () => {
    for (const hash of ["", `#token_hash=${token}&type=signup`, "#token_hash=bad&type=recovery", "#type=recovery", `#token_hash=${token}&type=magiclink`]) expect(recoveryToken(hash)).toBeNull();
  });
});
