// Collects every math question that carries a figure (course content + expanded practice bank) for the figure audit.
import fs from "node:fs";
import { loadIndex } from "@/lib/learn/content/repository";

async function main() {
  const out: unknown[] = [];
  for (const site of ["math"] as const) {
    const { bundle } = await loadIndex(site);
    for (const q of bundle.questions) {
      if (!q.figure) continue;
      out.push({ id: q.id, skillId: q.skillId, role: q.role, type: q.type, prompt: q.prompt, latex: q.latex, answer: q.answer, explanation: q.explanation, hints: q.hints, figure: q.figure });
    }
  }
  fs.writeFileSync(process.argv[2] ?? "figures.json", JSON.stringify(out));
  console.log(`figure questions: ${out.length}`);
}
void main();
