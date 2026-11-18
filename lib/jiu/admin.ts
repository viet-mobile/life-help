import "server-only";
import { scryptSync, timingSafeEqual, createHmac, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { readJiuEnv } from "./env";
const COOKIE = "jiu-admin";
const MAIL_COOKIE = "jiu-mail";
export async function verifyPassword(password: string): Promise<boolean> {
  const [salt, digest] = ((await readJiuEnv("JIU_ADMIN_PASSWORD_HASH")) || "").split(":");
  if (!salt || !digest || password.length > 256) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(digest, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function signature(value: string, secret: string) { return createHmac("sha256", secret).update(value).digest("hex"); }
async function verifyCookie(name: string) {
  const secret = await readJiuEnv("JIU_SESSION_SECRET");
  if (!secret) return false;
  const token = (await cookies()).get(name)?.value || "";
  const [expiry, nonce, mac, extra] = token.split(".");
  if (extra || !expiry || !nonce || !mac || !Number.isFinite(Number(expiry)) || Number(expiry) < Date.now()) return false;
  const expected = Buffer.from(signature(`${name}:${expiry}.${nonce}`, secret));
  const actual = Buffer.from(mac);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export async function isJiuAdmin() { return verifyCookie(COOKIE); }
export async function canSendJiuMail() { return verifyCookie(MAIL_COOKIE); }
export async function setAdminSession() {
  const secret = await readJiuEnv("JIU_SESSION_SECRET");
  if (!secret) throw new Error("Admin is not configured");
  const store = await cookies();
  for (const [name, maxAge] of [[COOKIE, 8 * 60 * 60], [MAIL_COOKIE, 90 * 24 * 60 * 60]] as const) {
    const value = `${Date.now() + maxAge * 1000}.${randomBytes(16).toString("hex")}`;
    store.set(name, `${value}.${signature(`${name}:${value}`, secret)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/jiu", maxAge });
  }
}
export async function clearAdminSession() {
  const store = await cookies();
  for (const name of [COOKIE, MAIL_COOKIE]) store.set(name, "", { path: "/jiu", maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" });
}
