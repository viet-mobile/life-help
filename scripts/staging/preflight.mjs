#!/usr/bin/env node
/** Integrated staging preflight. Prints variable NAMES with SET / MISSING and safe project refs only - never a value. */
import { loadStagingEnv, preflight, ENV_FILE } from "./contract.cjs";
import fs from "node:fs";

const env = loadStagingEnv();
const r = preflight(env);
console.log(`env file ${ENV_FILE.split("/").slice(-1)[0]} = ${fs.existsSync(ENV_FILE) ? "PRESENT" : "MISSING"}`);
console.log(r.lines.join("\n"));
for (const p of r.problems) console.log(`PROBLEM: ${p}`);
if (r.status === "BLOCKED_MISSING_ENV") console.log(`BLOCKED_MISSING_ENV (${r.missing.length} missing)`);
else if (r.status === "REFUSED") console.log("REFUSED: identity guard failed");
else console.log("PREFLIGHT = READY");
process.exit(r.status === "READY" ? 0 : r.status === "BLOCKED_MISSING_ENV" ? 3 : 2);
