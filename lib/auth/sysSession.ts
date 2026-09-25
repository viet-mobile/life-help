import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

export const SYS_SESSION_COOKIE = "life_help_sys_session";

export type SysAdminSession = {
  id: string;
  role: "SUPER_ADMIN";
  expiresAt: number;
};

async function hmac(secret: string, value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value)
  );

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return difference === 0;
}

export async function verifySysSessionToken(
  token: string | undefined
): Promise<SysAdminSession | null> {
  if (!token) {
    return null;
  }

  const parts = token.split("|");

  if (parts.length !== 3) {
    return null;
  }

  const [adminId, expiresRaw, suppliedSignature] = parts;
  const expiresAt = Number(expiresRaw);

  if (
    !adminId ||
    !Number.isFinite(expiresAt) ||
    Date.now() > expiresAt
  ) {
    return null;
  }

  const { env } = await getCloudflareContext({ async: true });

  const configuredAdminId =
    (env as any).LIFE_HELP_SYS_ADMIN_ID as string | undefined;

  const sessionSecret =
    (env as any).LIFE_HELP_SYS_SESSION_SECRET as string | undefined;

  if (
    !configuredAdminId ||
    !sessionSecret ||
    !constantTimeEqual(adminId, configuredAdminId)
  ) {
    return null;
  }

  const expectedSignature = await hmac(
    sessionSecret,
    `${adminId}|${expiresAt}`
  );

  if (!constantTimeEqual(suppliedSignature, expectedSignature)) {
    return null;
  }

  return {
    id: adminId,
    role: "SUPER_ADMIN",
    expiresAt,
  };
}
