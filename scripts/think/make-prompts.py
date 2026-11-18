#!/usr/bin/env python3
"""Writes one authoring prompt per batch (plan-batches.py output). python3 scripts/think/make-prompts.py <authDir>"""
import json, sys
d = sys.argv[1]
plan = json.load(open(f"{d}/batches.json")); ex = json.load(open(f"{d}/existing-titles.json"))
T = """You are authoring ONE batch of exactly {total} NEW thinking tasks for the Korean learning platform. Work ONLY in /home/user/think-wt (git worktree; no git commands). Your single output file: {file} (a JSON array of exactly {total} task objects). Do NOT edit any other file, do NOT run scripts/think/gen-extra-index.mjs (the lead regenerates the index; other authors write files in parallel).

READ FIRST (mandatory, in this order): docs/think-pilot/AUTHORING.md (rules + the section "추가 배치" with the defects independent reviews found: avoid every one), lib/think/types.ts (schema), lib/think/data/example-math.json (complete valid example). For the style of finished tasks read two tasks in lib/think/data/math.json. lib/think/expr.ts defines the constraint language for `build` steps, lib/think/validate.ts the validator. Do NOT read anything under docs/think-pilot/chatgpt-expansion-* or public/codex-* (another author's set is kept separate for comparison; yours must be independent).

ALLOCATION. Each task is counted in exactly ONE allocation cell. This batch fills these cells:
{cells}
Every task needs: id `{prefix}-01`..`-{total:02d}` (in the order of the cells above), subject="math", grade (as given), cell (exactly the cell string given), topic = a CONCRETE sub-topic inside the cell's field (not just the field name), level and levelLabel as given, uiLang="ko". Do not set `status`. curriculum: null (never claim a standard or that the task fulfils one). "H1/H2/H3" for high-school cells is the difficulty/support level of this production allocation only — it does NOT mean the ministry assigns that course to that school year. For H cells state the school-order assumption and the prerequisite explicitly in `prerequisites` (e.g. a calculus task at H1 must still name the limit/derivative prerequisite it relies on, and stay at an introductory difficulty; an H3 task may assume more). Lower grades must NOT require not-yet-learned content (e.g. no ratio equations or probability formulas for grades 1-2: use classification, comparison, patterns, counting evidence).

ALREADY EXISTING tasks in the same area (do NOT duplicate their scenario, claim or structure; make yours genuinely different):
{existing}

DESIGN OF EACH TASK. Reason-centred: first judgement -> evidence -> NEW information -> keep or revise the judgement -> verify, or build a new case yourself. Mix forms across the batch: error analysis, counterexample, is-the-information-sufficient (say what else must be known), model comparison, alternative design, several valid answers under constraints. Rules:
- Never merely swap numbers/names/option order of another task. At least 40% of the tasks generative:true; use at least 3 different step kinds across the batch (not all multiple choice); 2-4 steps per task, at most 2 write steps, 2 hints per step (each hint = a next ACTION: observe/compare/test, never the answer), 2 model answers per write step, >=1 bad answer.
- reveal steps: do NOT force the student to flip the first judgement. The new information must genuinely change something (the judgement, the condition, or the confidence); where the evidence is enough, keeping the first judgement must be an acceptable path (put it in `reasonable`).
- Do not force a single method. Record alternatives, counterexamples, conditional answers, and "cannot decide" where legitimate (alternatives, hardCases, `acceptable`).
- Math: state conditions, units, ranges and assumptions explicitly in the material; independently RECOMPUTE every key, example solution and number with a short python script (e.g. sympy/fractions) before finalising — a wrong key is the worst defect; mention the script check in your reply. Insufficient information may be intentional; then the student must say what else must be known.
- Written answers are never judged correct merely because a keyword appears: `checks` are surface checks only (condition present, number mentioned, a reason word) and the `selfAssess` + `humanReview` carry the quality judgement. Make checks tolerant of valid variants (probe 2 valid + 2 invalid answers per write step mentally) and make sure plain filler answers fail.
- Quality rules from the reviews: correct option never the longest / only hedged; vary the position of the correct option across steps and tasks; every non-key option has `reveals`; no option-length or letter-rotation tells; pickLine explanations number lines from 1; build tasks use distinctBy that ignores permutations when permutations are the same example; titles/prerequisites/hints must not name the solving operation; no images exist — describe figures in words or text tables, give spoken forms of symbols (cautions.accessibility).
- Every field must be filled: goal, thinking, differsFromPlain, prerequisites, minutes (your pre-observation estimate, 3-30), material (the situation), rubric (>=2 rows), alternatives, hardCases, cautions (language/culture/accessibility, specific), autoVsHuman, misconception-revealing `reveals` on options. Korean must be natural for the grade; no real persons, no politics/religion bias, no gender stereotypes.

VALIDATE without touching shared files: create tests/think/_{prefix}.test.ts that imports your JSON and asserts validateSet(...) equals [] and that every task has cell/grade/topic/level/levelLabel as required, ids as required, and the cell counts are exactly {counts}; run `cd /home/user/think-wt && npx vitest run tests/think/_{prefix}.test.ts`, iterate until it passes, then DELETE the temporary test. Write the JSON with a script in one go. Reply with a table (id, cell, topic, format, generative, one line) plus unresolved doubts and what you verified by script.
"""
for b in plan:
    cells = "\n".join(f"- cell `{c['cell']}`: {c['n']} tasks. Field: {c['desc']}. grade=\"{c['grade']}\", level={c['level']}, levelLabel=\"{c['levelLabel']}\"." for c in b["cells"])
    seen, ex_lines = set(), []
    for c in b["cells"]:
        s, g, dom = c["cell"].split("|")
        for cell, titles in ex.items():
            cs, cg, cd = cell.split("|")
            if cs == s and (cell == c["cell"] or (cg == g and cd == dom)) and cell not in seen:
                seen.add(cell); ex_lines += [f"  [{cell}] {t}" for t in titles]
    # same-grade neighbours help avoid near duplicates
    existing = "\n".join(ex_lines) or "  (none counted in these cells yet; also avoid the pilot topics in lib/think/data/math.json)"
    total = sum(c["n"] for c in b["cells"])
    counts = ", ".join(f"{c['cell']}={c['n']}" for c in b["cells"])
    open(f"{d}/prompt-{b['batch']:02d}.txt", "w", encoding="utf8").write(T.format(total=total, file=b["file"], prefix=b["prefix"], cells=cells, existing=existing, counts=counts))
print(len(plan), "prompts")
