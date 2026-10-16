#!/usr/bin/env node
// Builds the self-contained review Worker for /think-pilot: one module script (HTML + CSS inline, the player bundled with esbuild, the
// task data inside the bundle). No assets binding, no database, no secrets. Needs a finished `next build` for the compiled Tailwind CSS.
//   node scripts/think/build-review-worker.mjs            -> .think-review/worker.js
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const out = ".think-review";
fs.mkdirSync(out, { recursive: true });
const res = await build({
  entryPoints: ["scripts/think/standalone.tsx"], bundle: true, minify: true, format: "iife", platform: "browser", target: "es2020",
  jsx: "automatic", tsconfig: "tsconfig.json", write: false, define: { "process.env.NODE_ENV": '"production"' }, legalComments: "none",
});
const js = res.outputFiles[0].text;
const cssDir = ".next/static/css";
const css = fs.readdirSync(cssDir).filter((f) => f.endsWith(".css")).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
if (!/\.bg-slate-900|bg-slate-900/.test(css)) throw new Error("compiled CSS lacks the player's utility classes: run `next build` first");
const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Thinking tasks (review pilot)</title><style>${css.replace(/<\/style/gi, "<\\/style")}</style></head><body><div id="root"></div><script src="/app.js"></script></body></html>`;
const worker = `const HTML = ${JSON.stringify(html)};
const JS = ${JSON.stringify(js)};
const H = { "x-robots-tag": "noindex, nofollow", "cache-control": "no-store", "x-content-type-options": "nosniff" };
export default {
  async fetch(req) {
    const u = new URL(req.url);
    if (u.pathname === "/app.js") return new Response(JS, { headers: { ...H, "content-type": "text/javascript; charset=utf-8" } });
    if (u.pathname === "/robots.txt") return new Response("User-agent: *\\nDisallow: /\\n", { headers: { ...H, "content-type": "text/plain" } });
    if (u.pathname === "/healthz") return new Response("ok", { headers: H });
    return new Response(HTML, { headers: { ...H, "content-type": "text/html; charset=utf-8" } });
  },
};
`;
fs.writeFileSync(path.join(out, "worker.js"), worker);
console.log(`worker.js ${(worker.length / 1048576).toFixed(2)} MiB (js ${(js.length / 1024).toFixed(0)} KiB, css ${(css.length / 1024).toFixed(0)} KiB)`);
