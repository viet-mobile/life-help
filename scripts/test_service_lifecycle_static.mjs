import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const checks = [
  ["Helper START route resolves authenticated helper", read("app/api/helper/assignments/[assignmentId]/start/route.ts"), ["resolveAuthenticatedHelper", "eq(\"helper_id\", helper.id)", "eq(\"status\", \"ACCEPTED\")", "IN_PROGRESS"]],
  ["Helper COMPLETE route resolves authenticated helper", read("app/api/helper/assignments/[assignmentId]/complete/route.ts"), ["resolveAuthenticatedHelper", "complete_assignment_service", "p_helper_id: helper.id", "HELPER_MISMATCH"]],
  ["Customer status verifies private capability", read("app/api/requests/status/route.ts"), ["verifyConversationCapability", "eq(\"customer_id\", verified.customerId)", "Cache-Control"]],
  ["Helper UI exposes lifecycle actions", read("components/tech/DbAssignmentPanel.tsx"), ["\"start\"", "\"complete\"", "Start service", "Mark completed"]],
  ["Customer UI polls private status", read("app/request/page.tsx"), ["/api/requests/status", "setInterval", "liveStatus"]],
  ["Customer UI keeps COMPLETED distinct from settlement states", read("app/request/page.tsx"), ["request.statusPaymentPending", "request.statusSettled", "request.statusClosed", "chat.cleanupPolicy"]],
  ["Customer chat shows cleanup policy and deleted state", read("components/chat/DbChatPanel.tsx"), ["chat.cleanupPolicy", "chat.contentDeleted", "!contentDeleted"]],
];
let failed = 0;
for (const [name, source, needles] of checks) {
  const missing = needles.filter((needle) => !source.includes(needle));
  if (missing.length) {
    failed += 1;
    console.error(`FAIL ${name}: missing ${missing.join(", ")}`);
  } else {
    console.log(`PASS ${name}`);
  }
}
if (failed) process.exitCode = 1;
