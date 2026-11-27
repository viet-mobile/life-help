import re

file_path = "components/standards/KoreanStandardsView.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Update Hero section to render secondary language title & subtitle when showBilingual is active
old_hero_title = """          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {uiP.title}
            </h1>
            {primaryLang !== "ko" && (
              <div className="text-sm sm:text-lg font-bold text-indigo-200/90 mt-1">
                한국어 표준어 규정 전체
              </div>
            )}
          </div>
          <div className="space-y-1 max-w-3xl">
            <p className="text-sm sm:text-base text-indigo-100/95 leading-relaxed">
              {uiP.subtitle}
            </p>
            {primaryLang !== "ko" && (
              <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed font-light">
                {UI_TEXTS.ko.subtitle}
              </p>
            )}
          </div>"""

new_hero_title = """          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {uiP.title}
            </h1>
            {showBilingual && uiS && uiS.title !== uiP.title ? (
              <div className="text-base sm:text-xl font-bold text-indigo-200/95 mt-1">
                {uiS.title}
              </div>
            ) : primaryLang !== "ko" ? (
              <div className="text-sm sm:text-lg font-bold text-indigo-200/90 mt-1">
                한국어 표준어 규정 전체
              </div>
            ) : null}
          </div>
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-sm sm:text-base text-indigo-100/95 leading-relaxed">
              {uiP.subtitle}
            </p>
            {showBilingual && uiS && uiS.subtitle !== uiP.subtitle ? (
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed font-normal">
                {uiS.subtitle}
              </p>
            ) : primaryLang !== "ko" ? (
              <p className="text-xs sm:text-sm text-indigo-200/80 leading-relaxed font-light">
                {UI_TEXTS.ko.subtitle}
              </p>
            ) : null}
          </div>"""

assert old_hero_title in code, "old_hero_title target not found"
code = code.replace(old_hero_title, new_hero_title)

# 2. Update Part Tabs to show secondary bilingual labels when showBilingual is active
old_part_tabs = """          <div className="md:col-span-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              {uiP.allArticles}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(1); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === 1 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              {uiP.part1Tab}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(2); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === 2 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              {uiP.part2Tab}
            </button>
          </div>"""

new_part_tabs = """          <div className="md:col-span-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiP.allArticles}</div>
              {showBilingual && uiS && uiS.allArticles !== uiP.allArticles && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiS.allArticles}</div>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(1); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === 1 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiP.part1Tab}</div>
              {showBilingual && uiS && uiS.part1Tab !== uiP.part1Tab && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiS.part1Tab}</div>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(2); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === 2 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiP.part2Tab}</div>
              {showBilingual && uiS && uiS.part2Tab !== uiP.part2Tab && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiS.part2Tab}</div>
              )}
            </button>
          </div>"""

assert old_part_tabs in code, "old_part_tabs target not found"
code = code.replace(old_part_tabs, new_part_tabs)

# 3. Update Article Header Badges to show bilingual secondary translation
old_article_badges = """                        {/* Part Badge */}
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                          isPart1
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          {pTrans?.part || (isPart1 ? "제1부 사정 원칙" : "제2부 표준 발음법")}
                        </span>

                        {/* Chapter / Section Badge */}
                        {pTrans?.chapter && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                            {pTrans.chapter}
                          </span>
                        )}
                        {pTrans?.section && (
                          <span className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-normal border border-slate-200 dark:border-slate-700">
                            {pTrans.section}
                          </span>
                        )}
                      </div>

                      {/* Article ID */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {pTrans?.title || `제${art.articleNum}항`}
                        </span>
                      </div>"""

new_article_badges = """                        {/* Part Badge with Bilingual Support */}
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                          isPart1
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          <span>{pTrans?.part || (isPart1 ? "제1부 사정 원칙" : "제2부 표준 발음법")}</span>
                          {showBilingual && sTrans?.part && sTrans.part !== pTrans?.part && (
                            <span className="opacity-75 font-normal text-[11px]">· {sTrans.part}</span>
                          )}
                        </div>

                        {/* Chapter Badge with Bilingual Support */}
                        {pTrans?.chapter && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                            <span>{pTrans.chapter}</span>
                            {showBilingual && sTrans?.chapter && sTrans.chapter !== pTrans.chapter && (
                              <span className="opacity-75 font-normal text-[11px] text-slate-500">· {sTrans.chapter}</span>
                            )}
                          </div>
                        )}

                        {/* Section Badge with Bilingual Support */}
                        {pTrans?.section && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-normal border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                            <span>{pTrans.section}</span>
                            {showBilingual && sTrans?.section && sTrans.section !== pTrans.section && (
                              <span className="opacity-75 font-normal text-[11px] text-slate-400">· {sTrans.section}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Article ID with Bilingual Support */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {pTrans?.title || `제${art.articleNum}항`}
                        </span>
                        {showBilingual && sTrans?.title && sTrans.title !== pTrans?.title && (
                          <span className="text-[11px] font-mono text-indigo-500/80 dark:text-indigo-300/80 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                            {sTrans.title}
                          </span>
                        )}
                      </div>"""

assert old_article_badges in code, "old_article_badges target not found"
code = code.replace(old_article_badges, new_article_badges)

# 4. In RenderExampleText, translate content to secondary language when showBilingual is active
old_render_example_text = """/** Render formatted explanatory callout */
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

new_render_example_text = """/** Render formatted explanatory callout with bilingual translation support */
function RenderExampleText({
  text,
  showBilingual,
  secondaryLang,
  noteTranslations
}: {
  text: ExampleTextBlock;
  showBilingual?: boolean;
  secondaryLang?: AnchorLanguage;
  noteTranslations?: Record<string, Record<string, string>>;
}) {
  const trimmed = text.content?.trim() || "";
  if (/^\\(\\d+\\)$/.test(trimmed)) {
    return null;
  }

  const sNoteTrans = (showBilingual && secondaryLang && noteTranslations) ? noteTranslations[trimmed]?.[secondaryLang] : null;

  return (
    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5 leading-relaxed">
      <div className="text-xs sm:text-sm font-medium text-indigo-950 dark:text-indigo-200">
        {text.content}
      </div>
      {sNoteTrans && sNoteTrans !== text.content && (
        <div className="text-xs text-indigo-700 dark:text-indigo-300 font-normal pt-1 border-t border-indigo-100/70 dark:border-indigo-900/50">
          {sNoteTrans}
        </div>
      )}
    </div>
  );
}"""

assert old_render_example_text in code, "old_render_example_text target not found"
code = code.replace(old_render_example_text, new_render_example_text)

# Also pass props to RenderExampleText in mapping
old_render_call = """                            if (block.type === "text") {
                              return <RenderExampleText key={idx} text={block} />;
                            }"""

new_render_call = """                            if (block.type === "text") {
                              return (
                                <RenderExampleText
                                  key={idx}
                                  text={block}
                                  showBilingual={showBilingual}
                                  secondaryLang={secondaryLang}
                                  noteTranslations={noteTranslations}
                                />
                              );
                            }"""

assert old_render_call in code, "old_render_call target not found"
code = code.replace(old_render_call, new_render_call)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Enhanced KoreanStandardsView.tsx with 100% comprehensive bilingual coverage across all headers, tabs, badges, and calls!")
