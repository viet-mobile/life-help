import { describe, expect, it } from "vitest";
import { localize, localizeFor, loadOverlay, loadOverlays } from "@/lib/think/localize";
import { TASK_LOADERS, OVERLAY_LOADERS } from "@/lib/think/data/assets-index";
import type { ThinkTask } from "@/lib/think/types";

describe("Thinking Challenges Multilingual Localization", () => {
  it("resolves authentic Galician (gl) for Grade 12 Physics (physics-d06)", async () => {
    expect(OVERLAY_LOADERS.gl).toBeDefined();
    expect(OVERLAY_LOADERS.gl["physics-d06"]).toBeDefined();

    const tasks = await TASK_LOADERS["physics-d06"]();
    const g12Task = tasks.find((t) => t.grade === "H3");
    expect(g12Task).toBeDefined();

    const glOverlay = await OVERLAY_LOADERS.gl["physics-d06"]();
    expect(glOverlay[g12Task!.id]).toBeDefined();

    const res = localize(g12Task!, "gl", glOverlay);
    expect(res.translated).toBe(true);
    expect(res.lang).toBe("gl");
    expect(res.task.title).toContain("Relatividade especial");
    expect(res.task.steps[0].prompt).toContain("Investigación de Física");
    expect(res.task.steps[0].prompt).not.toMatch(/[가-힣]/);
  });

  it("falls back to complete English for any language without translation", async () => {
    const tasks = await TASK_LOADERS["physics-d06"]();
    const g12Task = tasks.find((t) => t.grade === "H3");
    expect(g12Task).toBeDefined();

    const enOverlay = await OVERLAY_LOADERS.en["physics-d06"]();
    expect(enOverlay[g12Task!.id]).toBeDefined();

    // With empty primary overlay (simulating unlocalised language), localizeFor should return English
    const res = localizeFor(g12Task!, "af", { primary: {}, fallback: enOverlay });
    expect(res.translated).toBe(true);
    expect(res.lang).toBe("en");
    expect(res.task.title).toContain("Special Relativity");
    expect(res.task.steps[0].prompt).toContain("Physics Inquiry");
    expect(res.task.steps[0].prompt).not.toMatch(/[가-힣]/);
  });
});
