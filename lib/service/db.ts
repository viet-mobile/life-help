/**
 * The only door to service data: named-argument calls of the svc_* database functions (supabase-js `.rpc` in production, the same SQL
 * on an embedded Postgres for local runs / tests). There is no other implementation of the rules.
 */
export interface ServiceDb {
  rpc<T = unknown>(fn: string, args: Record<string, unknown>): Promise<T>;
}
