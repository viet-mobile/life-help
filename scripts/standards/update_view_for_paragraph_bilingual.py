import re

file_path = "components/standards/KoreanStandardsView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update splitCommentaryParagraphs
old_split_func = """/** Split long commentary into reader-friendly semantic paragraphs */
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
}"""

new_split_func = """/** Split commentary into reader-friendly semantic paragraphs based on strict orthographic & punctuation rules */
function splitCommentaryParagraphs(text: string): string[] {
  if (!text) return [];
  const t = text.trim();

  // Strict user criteria:
  // - 1. 2. 3.
  // - [①-⑳]
  // - [붙임], [붙임 1], [붙임 2]
  // - (1) (2) (3) followed by space/end (NEVER '(1)에서와 같이')
  // - 첫째, 둘째, 셋째, 넷째 (strictly followed by comma!)
  // - 반면, 따라서, 그러나, 다만 (preceded by punctuation or start)
  const pattern = /(?=\\b[1-9]\\.\\s+|[①-⑳]|\\[붙임(?:\\s*\\d+)?\\]|\\(\\d+\\)(?=\\s|$)|(?<=[.!?]\\s)(?:첫째,\\s*|둘째,\\s*|셋째,\\s*|넷째,\\s*)|^(?:첫째,\\s*|둘째,\\s*|셋째,\\s*|넷째,\\s*)|(?<=[.!?]\\s)(?:반면|따라서|그러나|다만)\\b|^(?:반면|따라서|그러나|다만)\\b|(?<=[.!?]\\s)(?:더\\s*알아보기|이\\s*외에도|그뿐만\\s*아니라))/g;

  const rawParts = t.split(pattern);
  const result: string[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [t];
}"""

assert old_split_func in code, "old_split_func target not found"
code = code.replace(old_split_func, new_split_func)

# 2. Add cachedParagraphs
old_cache_lines = """let cachedArticles: StandardArticle[] | null = null;
let cachedMeanings: Record<string, Record<string, string>> | null = null;
let cachedNotes: Record<string, Record<string, string>> | null = null;"""

new_cache_lines = """let cachedArticles: StandardArticle[] | null = null;
let cachedMeanings: Record<string, Record<string, string>> | null = null;
let cachedNotes: Record<string, Record<string, string>> | null = null;
let cachedParagraphs: Record<string, Array<Record<string, string>>> | null = null;"""

assert old_cache_lines in code, "cache lines target not found"
code = code.replace(old_cache_lines, new_cache_lines)

# 3. Add state in KoreanStandardsView
old_state_lines = """  const [articles, setArticles] = useState<StandardArticle[]>(() => cachedArticles || []);
  const [wordMeanings, setWordMeanings] = useState<Record<string, Record<string, string>>>(() => cachedMeanings || {});
  const [noteTranslations, setNoteTranslations] = useState<Record<string, Record<string, string>>>(() => cachedNotes || {});
  const [loading, setLoading] = useState<boolean>(!cachedArticles);"""

new_state_lines = """  const [articles, setArticles] = useState<StandardArticle[]>(() => cachedArticles || []);
  const [wordMeanings, setWordMeanings] = useState<Record<string, Record<string, string>>>(() => cachedMeanings || {});
  const [noteTranslations, setNoteTranslations] = useState<Record<string, Record<string, string>>>(() => cachedNotes || {});
  const [commentaryParagraphs, setCommentaryParagraphs] = useState<Record<string, Array<Record<string, string>>>>(() => cachedParagraphs || {});
  const [loading, setLoading] = useState<boolean>(!cachedArticles);"""

assert old_state_lines in code, "state lines target not found"
code = code.replace(old_state_lines, new_state_lines)

# 4. Fetch commentary_paragraphs.json
old_fetch_block = """        if (!cachedNotes) {
          const nRes = await fetch("/standards/note_translations.json");
          if (nRes.ok) {
            const nData = await nRes.json();
            cachedNotes = nData;
            if (active) setNoteTranslations(nData);
          }
        } else if (active) {
          setNoteTranslations(cachedNotes);
        }
      } catch (err) {
        console.error("Failed to load standards assets:", err);"""

new_fetch_block = """        if (!cachedNotes) {
          const nRes = await fetch("/standards/note_translations.json");
          if (nRes.ok) {
            const nData = await nRes.json();
            cachedNotes = nData;
            if (active) setNoteTranslations(nData);
          }
        } else if (active) {
          setNoteTranslations(cachedNotes);
        }

        if (!cachedParagraphs) {
          const pRes = await fetch("/standards/commentary_paragraphs.json");
          if (pRes.ok) {
            const pData = await pRes.json();
            cachedParagraphs = pData;
            if (active) setCommentaryParagraphs(pData);
          }
        } else if (active) {
          setCommentaryParagraphs(cachedParagraphs);
        }
      } catch (err) {
        console.error("Failed to load standards assets:", err);"""

assert old_fetch_block in code, "fetch block target not found"
code = code.replace(old_fetch_block, new_fetch_block)

# 5. Render explanation paragraph-by-paragraph with bilingual toggle
old_explanation_render = """                    {/* Explanation Section (Full Commentary with Paragraph Splits & High Readability Typography) */}
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

new_explanation_render = """                    {/* Explanation Section (Faithful Paragraph-by-Paragraph Alignment & Dual Bilingual Mode) */}
                    {(pTrans?.explanation || (sTrans && sTrans.explanation)) && (() => {
                      const parasList = commentaryParagraphs[art.id] || [];
                      const hasStructuredParas = parasList.length > 0;

                      return (
                        <div className="space-y-3 pt-1">
                          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>{uiP.explanationTitle}</span>
                            {showBilingual && (
                              <span className="text-[11px] font-normal text-slate-400">
                                {primaryLang !== "ko" ? "문단별 번역 및 한국어 병기 모드" : "문단별 표준 해설"}
                              </span>
                            )}
                          </div>

                          <div className="space-y-3.5">
                            {hasStructuredParas ? (
                              parasList.map((pObj, pIdx) => {
                                const primaryPara = pObj[primaryLang] || pObj.ko;
                                const secondaryPara = showBilingual ? (pObj[secondaryLang] || pObj.ko) : null;
                                const showKoRef = primaryLang !== "ko" && showBilingual;

                                return (
                                  <div
                                    key={pIdx}
                                    className="bg-amber-50/40 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs"
                                  >
                                    {/* Primary Translation Paragraph */}
                                    <p className="text-base sm:text-lg font-normal text-slate-800 dark:text-slate-100 leading-relaxed">
                                      {primaryPara}
                                    </p>

                                    {/* Bilingual Secondary Paragraph / Original Korean Grounding */}
                                    {showKoRef && pObj.ko && pObj.ko !== primaryPara && (
                                      <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                        <p className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed bg-white/70 dark:bg-slate-800/60 p-3 rounded-xl border border-amber-100 dark:border-slate-700/60">
                                          {pObj.ko}
                                        </p>
                                      </div>
                                    )}

                                    {/* Other Secondary Language if chosen */}
                                    {!showKoRef && showBilingual && secondaryPara && secondaryPara !== primaryPara && (
                                      <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                        <p className="text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                                          {secondaryPara}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback using splitCommentaryParagraphs
                              <div className="bg-amber-50/50 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-3">
                                {splitCommentaryParagraphs(pTrans?.explanation || "").map((para, pIdx) => (
                                  <p key={pIdx} className="text-base sm:text-lg font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                                    {para}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}"""

assert old_explanation_render in code, "explanation render target not found"
code = code.replace(old_explanation_render, new_explanation_render)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Updated KoreanStandardsView.tsx successfully for paragraph-level bilingual alignment!")
