import { describe, expect, it } from "vitest";
import { TASK_LOADERS, OVERLAY_LOADERS } from "@/lib/think/data/files";
import { localizeFor } from "@/lib/think/localize";

describe("Thinking Challenges Multilingual Localization", () => {
  it("resolves authentic Galician (gl) for Grade 12 Physics (physics-d06)", async () => {
    const tasks = await TASK_LOADERS["physics-d06"]();
    const task = tasks.find((t) => t.id === "20261118-physics-g12") ?? tasks[0];

    const primary = await OVERLAY_LOADERS.gl["physics-d06"]();
    const fallback = await OVERLAY_LOADERS.en["physics-d06"]();

    const loc = localizeFor(task, "gl", { primary, fallback });

    expect(loc.translated).toBe(true);
    expect(loc.lang).toBe("gl");
    expect(loc.task.title).toContain("Conexión de circuítos eléctricos");
    expect(loc.task.steps[0].prompt).not.toContain("[가-힣]");
  });

  it("resolves authentic Vietnamese (vi) for Math, Physics, and Chemistry", async () => {
    // Math
    const mathTasks = await TASK_LOADERS["math-d01"]();
    const mTask = mathTasks[0];
    const mPrimary = await OVERLAY_LOADERS.vi["math-d01"]();
    const mFallback = await OVERLAY_LOADERS.en["math-d01"]();
    const mLoc = localizeFor(mTask, "vi", { primary: mPrimary, fallback: mFallback });

    expect(mLoc.translated).toBe(true);
    expect(mLoc.lang).toBe("vi");
    expect(mLoc.task.title).toContain("Biểu diễn 52 cái");
    expect(mLoc.task.steps[0].prompt).toContain("Harin");

    // Physics
    const pTasks = await TASK_LOADERS["physics-d01"]();
    const pTask = pTasks[0];
    const pPrimary = await OVERLAY_LOADERS.vi["physics-d01"]();
    const pFallback = await OVERLAY_LOADERS.en["physics-d01"]();
    const pLoc = localizeFor(pTask, "vi", { primary: pPrimary, fallback: pFallback });

    expect(pLoc.translated).toBe(true);
    expect(pLoc.lang).toBe("vi");
    expect(pLoc.task.title).toContain("nam châm");
    expect(pLoc.task.steps[0].prompt).toContain("nam châm");

    // Chemistry
    const cTasks = await TASK_LOADERS["chemistry-d01"]();
    const cTask = cTasks[0];
    const cPrimary = await OVERLAY_LOADERS.vi["chemistry-d01"]();
    const cFallback = await OVERLAY_LOADERS.en["chemistry-d01"]();
    const cLoc = localizeFor(cTask, "vi", { primary: cPrimary, fallback: cFallback });

    expect(cLoc.translated).toBe(true);
    expect(cLoc.lang).toBe("vi");
    expect(cLoc.task.title).toContain("vật thể và chất");
    expect(cLoc.task.steps[0].prompt).toContain("vật thể");
  });

  it("resolves authentic Chinese (zh-Hans and zh-Hant) without English fallback", async () => {
    const mathTasks = await TASK_LOADERS["math-d01"]();
    const mTask = mathTasks[0];

    // zh-Hans
    const hansPrimary = await OVERLAY_LOADERS["zh-Hans"]["math-d01"]();
    const hansFallback = await OVERLAY_LOADERS.en["math-d01"]();
    const hansLoc = localizeFor(mTask, "zh-Hans", { primary: hansPrimary, fallback: hansFallback });
    expect(hansLoc.translated).toBe(true);
    expect(hansLoc.lang).toBe("zh-Hans");
    expect(hansLoc.task.title).toContain("把52个用捆和散的个数");
    expect(hansLoc.task.steps[0].prompt).toContain("夏琳");

    // zh-Hant
    const hantPrimary = await OVERLAY_LOADERS["zh-Hant"]["math-d01"]();
    const hantFallback = await OVERLAY_LOADERS.en["math-d01"]();
    const hantLoc = localizeFor(mTask, "zh-Hant", { primary: hantPrimary, fallback: hantFallback });
    expect(hantLoc.translated).toBe(true);
    expect(hantLoc.lang).toBe("zh-Hant");
    expect(hantLoc.task.title).toContain("把52個用捆和散的個數");
    expect(hantLoc.task.steps[0].prompt).toContain("夏琳");
  });

  it("resolves authentic Spanish (es) and Japanese (ja) for Physics Grade 12", async () => {
    const tasks = await TASK_LOADERS["physics-d06"]();
    const task = tasks.find((t) => t.id === "20261118-physics-g12") ?? tasks[0];

    // Spanish
    const esPrimary = await OVERLAY_LOADERS.es["physics-d06"]();
    const esFallback = await OVERLAY_LOADERS.en["physics-d06"]();
    const esLoc = localizeFor(task, "es", { primary: esPrimary, fallback: esFallback });
    expect(esLoc.translated).toBe(true);
    expect(esLoc.lang).toBe("es");
    expect(esLoc.task.title).toContain("Conexión de circuitos eléctricos");

    // Japanese
    const jaPrimary = await OVERLAY_LOADERS.ja["physics-d06"]();
    const jaFallback = await OVERLAY_LOADERS.en["physics-d06"]();
    const jaLoc = localizeFor(task, "ja", { primary: jaPrimary, fallback: jaFallback });
    expect(jaLoc.translated).toBe(true);
    expect(jaLoc.lang).toBe("ja");
    expect(jaLoc.task.title).toContain("電気回路のつなぎ方");
  });
});
