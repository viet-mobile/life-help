#!/usr/bin/env node
/**
 * Verifies canonical learning i18n inputs from pinned Claude commit 5302301.
 *
 * Checks:
 *   - Exactly 301 keys in en.ts, ko.ts, and vi.ts
 *     (Commit 8c5a25b had 302 keys; commit f707310 dropped the unused 'locale.en' key).
 *   - 100% key parity across en, ko, and vi
 *   - 100% placeholder parity across all 301 keys
 *   - Computes canonical en.ts SHA-256 hash
 *
 * Usage:
 *   node scripts/generated/verify-canonical-i18n.mjs
 *   node scripts/generated/verify-canonical-i18n.mjs --check
 */

import { execSync } from "node:child_process";
import crypto from "node:crypto";

const PINNED_COMMIT = "f707310";
const EXPECTED_KEY_COUNT = 301;

function readFromCommit(filePath) {
  return execSync(`git show ${PINNED_COMMIT}:${filePath}`, { encoding: "utf8" });
}

export function parseCommitTsDict(content, declName) {
  const decl = content.indexOf(`export const ${declName}`);
  const code = content.slice(content.indexOf("{", decl), content.lastIndexOf("}") + 1);
  return eval(`(${code})`);
}

export function extractPlaceholders(str) {
  const matches = str.match(/\{([a-zA-Z0-9_]+)\}/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1)))).sort();
}

export function verifyCanonicalInputs() {
  const enRaw = readFromCommit("lib/learn/i18n/en.ts");
  const koRaw = readFromCommit("lib/learn/i18n/ko.ts");
  const viRaw = readFromCommit("lib/learn/i18n/vi.ts");

  const enHash = crypto.createHash("sha256").update(enRaw).digest("hex");

  const enDict = parseCommitTsDict(enRaw, "en");
  const koDict = parseCommitTsDict(koRaw, "ko");
  const viDict = parseCommitTsDict(viRaw, "vi");

  const enKeys = Object.keys(enDict);
  const koKeys = Object.keys(koDict);
  const viKeys = Object.keys(viDict);

  if (enKeys.length !== EXPECTED_KEY_COUNT || koKeys.length !== EXPECTED_KEY_COUNT || viKeys.length !== EXPECTED_KEY_COUNT) {
    throw new Error(`CANONICAL SOURCE MISMATCH: Expected ${EXPECTED_KEY_COUNT} keys in each locale! Found en=${enKeys.length}, ko=${koKeys.length}, vi=${viKeys.length}`);
  }

  const enSorted = [...enKeys].sort();
  const koSorted = [...koKeys].sort();
  const viSorted = [...viKeys].sort();

  for (let i = 0; i < EXPECTED_KEY_COUNT; i++) {
    if (enSorted[i] !== koSorted[i] || enSorted[i] !== viSorted[i]) {
      throw new Error(`CANONICAL SOURCE MISMATCH: Key parity error at index ${i}: en=${enSorted[i]}, ko=${koSorted[i]}, vi=${viSorted[i]}`);
    }
  }

  const placeholderErrors = [];
  for (const key of enKeys) {
    const enPh = extractPlaceholders(enDict[key]).join(",");
    const koPh = extractPlaceholders(koDict[key]).join(",");
    const viPh = extractPlaceholders(viDict[key]).join(",");

    if (enPh !== koPh || enPh !== viPh) {
      placeholderErrors.push(`Key "${key}": en=[${enPh}], ko=[${koPh}], vi=[${viPh}]`);
    }
  }

  if (placeholderErrors.length > 0) {
    throw new Error(`CANONICAL SOURCE MISMATCH: Placeholder mismatches:\n${placeholderErrors.join("\n")}`);
  }

  return {
    commit: PINNED_COMMIT,
    enHash,
    keyCount: EXPECTED_KEY_COUNT,
    enDict,
    koDict,
    viDict,
    orderedKeys: enKeys, // exact canonical order in en.ts
  };
}

if (process.argv[1] && process.argv[1].endsWith("verify-canonical-i18n.mjs")) {
  try {
    const result = verifyCanonicalInputs();
    console.log(`PASS: Canonical i18n verified at commit ${result.commit}.`);
    console.log(`Canonical en.ts SHA-256: ${result.enHash}`);
    console.log(`Key count: ${result.keyCount} (100% key and placeholder parity across en, ko, vi)`);
    process.exit(0);
  } catch (err) {
    console.error("FAIL:", err.message);
    process.exit(1);
  }
}
