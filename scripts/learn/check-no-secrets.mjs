#!/usr/bin/env node
// Fails if a Supabase secret key (or legacy service_role JWT) appears in anything shipped to browsers.
// Run after `next build`. Scans .next/static (client JS/CSS/HTML chunks) and public/.
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const roots = [".next/static", "public"].filter(existsSync);
const patterns = [/sb_secret_[A-Za-z0-9_-]{8,}/];
const jwt = /eyJ[A-Za-z0-9_-]{10,}\.([A-Za-z0-9_-]{20,})\.[A-Za-z0-9_-]{10,}/g;
let bad = 0;
const walk = (d) => {
  for (const n of readdirSync(d)) {
    const f = path.join(d, n);
    if (statSync(f).isDirectory()) walk(f);
    else if (/\.(js|css|html|json|txt|map|mjs)$/.test(n)) {
      const t = readFileSync(f, "utf8");
      for (const re of patterns) if (re.test(t)) { console.error(`SECRET-LIKE VALUE in ${f} (${re})`); bad++; }
      // JWTs are fine (anon/publishable keys are public) unless the payload grants service_role.
      for (const m of t.matchAll(jwt)) {
        try { if (JSON.parse(Buffer.from(m[1], "base64url").toString()).role === "service_role") { console.error(`service_role JWT in ${f}`); bad++; } } catch {}
      }
    }
  }
};
roots.forEach(walk);
if (bad) process.exit(1);
console.log("client bundle clean");
