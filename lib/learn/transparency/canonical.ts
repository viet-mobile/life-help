/**
 * Canonical serialization for everything that is hashed or signed.
 *
 * A subset of RFC 8785 (JSON Canonicalization Scheme): object keys sorted by UTF-16 code unit, no insignificant whitespace, strings and
 * numbers serialised exactly as JSON.stringify does. Anything with no canonical form is REJECTED instead of being guessed:
 * undefined, functions, symbols, bigint, NaN / Infinity, Date and other class instances, sparse arrays, cycles.
 * Use integers (or strings) for money, scores and timestamps: floats are accepted only because JSON.stringify prints them deterministically.
 */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export function canonicalize(value: unknown): string {
  const seen = new Set<object>();
  const walk = (v: unknown, path: string): string => {
    if (v === null) return "null";
    switch (typeof v) {
      case "boolean": return v ? "true" : "false";
      case "string": return JSON.stringify(v);
      case "number":
        if (!Number.isFinite(v)) throw new Error(`canonicalize: non-finite number at ${path}`);
        return Object.is(v, -0) ? "0" : JSON.stringify(v);
      case "object": {
        if (seen.has(v)) throw new Error(`canonicalize: cycle at ${path}`);
        seen.add(v);
        let out: string;
        if (Array.isArray(v)) {
          const parts: string[] = [];
          for (let i = 0; i < v.length; i++) { if (!(i in v)) throw new Error(`canonicalize: sparse array at ${path}`); parts.push(walk(v[i], `${path}[${i}]`)); }
          out = `[${parts.join(",")}]`;
        } else {
          const proto = Object.getPrototypeOf(v);
          if (proto !== Object.prototype && proto !== null) throw new Error(`canonicalize: non-plain object at ${path}`);
          const keys = Object.keys(v).sort();
          out = `{${keys.map((k) => `${JSON.stringify(k)}:${walk((v as Record<string, unknown>)[k], `${path}.${k}`)}`).join(",")}}`;
        }
        seen.delete(v);
        return out;
      }
      default: throw new Error(`canonicalize: unsupported ${typeof v} at ${path}`);
    }
  };
  return walk(value, "$");
}
