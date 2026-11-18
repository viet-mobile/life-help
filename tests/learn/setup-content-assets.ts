import { execFileSync } from "node:child_process";

/** Generate public/learn-content (gitignored) before the suite, as the build does. */
export default function setup() {
  execFileSync(process.execPath, ["scripts/think/gen-extra-index.mjs"], { stdio: "inherit" });
  execFileSync(process.execPath, ["scripts/learn/build-content-assets.mjs"], { stdio: "inherit" });
}
