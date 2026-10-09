// Finds user-visible string literals / JSX text with Korean or English natural language in app/, components/, lib/.
// Usage: node scripts/i18n/scan_hardcoded.mjs [--json]   (heuristic; classification lives in scripts/i18n/allowlist.json)
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const ROOTS = ["app", "components", "lib"];
const HANGUL = /[가-힣]/;
// two+ English words of 2+ letters, or one capitalized word followed by space+word: natural-language heuristic
const ENGLISH = /\b[A-Za-z][a-z]{1,}\b(?:[ ,'’-]+\b[A-Za-z][a-z]{1,}\b){1,}/;
const SKIP_CALLEE = /^(console\.\w+|require|import|t|tKo|translate|getRegionUIText|searchParams\.get|params\.get|new URL|fetch|setItem|getItem|removeItem|addEventListener|removeEventListener|dispatchEvent|querySelector\w*|getElementById|startsWith|endsWith|includes|split|replace|match|test|localeCompare|Error|TypeError|throw)$/;
const SKIP_ATTR = new Set(["className", "href", "src", "id", "key", "type", "name", "data-testid", "role", "rel", "target", "method", "action", "autoComplete", "inputMode", "pattern", "lang", "dir", "htmlFor", "viewBox", "d", "fill", "stroke", "xmlns", "as", "sizes", "media", "content", "property", "httpEquiv", "charSet"]);

// Technical shapes that are never UI copy: directives, CSS/Tailwind class lists, slugs/kebab ids, header names, locale codes
const DIRECTIVE = /^use (client|server)$/;
const CLASS_OR_ID_TOKEN = /^(?:[a-z0-9!@][a-z0-9:/\[\]\.%#_=()!@-]*|[a-z]{2,3}-[A-Z][a-z]+)$/;
const isTechnical = (t) => DIRECTIVE.test(t) || t.split(/\s+/).every((w) => CLASS_OR_ID_TOKEN.test(w) && /[-:/\[\]]|^[a-z]{2,3}$/.test(w));

const files = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.(tsx?|mts)$/.test(e.name) && !e.name.endsWith(".d.ts")) files.push(p); } };
ROOTS.forEach(walk);

const out = [];
for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const report = (node, text, kind) => {
    const t = text.replace(/\s+/g, " ").trim();
    if (!t || isTechnical(t)) return;
    const lang = HANGUL.test(t) ? "ko" : ENGLISH.test(t) ? "en" : null;
    if (!lang) return;
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    // name of the property / variable the literal is assigned to (lets the allowlist classify data fields by name)
    let p = node.parent, prop;
    while (p && !prop && (ts.isArrayLiteralExpression(p) || ts.isPropertyAssignment(p) || ts.isVariableDeclaration(p) || ts.isParenthesizedExpression(p) || ts.isConditionalExpression(p) || ts.isBinaryExpression(p))) {
      if ((ts.isPropertyAssignment(p) || ts.isVariableDeclaration(p)) && p.name) prop = p.name.getText(sf).replace(/["']/g, "");
      p = p.parent;
    }
    out.push({ file, line: line + 1, kind, lang, prop, text: t.slice(0, 160) });
  };
  const calleeName = (call) => call.expression.getText(sf).replace(/\s+/g, "");
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return;
    if (ts.isCallExpression(node) && SKIP_CALLEE.test(calleeName(node).split("(")[0]) && !/^(t|tKo|translate)$/.test(calleeName(node))) return;
    if (ts.isJsxAttribute(node) && SKIP_ATTR.has(node.name.getText(sf))) return;
    if (ts.isJsxText(node)) report(node, node.text, "jsx-text");
    else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      const p = node.parent;
      // object keys, t("key") arguments, switch-case labels and comparisons are identifiers, not UI text
      if (p && ts.isPropertyAssignment(p) && p.name === node) return;
      if (p && ts.isCallExpression(p) && /^(t|tKo|translate|formatBilingual)$/.test(calleeName(p)) && p.arguments[0] === node && calleeName(p) !== "formatBilingual") return;
      if (p && (ts.isCaseClause(p) || (ts.isBinaryExpression(p) && /^(===|!==|==|!=)$/.test(p.operatorToken.getText(sf))))) return;
      if (p && ts.isElementAccessExpression(p)) return;
      if (p && ts.isLiteralTypeNode(p)) return;
      report(node, node.text, "string");
    } else if (ts.isTemplateExpression(node)) {
      report(node, [node.head.text, ...node.templateSpans.map((s) => s.literal.text)].join(" "), "template");
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
}

if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(out, null, 1));
else {
  const byFile = {};
  for (const o of out) (byFile[o.file] ??= { ko: 0, en: 0 })[o.lang]++;
  for (const [f, c] of Object.entries(byFile).sort((a, b) => b[1].ko + b[1].en - a[1].ko - a[1].en)) console.log(String(c.ko).padStart(4), String(c.en).padStart(4), f);
  console.log("TOTAL", out.length);
}
