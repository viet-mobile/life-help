import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createChainDb } from "../learn/chainDb";

const OLD = ["clog-clearing", "leak-plumbing", "boiler", "cleaning", "housing", "bank-help", "insurance-help", "job-help", "hospital-help", "mobile-help"];

describe("aircon service migration (202610050028) on the real chain, local PGlite only", { timeout: 180_000 }, () => {
  it("accepts the 11th service in requests, helper offers and the sub-service catalogue, and still rejects anything else", async () => {
    const db = await createChainDb();
    try {
      const ok = async (sql: string) => { await db.exec(sql); };
      // sub-services exist with the intended pricing modes and NO price anywhere
      const sub = await db.query<{ subitem_code: string; default_pricing_mode: string; allowed: string }>("select subitem_code, default_pricing_mode, allowed_pricing_modes::text as allowed from public.service_subitems where service_code = 'aircon' order by sort_order");
      expect(sub.rows.map((r) => r.subitem_code)).toEqual(["aircon-install", "aircon-repair", "aircon-cleaning"]);
      expect(sub.rows.map((r) => r.default_pricing_mode)).toEqual(["DIAGNOSTIC_PLUS_QUOTE", "DIAGNOSTIC_PLUS_QUOTE", "PER_UNIT"]);
      const columns = (await db.query<{ column_name: string }>("select column_name from information_schema.columns where table_schema='public' and table_name='service_subitems'")).rows.map((r) => r.column_name);
      expect(columns.some((c) => /price|amount|fee/i.test(c))).toBe(false);
      // all 10 old services still exist in the catalogue; the catalogue is exactly the old rows + the 3 new ones
      const total = (await db.query<{ n: string }>("select count(*)::text n from public.service_subitems")).rows[0].n;
      const old = (await db.query<{ n: string }>(`select count(*)::text n from public.service_subitems where service_code = any (array[${OLD.map((s) => `'${s}'`).join(",")}])`)).rows[0].n;
      expect(Number(total) - Number(old)).toBe(3);
      // the three closed CHECKs: 11 accepted, others rejected
      for (const slug of [...OLD, "aircon"]) {
        await ok(`insert into public.service_subitems (service_code, subitem_code, allowed_pricing_modes, default_pricing_mode) values ('${slug}', 'zz-probe-${slug}', '{FIXED}', 'FIXED')`);
      }
      await expect(db.exec(`insert into public.service_subitems (service_code, subitem_code, allowed_pricing_modes, default_pricing_mode) values ('air-conditioner', 'zz-probe', '{FIXED}', 'FIXED')`)).rejects.toThrow(/_check/i);
      const helper = (await db.query<{ id: string }>("insert into public.helpers (helper_id, name, sido) values ('h-aircon-test', 'T', '서울') returning id")).rows[0].id;
      await ok(`insert into public.helper_services (helper_id, service_slug) values ('${helper}', 'aircon')`);
      await expect(db.exec(`insert into public.helper_services (helper_id, service_slug) values ('${helper}', 'air-conditioner')`)).rejects.toThrow(/_check/i);
      await ok(`insert into public.service_requests (customer_id, customer_display_name, service_slug, sido, gungu, request_mode, legacy_unfunded) values ('c1', 'C', 'aircon', '서울', '강남구', 'LEGACY_AUTO_MATCH', true)`);
      await expect(db.exec(`insert into public.service_requests (customer_id, customer_display_name, service_slug, sido, gungu, request_mode, legacy_unfunded) values ('c1', 'C', 'ac', '서울', '강남구', 'LEGACY_AUTO_MATCH', true)`)).rejects.toThrow(/_check/i);
    } finally { await db.close(); }
  });
  it("is idempotent in effect and changes nothing but the three constraints and the three rows", () => {
    const sql = readFileSync("supabase/migrations/202610050028_aircon_service.sql", "utf8").replace(/--.*$/gm, "");
    expect(sql).not.toMatch(/\b(drop\s+(table|type|function|policy|trigger)|truncate|delete\s+from|update\s+public)\b/i);
    expect([...sql.matchAll(/alter\s+table\s+public\.(\w+)/gi)].map((m) => m[1]).sort()).toEqual(["helper_services", "service_requests", "service_subitems"].sort());
    expect(sql).toMatch(/on conflict \(service_code, subitem_code\) do nothing/);
    expect(sql).not.toMatch(/base_price|helper_service_prices|insert into public\.helper_/i);
  });
});
