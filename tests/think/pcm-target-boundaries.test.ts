import { describe, expect, it } from "vitest";
import english from "../../lib/think/data/english.json";
import overlay from "../../lib/think/i18n/pcm/pilot-english.json";
import { flatten, flattenLearnerExtras } from "../../lib/think/flat";
import { localizeFor } from "../../lib/think/localize";
import type { ThinkTask } from "../../lib/think/types";

const original = english.find(t => t.id === "e-01") as unknown as ThinkTask;

describe("reviewed PCM library-notice translation", () => {
  it("explicitly covers every learner field, preserving the English notice and answer mechanics", () => {
    const fields = { ...flatten(original), ...flattenLearnerExtras(original) };
    expect(Object.keys(overlay["e-01"]).sort()).toEqual(Object.entries(fields).filter(([, v]) => v.trim()).map(([k]) => k).sort());
    const result = localizeFor(original, "pcm", { primary: overlay, fallback: {} });
    expect(result.translated).toBe(true);
    expect(result.lang).toBe("pcm");
    expect(result.task.material).toContain("Library\nOpen: Mon, Wed, Fri  3:00-4:00\nThis week: closed on Friday (cleaning day).");
    expect(result.task.material).toContain("Let's go to the library on Thursday and on Friday this week!");
    expect(result.task.steps.map(s => s.id)).toEqual(original.steps.map(s => s.id));
    for (let i = 0; i < original.steps.length; i++) {
      const before = original.steps[i];
      const after = result.task.steps[i];
      if (before.kind === "choose" && after.kind === "choose") {
        expect(after.correct).toEqual(before.correct);
        expect(after.options.map(o => o.id)).toEqual(before.options.map(o => o.id));
      }
      if (before.kind === "write" && after.kind === "write") {
        expect(after.modelAnswers.map(m => m.text)).toEqual(before.modelAnswers.map(m => m.text));
        expect(after.checks.map(({ label: _label, ...check }) => check)).toEqual(before.checks.map(({ label: _label, ...check }) => check));
      }
    }
    expect(JSON.stringify(overlay)).not.toContain("authoringContext");
  });

  it("hides the task when a short learner-visible label is missing; English fallback cannot fill it", () => {
    const partial = { "e-01": { ...overlay["e-01"] } };
    delete (partial["e-01"] as Record<string, string>)["s.s3.check.w4.label"];
    expect(localizeFor(original, "pcm", { primary: partial, fallback: overlay }).translated).toBe(false);
  });
});
