import fs from "node:fs";

const files = {
  capability: fs.readFileSync("lib/chat/capability.ts", "utf8"),
  rewards: fs.readFileSync("app/api/rewards/route.ts", "utf8"),
  payout: fs.readFileSync("app/api/rewards/payout/route.ts", "utf8"),
  payoutCapability: fs.readFileSync("app/api/rewards/payout/capability/route.ts", "utf8"),
  device: fs.readFileSync("lib/referral/deviceOwnership.ts", "utf8"),
};
const checks = [
  ["public ID is not reward authorization", !files.rewards.includes("ownerPublicId")],
  ["public ID is not payout authorization", !files.payout.includes("ownerPublicId")],
  ["conversation capability is not payout mint authority", !files.payoutCapability.includes("verifyConversationCapability")],
  ["payout purpose is scoped", files.capability.includes('purpose: "PAYOUT_MANAGEMENT"')],
  ["payout capability expires", files.capability.includes("expiresAt: Date.now() + 60 * 60 * 1000")],
  ["payout capability binds internal identity", files.capability.includes("ownerIdentityId")],
  ["device proof is HttpOnly cookie backed", files.device.includes("httpOnly: true") || files.device.includes("DEVICE_OWNER_COOKIE")],
  ["rewards use device owner proof", files.rewards.includes("DEVICE_OWNER_COOKIE") && files.rewards.includes("verifyDeviceOwnerCookie")],
  ["payout uses device-scoped identity", files.payoutCapability.includes("device_id_hash")],
  ["payout response does not expose service role", !files.payout.includes("serviceRoleKey")],
];
let failed = 0;
for (const [name, ok] of checks) { console.log(`${ok ? "PASS" : "FAIL"} ${name}`); if (!ok) failed += 1; }
process.exit(failed ? 1 : 0);
