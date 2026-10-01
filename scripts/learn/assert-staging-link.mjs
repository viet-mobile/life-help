#!/usr/bin/env node
// Guard run before every staging DB command: the Supabase CLI must be linked to the STAGING project, exactly.
import { existsSync, readFileSync } from "node:fs";

const STAGING_REF = "wreebowcbiymodswajwe";
const file = "supabase/.temp/project-ref";
if (!existsSync(file)) {
  console.error(`STOP: no linked project. Run:  npx supabase link --project-ref ${STAGING_REF}`);
  process.exit(1);
}
const linked = readFileSync(file, "utf8").trim();
if (linked !== STAGING_REF) {
  console.error(`STOP: linked project is "${linked}", not the staging project "${STAGING_REF}". Nothing was executed.`);
  console.error(`Fix with:  npx supabase link --project-ref ${STAGING_REF}`);
  process.exit(1);
}
console.log(`OK: linked project is staging (${STAGING_REF})`);
