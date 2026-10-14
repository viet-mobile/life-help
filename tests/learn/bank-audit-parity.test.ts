import { it, expect } from "vitest";
import { expandBank, BANKS } from "@/lib/learn/content/bank";
import { readContent } from "../../scripts/curriculum/audit-moe-2022.mjs";
import path from "node:path";
it("audit bank expansion equals all 6672 runtime questions including templates, answers and IDs", () => {
  const content = readContent(path.resolve("."), "mathematics");
  const skills = new Set<string>(
    [...content.bankSets.values()].map((set: { skillId: string }) => set.skillId),
  );
  const runtime = expandBank(BANKS.math!, null, skills);
  const audited = [...content.questions.values()]
    .filter((q) => q.bank_source)
    .map(({ bank_source, ...question }) => question);
  expect(runtime).toHaveLength(6672);
  expect(audited).toEqual(runtime);
});
