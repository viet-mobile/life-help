// Renders every figure question to an HTML sheet (figure + prompt + key + explanation) for visual audit: tsx scripts/audit/figures-render.tsx <figures.json> <outDir>
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FigureView } from "@/components/learn/FigureView";

const [src, outDir] = [process.argv[2], process.argv[3]];
const qs = JSON.parse(fs.readFileSync(src, "utf8")) as Array<{ id: string; prompt: string; latex?: string; answer: { kind: string; id?: string; value?: unknown; ids?: string[] }; explanation: string; figure: never; skillId: string; options?: { id: string; text: string }[] }>;
fs.mkdirSync(outDir, { recursive: true });
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
const card = (q: (typeof qs)[number]) => `<div class="c"><div class="id">${esc(q.id)}</div><div class="p">${esc(q.prompt)}${q.latex ? "<br>" + esc(q.latex) : ""}</div>${renderToStaticMarkup(React.createElement(FigureView, { figure: q.figure, label: q.id }))}<div class="a">정답: ${esc(JSON.stringify(q.answer))}</div><div class="e">${esc(q.explanation)}</div></div>`;
const per = 12;
for (let i = 0; i * per < qs.length; i++) {
  const html = `<!doctype html><meta charset="utf-8"><style>body{font:13px sans-serif;margin:8px;color:#111}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.c{border:1px solid #999;padding:6px;border-radius:6px}.id{font-weight:700;color:#06c}.a{color:#a00;font-weight:700}.e{color:#444}svg{max-width:100%;height:auto;background:#fff}</style><div class="g">${qs.slice(i * per, (i + 1) * per).map(card).join("")}</div>`;
  fs.writeFileSync(path.join(outDir, `sheet-${String(i + 1).padStart(2, "0")}.html`), html);
}
console.log(`sheets: ${Math.ceil(qs.length / per)}`);
