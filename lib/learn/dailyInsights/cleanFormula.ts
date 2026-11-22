/**
 * cleanFormula.ts
 * Sanitizes raw LaTeX formula strings ($...$, \mathrm, \frac, etc.)
 * into human-readable Unicode mathematical & chemical notations.
 */

const SUB_MAP: Record<string, string> = {
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ",
  "o": "ₒ", "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ", "x": "ₓ"
};

const SUP_MAP: Record<string, string> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾"
};

export function cleanLatexFormula(raw: string): string {
  let s = raw.trim();
  if (s.startsWith("$") && s.endsWith("$")) {
    s = s.slice(1, -1).trim();
  }

  // Handle c-327 or bacteria doubling formula
  if (s.includes("N_0") && (s.includes("2^{t") || s.includes("2^{t/t"))) {
    return "N = N₀ × 2^(t/td) (일정 시간마다 2배씩 기하급수적 증식)";
  }
  if (s === "2^{18}") {
    return "2¹⁸(약 26만 배)";
  }

  // Degrees Celsius
  s = s.replace(/\^\{?\\circ\}?\s*(?:\\mathrm\{C\}|C)?/g, "°C");
  s = s.replace(/\\circ/g, "°");

  // Arrows & Operators
  s = s.replace(/\\xrightarrow\[([^\]]*)\]\{([^}]*)\}/g, "―($2)→");
  s = s.replace(/\\xrightarrow\{([^}]*)\}/g, "―($1)→");
  s = s.replace(/\\to|\\rightarrow|\\longrightarrow/g, " → ");
  s = s.replace(/\\rightleftharpoons/g, " ⇌ ");
  s = s.replace(/\\uparrow/g, "↑");
  s = s.replace(/\\downarrow/g, "↓");
  s = s.replace(/\\times/g, " × ");
  s = s.replace(/\\approx/g, " ≈ ");
  s = s.replace(/\\cdot/g, " · ");
  s = s.replace(/\\pm/g, " ± ");
  s = s.replace(/\\le(?:q)?/g, " ≤ ");
  s = s.replace(/\\ge(?:q)?/g, " ≥ ");
  s = s.replace(/\\propto/g, " ∝ ");

  // Greek letters
  s = s.replace(/\\Delta/g, "Δ");
  s = s.replace(/\\delta/g, "δ");
  s = s.replace(/\\lambda/g, "λ");
  s = s.replace(/\\mu/g, "µ");
  s = s.replace(/\\eta/g, "η");
  s = s.replace(/\\theta/g, "θ");
  s = s.replace(/\\rho/g, "ρ");
  s = s.replace(/\\pi/g, "π");
  s = s.replace(/\\gamma/g, "γ");
  s = s.replace(/\\alpha/g, "α");
  s = s.replace(/\\beta/g, "β");
  s = s.replace(/\\tau/g, "τ");
  s = s.replace(/\\sigma/g, "σ");
  s = s.replace(/\\omega/g, "ω");
  s = s.replace(/\\Omega/g, "Ω");
  s = s.replace(/\\phi|\\Phi/g, "Φ");
  s = s.replace(/\\varepsilon|\\epsilon/g, "ε");

  // Fractions: \frac{A}{B} or \dfrac{A}{B}
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1 / $2)");
    if (next === s) break;
    s = next;
  }

  // Square roots
  s = s.replace(/\\sqrt\{([^{}]*)\}/g, "√($1)");

  // Text unwrap
  for (let i = 0; i < 5; i++) {
    const next = s.replace(/\\(?:text|mathrm|mathbf|mathit)\s*\{([^{}]*)\}/g, "$1");
    if (next === s) break;
    s = next;
  }

  // Subscripts
  for (let i = 0; i < 3; i++) {
    s = s.replace(/_\{([^{}]+)\}/g, (_, inner) => {
      let res = "";
      for (const ch of inner) {
        res += SUB_MAP[ch] || ch;
      }
      return res;
    });
  }
  s = s.replace(/_([0-9])/g, (_, ch) => SUB_MAP[ch] || ch);

  // Superscripts
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\^\{([^{}]+)\}/g, (_, inner) => {
      if (inner === "+") return "⁺";
      if (inner === "-") return "⁻";
      if (inner.endsWith("+") || inner.endsWith("-")) {
        const sign = inner.endsWith("+") ? "⁺" : "⁻";
        const num = inner.slice(0, -1);
        let res = "";
        for (const ch of num) res += SUP_MAP[ch] || ch;
        return res + sign;
      }
      let res = "";
      for (const ch of inner) res += SUP_MAP[ch] || ch;
      return res;
    });
  }
  s = s.replace(/\^([0-9])/g, (_, ch) => SUP_MAP[ch] || ch);
  s = s.replace(/\^\+/g, "⁺");
  s = s.replace(/\^\-/g, "⁻");

  // Cleanup
  s = s.replace(/\\(?:left|right|quad|qquad)/g, "");
  s = s.replace(/\\,/g, " ");
  s = s.replace(/\\ /g, " ");
  s = s.replace(/\\\{/g, "{");
  s = s.replace(/\\\}/g, "}");
  s = s.replace(/\\[a-zA-Z]+/g, "");
  s = s.replace(/\\/g, "");
  s = s.replace(/[{}]/g, "");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Replaces any $...$ LaTeX snippet in text with clean Unicode representation.
 */
export function cleanFormulaText(text: string): string {
  if (!text || typeof text !== "string") return text;
  return text.replace(/\$([^$]+)\$/g, (_, raw) => cleanLatexFormula(raw));
}
