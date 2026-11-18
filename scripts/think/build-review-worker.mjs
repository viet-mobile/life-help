#!/usr/bin/env node
// Builds the self-contained review Worker for /think-pilot: one module script (HTML + CSS inline, the player bundled with esbuild, the
// task data inside the bundle). No assets binding, no database, no secrets. Needs a finished `next build` for the compiled Tailwind CSS.
//   node scripts/think/build-review-worker.mjs            -> .think-review/worker.js
import { build } from "esbuild";
import fs from "node:fs";
import path from "node:path";

const out = ".think-review";
fs.mkdirSync(out, { recursive: true });
// The overlays of four languages are too large for one Worker (uncompressed limit 64 MiB): they are served by two small overlay Workers and fetched on demand.
const SUB = process.env.THINK_REVIEW_SUBDOMAIN ?? "simpl2eye";
const NAME = process.env.THINK_REVIEW_WORKER ?? "life-help-think-review";
const REMOTE = { a: ["zh-Hans", "zh-Hant"], b: ["ja", "vi"] };
const baseOf = (grp) => `https://${NAME}-ovl-${grp}.${SUB}.workers.dev`;
const remoteGroup = (lang) => Object.entries(REMOTE).find(([, ls]) => ls.includes(lang))?.[0];
const remotePlugin = {
  name: "remote-overlays",
  setup(b) {
    b.onLoad({ filter: /lib[\\/]think[\\/]data[\\/](?:files|assets-index)\.ts$/ }, async (args) => {
      const src = fs.readFileSync(path.join(path.dirname(args.path), "files.ts"), "utf8").replace(/\(\) => import\("\.\.\/i18n\/([^/]+)\/([^"]+)\.json"\)\.then\([^\n]*?\),/g, (m, lang, key) => {
        const g = remoteGroup(lang);
        return g ? `() => fetch("${baseOf(g)}/o/${lang}/${key}.json").then((r) => r.json() as Promise<Overlay>),` : m;
      });
      return { contents: src, loader: "ts", resolveDir: path.dirname(args.path) };
    });
  },
};
const res = await build({
  plugins: [remotePlugin],
  entryPoints: ["scripts/think/standalone.tsx"], bundle: true, minify: true, format: "iife", platform: "browser", target: "es2020",
  jsx: "automatic", tsconfig: "tsconfig.json", write: false, define: { "process.env.NODE_ENV": '"production"' }, legalComments: "none",
});
const js = res.outputFiles[0].text;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".css") ? [path.join(d, e.name)] : []));
const css = walk(".next/static").map((f) => fs.readFileSync(f, "utf8")).join("\n");
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

// Overlay Workers: GET /o/<lang>/<key>.json -> the overlay, with CORS (the review page lives on another workers.dev host).
for (const [grp, langs] of Object.entries(REMOTE)) {
  const imports = [], entries = [];
  for (const lang of langs) for (const f of fs.readdirSync(`lib/think/i18n/${lang}`).filter((x) => x.endsWith(".json"))) {
    const id = `o${imports.length}`;
    imports.push(`import ${id} from ${JSON.stringify(path.resolve(`lib/think/i18n/${lang}/${f}`))};`);
    entries.push(`${JSON.stringify(`${lang}/${f.replace(/\.json$/, "")}`)}: ${id}`);
  }
  const entry = `${imports.join("\n")}
const MAP = { ${entries.join(", ")} };
const H = { "access-control-allow-origin": "*", "x-robots-tag": "noindex, nofollow", "cache-control": "public, max-age=300" };
export default { async fetch(req) {
  const u = new URL(req.url);
  const m = /^\\/o\\/([^/]+\\/[^/]+)\\.json$/.exec(u.pathname);
  if (u.pathname === "/healthz") return new Response("ok", { headers: H });
  if (!m || !(m[1] in MAP)) return new Response("not found", { status: 404, headers: H });
  return new Response(JSON.stringify(MAP[m[1]]), { headers: { ...H, "content-type": "application/json; charset=utf-8" } });
} };
`;
  fs.writeFileSync(path.join(out, `ovl-${grp}.entry.mjs`), entry);
  const r = await build({ entryPoints: [path.join(out, `ovl-${grp}.entry.mjs`)], bundle: true, minify: true, format: "esm", platform: "browser", target: "es2022", write: false, legalComments: "none", loader: { ".json": "json" } });
  fs.writeFileSync(path.join(out, `ovl-${grp}.js`), r.outputFiles[0].text);
  console.log(`ovl-${grp}.js ${(r.outputFiles[0].text.length / 1048576).toFixed(2)} MiB (${langs.join(", ")})`);
}
