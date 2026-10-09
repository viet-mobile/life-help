import { createHash, randomBytes } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { expect } from "vitest";
import { apply, newBase } from "../learn/chainDb";

export const SERVICE_CORE = "202610090040_service_core.sql";
export const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const secret = () => randomBytes(24).toString("hex");

/** Supabase-compatible base plus ONLY the service-core migration (it has no other dependency). */
export async function newServiceDb(): Promise<PGlite> {
  const db = await newBase();
  await apply(db, [SERVICE_CORE]);
  return db;
}

/** Calls a service function the way the server does (as the owner / service role). */
export async function call<T = any>(db: PGlite, fn: string, ...args: unknown[]): Promise<T> {
  const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
  const res = await db.query<{ v: T }>(`select public.${fn}(${placeholders}) as v`, args);
  return res.rows[0].v;
}
export async function rejects(db: PGlite, fn: string, args: unknown[], code: string) {
  await expect(call(db, fn, ...args), `${fn} should fail with ${code}`).rejects.toThrow(new RegExp(`\\b${code}\\b`));
}

export interface Customer { cred: string; credHash: string; token: string; tokenHash: string }
export const newCustomer = (): Customer => {
  const cred = secret(), token = secret();
  return { cred, credHash: sha(cred), token, tokenHash: sha(token) };
};
export interface Helper { id: string; cred: string; credHash: string }

const IKSAN = { country: "KR", sido: "전북특별자치도", gungu: "익산시" };

export async function createRequest(db: PGlite, c: Customer, over: Partial<{ service: string; country: string; sido: string; gungu: string; locale: string; description: string }> = {}) {
  return call(db, "svc_c_create_request", c.credHash, c.tokenHash, over.locale ?? "vi", over.service ?? "toilet-clog", over.country ?? IKSAN.country,
    over.sido ?? IKSAN.sido, over.gungu ?? IKSAN.gungu, "전북특별자치도 익산시 신동 대학로 123", over.description ?? "Bồn cầu bị tắc", ["urgent"]);
}

export async function registerHelper(db: PGlite, over: Partial<{ name: string; services: string[]; regions: object[]; locale: string; expires: Date }> = {}): Promise<Helper> {
  const cred = secret();
  const expires = over.expires ?? new Date(Date.now() + 90 * 86_400_000);
  const h = await call(db, "svc_h_register", sha(cred), expires.toISOString(), over.name ?? "Helper A", over.locale ?? "ko", ["ko", "vi"], over.services ?? ["toilet-clog", "sink-clog"],
    over.regions ?? [IKSAN], null);
  return { id: h.id, cred, credHash: sha(cred) };
}
export async function approvedHelper(db: PGlite, over: Parameters<typeof registerHelper>[1] = {}, available = true): Promise<Helper> {
  const h = await registerHelper(db, over);
  await call(db, "svc_a_set_helper_status", "admin-1", h.id, "APPROVED");
  if (available) await call(db, "svc_h_set_available", h.credHash, true);
  return h;
}
