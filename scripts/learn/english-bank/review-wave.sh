#!/usr/bin/env bash
# Processes finished review batches:  scripts/learn/english-bank/review-wave.sh <dir> <n> [<n> ...]
# For each batch whose blind AND informed outputs exist: validates canaries / coverage, applies the patches, records the ledger.
# Batches with an unreliable blind solver, incomplete verdicts or unresolved blind disagreements are NOT applied and are listed at the end.
set -u
DIR="$1"; shift
HERE="$(cd "$(dirname "$0")" && pwd)"
pending=()
for n in "$@"; do
  if [ ! -f "$DIR/blind-$n.out.json" ] || [ ! -f "$DIR/review-$n.out.json" ]; then pending+=("$n:waiting"); continue; fi
  sum=$(node "$HERE/review-collect.mjs" "$DIR" "$n" ${COLLECT_FLAGS:-} 2>/tmp/rw-err-$n.txt); rc=$?
  line=$(echo "$sum" | tail -1 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);console.log(`b${j.batch} ${j.packet} q=${j.questions} blindMiss=${j.blindMismatch} amb=${j.blindAmbiguous} defects=${j.reviewerDefects} ${JSON.stringify(j.bySeverity)} patches=${j.patches} unresolved=${j.unresolvedFlaggedItems.length} canary=${JSON.stringify(j.canary)}`)}catch(e){console.log("unparsable")}})')
  echo "$line"
  if [ $rc -ne 0 ]; then pending+=("$n:rc$rc"); head -3 /tmp/rw-err-$n.txt; continue; fi
  unres=$(echo "$sum" | tail -1 | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{console.log(JSON.parse(s).unresolvedFlaggedItems.join(","))})')
  if [ -n "$unres" ] && [ -z "${ACCEPT_UNRESOLVED:-}" ]; then pending+=("$n:unresolved[$unres]"); continue; fi
  if [ -n "${ACCEPT_UNRESOLVED:-}" ]; then node "$HERE/review-collect.mjs" "$DIR" "$n" ${COLLECT_FLAGS:-} --apply --accept "$ACCEPT_UNRESOLVED" | tail -1 | cut -c1-200; else node "$HERE/review-collect.mjs" "$DIR" "$n" ${COLLECT_FLAGS:-} --apply | tail -1 | cut -c1-200; fi
done
echo "NOT APPLIED: ${pending[*]:-none}"
