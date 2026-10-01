import { describe, expect, it } from "vitest";
import { LEARN_MIGRATIONS, MIGRATIONS, SUPABASE_STUB, createChainDb, demoSeed, sqlOf } from "./chainDb";
import { PGlite } from "@electric-sql/pglite";

/**
 * The learning migrations are ADDITIVE on top of the latest LIFE.HELP chain. They must come after every
 * marketplace / payment / audit migration, never repeat the initial marketplace migrations, and never
 * weaken the existing authority model. All local (PGlite); nothing here touches a remote database.
 */
describe("learning migrations on the real LIFE.HELP chain", { timeout: 120_000 }, () => {
  it("sequence: the learning migrations are last, once each, and 0001/0002 are not duplicated", () => {
    expect(LEARN_MIGRATIONS).toEqual(["202609300024_learning_platform.sql", "202609300025_learning_content_rpc.sql"]);
    expect(MIGRATIONS.slice(-2)).toEqual(LEARN_MIGRATIONS);
    expect(new Set(MIGRATIONS).size).toBe(MIGRATIONS.length);
    expect(MIGRATIONS.filter((f) => /initial_marketplace_schema|payment_settlement_upgrade/.test(f))).toHaveLength(2);
  });

  it("existing migrations are untouched: no learning file alters, drops or rewrites a non-learn object", () => {
    for (const f of LEARN_MIGRATIONS) {
      const sql = sqlOf(f).replace(/--.*$/gm, "");
      expect(sql).not.toMatch(/\bdrop\s+(table|type|function|policy|trigger)\b(?![^;]*learn_)/i);
      for (const m of sql.matchAll(/\balter\s+table\s+(?:if exists\s+)?(?:public\.)?([\w%]+)/gi)) expect(m[1]).toMatch(/^(learn_|%I$)/);
      for (const m of sql.matchAll(/\bcreate\s+table\s+(?:if not exists\s+)?(?:public\.)?([\w%]+)/gi)) expect(m[1]).toMatch(/^(learn_|%I$)/);
    }
  });

  it("the learning migration alone does NOT apply on an empty project (it needs the marketplace roles/has_role)", async () => {
    const db = new PGlite();
    await db.exec(SUPABASE_STUB);
    await expect(db.exec(sqlOf(LEARN_MIGRATIONS[0]))).rejects.toThrow(/security|has_role|app_role/);
    await db.close();
  });

  it("applies cleanly after the full chain and creates exactly the 24 learn_* tables", async () => {
    const db = await createChainDb();
    const n = await db.query<{ n: string }>("select count(*)::text n from pg_tables where schemaname='public' and tablename like 'learn\_%'");
    expect(Number(n.rows[0].n)).toBe(24);
    await db.close();
  });

  it("marketplace authority is unchanged by the learning migrations (grants identical with and without them)", async () => {
    const snapshot = async (db: PGlite) =>
      (await db.query<{ g: string }>(
        `select grantee || ':' || table_name || ':' || privilege_type as g from information_schema.role_table_grants
         where table_schema = 'public' and table_name not like 'learn\_%' and grantee in ('anon','authenticated','service_role') order by 1`,
      )).rows.map((r) => r.g);
    const before = await createChainDb({ until: LEARN_MIGRATIONS[0] });
    const after = await createChainDb();
    expect(await snapshot(after)).toEqual(await snapshot(before));
    const pol = async (db: PGlite) => (await db.query<{ p: string }>("select tablename || ':' || policyname as p from pg_policies where schemaname = 'public' and tablename not like 'learn\_%' order by 1")).rows.map((r) => r.p);
    expect(await pol(after)).toEqual(await pol(before));
    await before.close();
    await after.close();
  });

  it("the app role cannot rewrite XP / attempt / mastery history directly (RPC only)", async () => {
    const db = await createChainDb();
    const grants = (
      await db.query<{ t: string; i: boolean; u: boolean; d: boolean; s: boolean }>(
        `select t, has_table_privilege('service_role', 'public.' || t, 'INSERT') i, has_table_privilege('service_role', 'public.' || t, 'UPDATE') u,
                has_table_privilege('service_role', 'public.' || t, 'DELETE') d, has_table_privilege('service_role', 'public.' || t, 'SELECT') s
         from unnest(array['learn_xp_ledger','learn_attempts','learn_skill_mastery','learn_lesson_progress','learn_streaks','learn_daily_quests','learn_student_achievements','learn_progress_meta']) t`,
      )
    ).rows;
    for (const g of grants) expect(g, g.t).toMatchObject({ i: false, u: false, d: false, s: true });
    const seq = await db.query<{ ok: boolean }>("select has_sequence_privilege('service_role', 'public.learn_xp_ledger_id_seq', 'USAGE') ok");
    expect(seq.rows[0].ok).toBe(false);
    await db.close();
  });

  it("the demo seed is refused without the explicit local opt-in", async () => {
    const db = await createChainDb();
    await expect(db.exec(demoSeed())).rejects.toThrow(/demo seed refused/);
    await db.close();
  });
});
