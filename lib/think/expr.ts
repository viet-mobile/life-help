/**
 * A tiny, safe expression language for verifying student-built examples (no eval, no Function). Numbers, variables, + - * / % ^,
 * comparisons (== != < <= > >=), && || !, parentheses, and a few functions: abs min max floor ceil round gcd lcm sqrt isPrime digitsum.
 * Division by zero, unknown names and malformed input throw ExprError; the caller shows that as "cannot evaluate", never as a pass.
 */
export class ExprError extends Error {}
type Tok = { t: "num" | "id" | "op" | "("  | ")" | ","; v: string };

function lex(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_][A-Za-z_0-9]*)|(==|!=|<=|>=|&&|\|\||[-+*/%^<>!(),]))/y;
  let i = 0;
  while (i < src.length) {
    re.lastIndex = i;
    const m = re.exec(src);
    if (!m) { if (/^\s*$/.test(src.slice(i))) break; throw new ExprError(`unexpected character at ${i}`); }
    i = re.lastIndex;
    if (m[1] !== undefined) out.push({ t: "num", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "id", v: m[2] });
    else out.push({ t: (m[3] === "(" ? "(" : m[3] === ")" ? ")" : m[3] === "," ? "," : "op") as Tok["t"], v: m[3] });
  }
  return out;
}

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const FN: Record<string, (...a: number[]) => number> = {
  abs: Math.abs, min: Math.min, max: Math.max, floor: Math.floor, ceil: Math.ceil, round: Math.round, sqrt: Math.sqrt,
  gcd: (a, b) => gcd(a, b), lcm: (a, b) => (a === 0 || b === 0 ? 0 : Math.abs(a * b) / gcd(a, b)),
  isPrime: (n) => { if (!Number.isInteger(n) || n < 2) return 0; for (let d = 2; d * d <= n; d++) if (n % d === 0) return 0; return 1; },
  digitsum: (n) => String(Math.abs(Math.trunc(n))).split("").reduce((s, c) => s + Number(c), 0),
};

export function evalExpr(src: string, vars: Record<string, number>): number {
  const toks = lex(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => { const t = toks[p]; if (!t || (v !== undefined && t.v !== v)) throw new ExprError(`expected ${v ?? "token"}`); p++; return t; };
  const isOp = (...ops: string[]) => peek()?.t === "op" && ops.includes(peek()!.v);
  const or = (): number => { let l = and(); while (isOp("||")) { eat(); const r = and(); l = l || r ? 1 : 0; } return l; };
  const and = (): number => { let l = cmp(); while (isOp("&&")) { eat(); const r = cmp(); l = l && r ? 1 : 0; } return l; };
  const cmp = (): number => {
    let l = add();
    while (isOp("==", "!=", "<", "<=", ">", ">=")) {
      const op = eat().v; const r = add();
      l = (op === "==" ? Math.abs(l - r) < 1e-9 : op === "!=" ? Math.abs(l - r) >= 1e-9 : op === "<" ? l < r - 1e-12 : op === "<=" ? l <= r + 1e-9 : op === ">" ? l > r + 1e-12 : l >= r - 1e-9) ? 1 : 0;
    }
    return l;
  };
  const add = (): number => { let l = mul(); while (isOp("+", "-")) { const op = eat().v; const r = mul(); l = op === "+" ? l + r : l - r; } return l; };
  const mul = (): number => {
    let l = unary();
    while (isOp("*", "/", "%")) {
      const op = eat().v; const r = unary();
      if ((op === "/" || op === "%") && r === 0) throw new ExprError("division by zero");
      l = op === "*" ? l * r : op === "/" ? l / r : l % r;
    }
    return l;
  };
  const pow = (): number => { const b = atom(); if (isOp("^")) { eat(); const e = unary(); return Math.pow(b, e); } return b; }; // right-associative, binds tighter than unary minus: -2^2 = -4
  const unary = (): number => { if (isOp("-")) { eat(); return -unary(); } if (isOp("!")) { eat(); return unary() ? 0 : 1; } return pow(); };
  const atom = (): number => {
    const t = peek();
    if (!t) throw new ExprError("unexpected end");
    if (t.t === "num") { eat(); return Number(t.v); }
    if (t.t === "(") { eat(); const v = or(); eat(")"); return v; }
    if (t.t === "id") {
      eat();
      if (peek()?.t === "(") {
        const f = FN[t.v]; if (!f) throw new ExprError(`unknown function ${t.v}`);
        eat("("); const args: number[] = [];
        if (peek()?.t !== ")") { args.push(or()); while (peek()?.t === ",") { eat(","); args.push(or()); } }
        eat(")");
        return f(...args);
      }
      if (!(t.v in vars)) throw new ExprError(`unknown name ${t.v}`);
      return vars[t.v];
    }
    throw new ExprError(`unexpected ${t.v}`);
  };
  const v = or();
  if (p !== toks.length) throw new ExprError("trailing input");
  if (!Number.isFinite(v)) throw new ExprError("not a finite number");
  return v;
}
