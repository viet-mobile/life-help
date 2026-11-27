import re

file_path = "components/standards/KoreanStandardsView.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update RenderExampleText to hide standalone (1), (2), (3) etc.
old_render_text = """/** Render formatted explanatory callout */
function RenderExampleText({ text }: { text: ExampleTextBlock }) {
  return (
    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200 leading-relaxed">
      {text.content}
    </div>
  );
}"""

new_render_text = """/** Render formatted explanatory callout */
function RenderExampleText({ text }: { text: ExampleTextBlock }) {
  const trimmed = text.content?.trim() || "";
  // Delete redundant standalone index markers like '(1)', '(2)', '(3)'
  if (/^\\(\\d+\\)$/.test(trimmed)) {
    return null;
  }
  return (
    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
      {text.content}
    </div>
  );
}"""

assert old_render_text in content, "RenderExampleText target not found"
content = content.replace(old_render_text, new_render_text)

# 2. Update RenderExampleList typography: make pronunciation badges and words bigger and bold
old_render_list = """function RenderExampleList({ list }: { list: ExampleListBlock }) {
  return (
    <div className="space-y-2">
      {list.title && (
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {list.title}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {list.items.map((item, idx) => {
          const match = item.match(/^([^\[\]]+)(\[[^\[\]]+\])(.*)$/);
          if (match) {
            const [, word, pron, rest] = match;
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs"
              >
                <span className="font-bold text-slate-900 dark:text-slate-100">{word.trim()}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-[11px] border border-indigo-200/60 dark:border-indigo-800/60">
                  {pron}
                </span>
                {rest && <span className="text-[10px] text-slate-400">{rest}</span>}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold text-slate-800 dark:text-slate-200"
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}"""

new_render_list = """function RenderExampleList({ list }: { list: ExampleListBlock }) {
  return (
    <div className="space-y-2.5">
      {list.title && (
        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {list.title}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {list.items.map((item, idx) => {
          const match = item.match(/^([^\[\]]+)(\[[^\[\]]+\])(.*)$/);
          if (match) {
            const [, word, pron, rest] = match;
            return (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs transition hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-50 tracking-tight">{word.trim()}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-xs sm:text-sm border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                  {pron}
                </span>
                {rest && <span className="text-[11px] text-slate-400">{rest}</span>}
              </div>
            );
          }
          return (
            <div
              key={idx}
              className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100"
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}"""

assert old_render_list in content, "RenderExampleList target not found"
content = content.replace(old_render_list, new_render_list)

# 3. Add helper function to split commentary into clean readable paragraphs
helper_func = """/** Split long commentary into reader-friendly semantic paragraphs */
function splitCommentaryParagraphs(text: string): string[] {
  if (!text) return [];
  // Split on logical numbering, bullet points, and key transition phrases
  const rawParts = text.split(/(?=(?:[1-9]\\.|\\b[①-⑨]|첫째|둘째|셋째|넷째|다만|이 외에도|그뿐만 아니라|\\(가\\)|\\(나\\)|\\(다\\)|\\(라\\)))/g);
  const result: string[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [text];
}
"""

if "function splitCommentaryParagraphs" not in content:
  content = helper_func + "\n" + content

# 4. Update Explanation Section markup to remove duplicate 💡 and render readable paragraphs with text-base sm:text-lg font-normal
old_explanation_block = """                    {/* Explanation Section (Full Commentary, No ugly tag badges) */}
                    {(pTrans?.explanation || (sTrans && sTrans.explanation)) && (
                      <div className="space-y-2.5 pt-1">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          <span>💡</span>
                          <span>{uiP.explanationTitle}</span>
                        </div>
                        <div className="space-y-3">
                          {pTrans?.explanation && (
                            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                              <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                                {pTrans.explanation}
                              </p>
                            </div>
                          )}
                          {sTrans && sTrans.explanation && sTrans.explanation !== pTrans.explanation && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {sTrans.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}"""

new_explanation_block = """                    {/* Explanation Section (Full Commentary with Paragraph Splits & High Readability Typography) */}
                    {(pTrans?.explanation || (sTrans && sTrans.explanation)) && (
                      <div className="space-y-3 pt-1">
                        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span>{uiP.explanationTitle}</span>
                        </div>
                        <div className="space-y-3.5">
                          {pTrans?.explanation && (
                            <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                              {splitCommentaryParagraphs(pTrans.explanation).map((para, pIdx) => (
                                <p key={pIdx} className="text-base sm:text-lg font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                                  {para}
                                </p>
                              ))}
                            </div>
                          )}
                          {sTrans && sTrans.explanation && sTrans.explanation !== pTrans.explanation && (
                            <div className="bg-slate-50/90 dark:bg-slate-800/50 p-4.5 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 space-y-2.5">
                              {splitCommentaryParagraphs(sTrans.explanation).map((para, pIdx) => (
                                <p key={pIdx} className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {para}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}"""

assert old_explanation_block in content, "Explanation Section target not found"
content = content.replace(old_explanation_block, new_explanation_block)

# 5. Remove duplicate 📋 in Examples header
old_examples_header = """                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>📋</span>
                        <span>{uiP.examplesTitle}</span>
                      </div>"""

new_examples_header = """                      <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>{uiP.examplesTitle}</span>
                      </div>"""

assert old_examples_header in content, "Examples header target not found"
content = content.replace(old_examples_header, new_examples_header)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated KoreanStandardsView.tsx successfully!")
