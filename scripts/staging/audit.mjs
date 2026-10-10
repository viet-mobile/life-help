/**
 * Append-only audit handling for the staging run (svc_audit).
 * svc_audit is append-only BY CONSTRUCTION (migration 040/041): an identity primary key, no foreign key (cascades cannot reach it), RLS forced
 * with no API role privileges, and the only statements touching it anywhere in the SQL are INSERTs from the wrapper functions. So a run
 * legitimately GROWS it, and exact row-count equality is the wrong invariant. The right one:
 *   - every audit row that existed before the run is still there, byte-for-byte unchanged (nothing deleted, nothing updated)
 *   - every row added during the run is attributable to an entity of THIS run (entity 'request' / 'helper' with that id)
 * Nothing in this module ever deletes or updates an audit row.
 */
import { createHash } from "node:crypto";

const COLUMNS = "id,actor_kind,actor_id,action,entity,entity_id,metadata,created_at";
export const rowHash = (r) => createHash("sha256").update(JSON.stringify([r.id, r.actor_kind, r.actor_id, r.action, r.entity, r.entity_id, r.metadata, r.created_at])).digest("hex");

/** Reads every audit row (paged by id). `get(pathAndQuery, rangeHeader)` returns a fetch Response. Throws a plain Error on any bad response. */
export async function readAuditRows(get, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const r = await get(`svc_audit?select=${COLUMNS}&order=id.asc`, `${from}-${from + pageSize - 1}`);
    if (r.status === 401 || r.status === 403) { const e = new Error(`REST ${r.status} reading svc_audit`); e.auth = true; throw e; }
    if (r.status !== 200 && r.status !== 206) throw new Error(`REST ${r.status} reading svc_audit`);
    const page = await r.json().catch(() => null);
    if (!Array.isArray(page)) throw new Error("svc_audit: unexpected non-array response");
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}
export const auditBaseline = (rows) => ({ count: rows.length, maxId: rows.reduce((m, r) => Math.max(m, Number(r.id)), 0), rows: Object.fromEntries(rows.map((r) => [String(r.id), rowHash(r)])) });

/**
 * Pure comparison. `baseline` = auditBaseline() from before the run, `now` = rows after, `runIds` = ids of requests/helpers of this run.
 * preserved: no baseline row missing or modified. added rows are attributed when they describe a request/helper of this run.
 */
export function compareAudit(baseline, now, runIds) {
  const byId = new Map(now.map((r) => [String(r.id), r]));
  const missing = [], modified = [];
  for (const [id, h] of Object.entries(baseline.rows)) {
    const cur = byId.get(id);
    if (!cur) missing.push(id);
    else if (rowHash(cur) !== h) modified.push(id);
  }
  const added = now.filter((r) => !(String(r.id) in baseline.rows));
  const ids = new Set(runIds);
  const attributed = added.filter((r) => (r.entity === "request" || r.entity === "helper") && ids.has(String(r.entity_id)));
  const unattributed = added.filter((r) => !attributed.includes(r));
  return { preserved: missing.length === 0 && modified.length === 0, missing, modified, baselineRows: Object.keys(baseline.rows).length, newRows: added.length, attributed: attributed.length, unattributed: unattributed.map((r) => ({ id: r.id, action: r.action, entity: r.entity })) };
}
