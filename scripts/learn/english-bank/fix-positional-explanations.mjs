#!/usr/bin/env node
// One-off, idempotent: explanations of standalone (kind m) items must quote the key instead of pointing at a position (options are shuffled). Found by lint.mjs rule R2.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const FIX = [
  ["다음 중 if가 '~인지 아닌지'의 뜻으로 쓰인 문장은?", "'She asked if I could help her.'의 if는 asked의 목적어절을 이끌어 '도울 수 있는지'라는 뜻이에요. 나머지는 '만약 ~라면'이에요."],
  ["“Because she felt lonely, Hana called her friend.”를 분사구문으로 바르게 바꾼 것은?", "접속사 Because와 주어를 지우고 felt를 Feeling으로 바꾼 'Feeling lonely, Hana called her friend.'가 맞아요. 'Feeling lonely, her friend was called by Hana.'는 의미상 주어가 her friend가 되어 틀려요."],
  ["수동 의미의 분사구문이 올바르게 쓰인 문장은?", "‘쓰인’ 것은 시이므로 주절의 주어도 this poem이어야 해요. 'Written by a famous poet, I enjoyed this poem very much.'는 주어가 I라서 틀려요."],
  ["소음 이야기 중 'It is ~ that' 강조 구문으로 쓰인 것은?", "It was ~ that ... 의 형태인 것은 'It was the noise that kept me awake.'뿐이에요."],
  ["다음 중 괄호로 표시한 whatever절이 '주어' 역할을 하는 명사절인 문장은?", "'[Whatever she bakes] smells delicious.'에서는 whatever절이 문장의 주어이고, 나머지는 쉼표로 분리된 양보의 부사절이에요."],
  ["다음 중 'no matter wh-'로 바꿔 쓸 수 없는 whatever절이 있는 문장은?", "'Whatever she cooks tastes great.'의 whatever절은 주어 역할을 하는 명사절이라 no matter what으로 바꿀 수 없어요. 나머지는 양보의 부사절이에요."],
  ["다음 주장을 가장 잘 뒷받침하는 근거는?\n주장: Reading aloud helps learners improve their pronunciation.", "발음 향상을 직접 보여 주는 것은 'Learners who read aloud daily were easier to understand in a later test.'예요."],
];
let hit = 0;
for (const f of fs.readdirSync(path.join(here, "pools"))) {
  const file = path.join(here, "pools", f); const j = JSON.parse(fs.readFileSync(file, "utf8")); let ch = false;
  for (const sec of j.sections ?? [{ items: j.items }]) for (const it of sec.items) {
    if (it.k !== "m") continue;
    for (const [q, why] of FIX) if (it.q === q || it.q.replace(/\s+/g, " ") === q.replace(/\s+/g, " ")) { if (it.why !== why) { it.why = why; ch = true; hit++; } }
  }
  if (ch) fs.writeFileSync(file, JSON.stringify(j));
}
console.log("explanations rewritten:", hit);
