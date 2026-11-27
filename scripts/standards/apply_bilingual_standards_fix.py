# -*- coding: utf-8 -*-
import os, sys

target_file = 'life-help/components/standards/KoreanStandardsView.tsx'
with open(target_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update RenderExampleTable
table_start = content.find('function RenderExampleTable({')
table_end = content.find('function RenderExampleList({')
if table_start == -1 or table_end == -1:
    print('Error: RenderExampleTable not found')
    sys.exit(1)

old_table_section = content[table_start:table_end]

new_table_section = """function RenderExampleTable({
  table,
  targetLang,
  isDualMode,
  wordMeanings,
  noteTranslations
}: {
  table: ExampleTableBlock;
  targetLang: AnchorLanguage | null;
  isDualMode: boolean;
  wordMeanings: Record<string, Record<string, string>>;
  noteTranslations: Record<string, Record<string, string>>;
}) {
  const isComparison = table.headers.includes("ㄱ") && table.headers.includes("ㄴ");
  const isMultiStandard = table.headers.includes("복수 표준어");

  const uiBase = UI_TEXTS.ko;
  const uiTarget = targetLang ? (UI_TEXTS[targetLang] || null) : null;

  return (
    <div className="space-y-2">
      {table.caption && (
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {table.caption}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {isComparison ? (
                <>
                  <th scope="col" className="px-3.5 py-2.5 font-bold">
                    <span>{uiBase.colStandard}</span>
                    {isDualMode && uiTarget && uiTarget.colStandard !== uiBase.colStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiBase.colMeaning}</span>
                    {isDualMode && uiTarget && uiTarget.colMeaning !== uiBase.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-500">
                    <span>{uiBase.colNonStandard}</span>
                    {isDualMode && uiTarget && uiTarget.colNonStandard !== uiBase.colNonStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colNonStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiBase.colNote}</span>
                    {isDualMode && uiTarget && uiTarget.colNote !== uiBase.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colNote}</span>
                    )}
                  </th>
                </>
              ) : isMultiStandard ? (
                <>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-700 dark:text-indigo-300">
                    <span>{uiBase.colMultiStandard}</span>
                    {isDualMode && uiTarget && uiTarget.colMultiStandard !== uiBase.colMultiStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colMultiStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiBase.colMeaning}</span>
                    {isDualMode && uiTarget && uiTarget.colMeaning !== uiBase.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiBase.colNote}</span>
                    {isDualMode && uiTarget && uiTarget.colNote !== uiBase.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiTarget.colNote}</span>
                    )}
                  </th>
                </>
              ) : (
                table.headers.map((h, idx) => (
                  <th key={idx} scope="col" className="px-3.5 py-2.5 font-bold text-slate-700 dark:text-slate-200">
                    {h}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {table.rows.map((row, rIdx) => {
              if (isComparison) {
                const stdWord = row[0]?.trim() || "";
                const nonStdWord = row[1]?.trim() || "";
                const note = row[2]?.trim() || "";

                const cleanWord = stdWord.replace(/-/g, "").trim();
                const meaningObj = (table as any).meanings?.[stdWord] || wordMeanings[stdWord] || wordMeanings[cleanWord] || null;
                const pMeaning = meaningObj?.ko || "";
                const sMeaning = isDualMode && targetLang && meaningObj ? (meaningObj[targetLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const sNoteTrans = isDualMode && targetLang && noteObj ? (noteObj[targetLang] || "") : "";

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    {/* Standard Word */}
                    <td className="px-3.5 py-2.5 align-top font-bold text-slate-900 dark:text-slate-50 text-base sm:text-lg">
                      {stdWord}
                    </td>

                    {/* Meaning Column */}
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-700 dark:text-slate-300">
                      {pMeaning ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{pMeaning}</div>
                          {sMeaning && sMeaning !== pMeaning && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{sMeaning}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Non-Standard Word (No Line-through) */}
                    <td className="px-3.5 py-2.5 align-top text-xs">
                      {nonStdWord ? (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                          {nonStdWord}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Note Column with Dual Translation */}
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {note ? (
                        <div className="space-y-1">
                          <div className="text-slate-700 dark:text-slate-200">{note}</div>
                          {sNoteTrans && sNoteTrans !== note && (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded">
                              {sNoteTrans}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              }

              if (isMultiStandard) {
                const multiWord = row[0]?.trim() || "";
                const note = row[1]?.trim() || "";
                const firstWord = multiWord.split("/")[0].replace(/-/g, "").trim();
                const meaningObj = (table as any).meanings?.[multiWord] || wordMeanings[multiWord] || wordMeanings[firstWord] || null;
                const pMeaning = meaningObj?.ko || "";
                const sMeaning = isDualMode && targetLang && meaningObj ? (meaningObj[targetLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const sNoteTrans = isDualMode && targetLang && noteObj ? (noteObj[targetLang] || "") : "";

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    <td className="px-3.5 py-2.5 align-top font-bold text-indigo-700 dark:text-indigo-300">
                      {multiWord}
                    </td>
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-700 dark:text-slate-300">
                      {pMeaning ? (
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{pMeaning}</div>
                          {sMeaning && sMeaning !== pMeaning && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">{sMeaning}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {note ? (
                        <div className="space-y-1">
                          <div className="text-slate-700 dark:text-slate-200">{note}</div>
                          {sNoteTrans && sNoteTrans !== note && (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded">
                              {sNoteTrans}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              }

              // Fallback table row
              return (
                <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3.5 py-2.5 align-top text-slate-700 dark:text-slate-300 text-xs">
                      {cell || "-"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"""

content = content.replace(old_table_section, new_table_section, 1)

# 2. Update RenderExampleText
text_start = content.find('function RenderExampleText({')
text_end = content.find('function RenderFormattedCommentary({')
if text_start == -1 or text_end == -1:
    print('Error: RenderExampleText not found')
    sys.exit(1)

old_text_section = content[text_start:text_end]

new_text_section = """function RenderExampleText({
  text,
  targetLang,
  isDualMode,
  noteTranslations
}: {
  text: ExampleTextBlock;
  targetLang: AnchorLanguage | null;
  isDualMode: boolean;
  noteTranslations?: Record<string, Record<string, string>>;
}) {
  const trimmed = text.content?.trim() || "";
  if (/^\\(\\d+\\)$/.test(trimmed)) {
    return null;
  }

  const sNoteTrans = (isDualMode && targetLang && noteTranslations) ? noteTranslations[trimmed]?.[targetLang] : null;

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
}

"""

content = content.replace(old_text_section, new_text_section, 1)

# 3. Update KoreanStandardsView body (language resolution, banner, filters, articles)
body_start = content.find('  // Resolve languages dynamically from top header LearnerProvider')
body_end = content.find('      {/* Footer Info */}')
if body_start == -1 or body_end == -1:
    print('Error: View body not found')
    sys.exit(1)

old_view_body = content[body_start:body_end]

new_view_body = """  // Client-side synchronized secondary locales to handle dynamic changes from header popover
  const [clientSec, setClientSec] = useState(() => getClientSecondaryLocales());

  useEffect(() => {
    setClientSec(getClientSecondaryLocales());
    const handleSync = () => {
      setClientSec(getClientSecondaryLocales());
    };
    window.addEventListener("life_help_secondary_locale_change", handleSync);
    window.addEventListener("life_help_display_mode_change", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("popstate", handleSync);
    return () => {
      window.removeEventListener("life_help_secondary_locale_change", handleSync);
      window.removeEventListener("life_help_display_mode_change", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("popstate", handleSync);
    };
  }, []);

  // Primary language (current interface locale)
  const primaryLang: AnchorLanguage = useMemo(() => {
    return toAnchorLang(locale, "ko");
  }, [locale]);

  // Secondary language (from client storage/event or server props)
  const secondaryLang: AnchorLanguage = useMemo(() => {
    if (clientSec.secondaryLocales && clientSec.secondaryLocales.length > 0) {
      const parsed = toAnchorLang(clientSec.secondaryLocales[0], "ko");
      if (parsed !== primaryLang) return parsed;
    }
    if (clientSec.secondaryLocale) {
      const parsed = toAnchorLang(clientSec.secondaryLocale, "ko");
      if (parsed !== primaryLang) return parsed;
    }
    const raw = (secondaryLocales && secondaryLocales.length > 0) ? secondaryLocales[0] : secondaryLocale;
    return toAnchorLang(raw, "ko");
  }, [clientSec, secondaryLocales, secondaryLocale, primaryLang]);

  // Bilingual mode enabled check
  const showBilingual: boolean = useMemo(() => {
    if (secondaryLang === primaryLang) return false;
    if (clientSec.isBilingual || (clientSec.secondaryLocale && clientSec.secondaryLocale !== primaryLang) || (clientSec.secondaryLocales && clientSec.secondaryLocales.length > 0)) {
      return true;
    }
    return !!isBilingual || ((secondaryLocales && secondaryLocales.length > 0) || !!secondaryLocale);
  }, [clientSec, isBilingual, secondaryLang, primaryLang, secondaryLocales, secondaryLocale]);

  // Target translation language:
  // If primary is not Korean (e.g. Vietnamese learner mode), target translation is that foreign language.
  // If primary is Korean and bilingual is enabled, target translation is the chosen secondary language.
  const targetLang = useMemo<AnchorLanguage | null>(() => {
    if (primaryLang !== "ko") return primaryLang;
    if (showBilingual && secondaryLang !== "ko") return secondaryLang;
    return null;
  }, [primaryLang, showBilingual, secondaryLang]);

  const isDualMode = Boolean(targetLang && targetLang !== "ko");

  // Always keep Korean base text prominent, with target language translation underneath
  const uiBase = UI_TEXTS.ko;
  const uiTarget = targetLang ? (UI_TEXTS[targetLang] || null) : null;

  // Search & Filter State
  const [selectedPart, setSelectedPart] = useState<"all" | 1 | 2>("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  // Available chapters for filter dropdown
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    for (const art of articles) {
      if (selectedPart === "all" || art.partNum === selectedPart) {
        const ch = art.i18n.ko.chapter;
        if (ch) chapters.add(ch);
      }
    }
    return Array.from(chapters);
  }, [selectedPart, articles]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (selectedPart !== "all" && art.partNum === selectedPart) {
        return false;
      }
      if (selectedChapter !== "all" && art.i18n.ko.chapter !== selectedChapter) {
        return false;
      }
      if (!searchQuery.trim()) {
        return true;
      }

      const q = searchQuery.toLowerCase().trim();
      const numMatch = art.articleNum.toString() === q || `제${art.articleNum}항`.includes(q);
      if (numMatch) return true;

      const koTrans = art.i18n.ko;
      const targetTrans = targetLang ? art.i18n[targetLang] : null;

      const ruleMatch = (koTrans?.rule && koTrans.rule.toLowerCase().includes(q)) ||
        (targetTrans?.rule && targetTrans.rule.toLowerCase().includes(q));
      if (ruleMatch) return true;

      const titleMatch = (koTrans?.title && koTrans.title.toLowerCase().includes(q)) ||
        (targetTrans?.title && targetTrans.title.toLowerCase().includes(q));
      if (titleMatch) return true;

      const expMatch = (koTrans?.explanation && koTrans.explanation.toLowerCase().includes(q)) ||
        (targetTrans?.explanation && targetTrans.explanation.toLowerCase().includes(q));
      if (expMatch) return true;

      return false;
    });
  }, [selectedPart, selectedChapter, searchQuery, articles, targetLang]);

  const toggleExpand = (id: string) => {
    setExpandedArticles((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    for (const art of articles) {
      updated[art.id] = nextState;
    }
    setExpandedArticles(updated);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-sm text-slate-500 font-medium">표준어 규정 데이터 및 다국어 병기 사전을 불러오는 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8 font-sans antialiased text-slate-800 dark:text-slate-100">
      {/* Header Banner with Bilingual Grounding */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-10 shadow-xl border border-indigo-700/40">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-xs font-semibold">
            <span>{uiBase.badge}</span>
            {isDualMode && uiTarget && uiTarget.badge !== uiBase.badge && (
              <span className="text-[11px] opacity-75">· {uiTarget.badge}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
              {uiBase.title}
            </h1>
            {isDualMode && uiTarget && uiTarget.title !== uiBase.title && (
              <div className="text-base sm:text-xl font-bold text-indigo-200/95 mt-1">
                {uiTarget.title}
              </div>
            )}
          </div>
          <div className="space-y-1.5 max-w-3xl">
            <p className="text-sm sm:text-base text-indigo-100/95 leading-relaxed">
              {uiBase.subtitle}
            </p>
            {isDualMode && uiTarget && uiTarget.subtitle !== uiBase.subtitle && (
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed font-normal">
                {uiTarget.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Quick Action Button */}
        <div className="flex justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
          >
            {allExpanded ? uiBase.collapseAll : uiBase.expandAll}
          </button>
        </div>

        {/* Part Filter Tabs, Chapter Filter & Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Part Tabs */}
          <div className="md:col-span-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiBase.allArticles}</div>
              {isDualMode && uiTarget && uiTarget.allArticles !== uiBase.allArticles && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiTarget.allArticles}</div>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(1); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === 1 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiBase.part1Tab}</div>
              {isDualMode && uiTarget && uiTarget.part1Tab !== uiBase.part1Tab && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiTarget.part1Tab}</div>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(2); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 px-1 text-center rounded-md transition ${selectedPart === 2 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              <div className="text-xs font-bold">{uiBase.part2Tab}</div>
              {isDualMode && uiTarget && uiTarget.part2Tab !== uiBase.part2Tab && (
                <div className="text-[10px] font-normal opacity-80 leading-tight">{uiTarget.part2Tab}</div>
              )}
            </button>
          </div>

          {/* Chapter Selector Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">
                {uiBase.allChapters}
                {isDualMode && uiTarget && uiTarget.allChapters !== uiBase.allChapters ? ` (${uiTarget.allChapters})` : ""}
              </option>
              {availableChapters.map((ch) => {
                const trTarget = targetLang ? (CHAPTER_TRANSLATIONS[targetLang]?.[ch] || ch) : null;
                const label = isDualMode && trTarget && trTarget !== ch ? `${ch} (${trTarget})` : ch;
                return (
                  <option key={ch} value={ch}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={uiBase.searchPlaceholder}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Count Indicator */}
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-1">
          <span>{uiBase.showingCount.replace("{count}", filteredArticles.length.toString())}</span>
          {isDualMode && uiTarget && uiTarget.showingCount !== uiBase.showingCount && (
            <span className="opacity-75 ml-2 font-normal">· {uiTarget.showingCount.replace("{count}", filteredArticles.length.toString())}</span>
          )}
        </div>
      </div>

      {/* Main Articles List */}
      <main className="space-y-6 sm:space-y-8">
        <div className="space-y-6">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="text-3xl">🔍</div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {uiBase.noMatchTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {uiBase.noMatchDesc}
              </p>
              <button
                type="button"
                onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); setSearchQuery(""); }}
                className="mt-2 px-4 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition"
              >
                {uiBase.resetFilter}
              </button>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const koTrans = art.i18n.ko;
              const targetTrans = targetLang ? (art.i18n[targetLang] || null) : null;
              const isExpanded = !!expandedArticles[art.id];
              const validStructured = (art.structuredExamples || []).filter(
                (b) => !(b.type === "text" && /^\\s*\\(\\d+\\)\\s*$/.test(b.content || ""))
              );
              const hasStructured = validStructured.length > 0;
              const hasDetails = (art.details && art.details.length > 0) || hasStructured;
              const isPart1 = art.partNum === 1;

              return (
                <article
                  key={art.id}
                  id={art.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Article Header Card */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Part Badge with Bilingual Support */}
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-black flex items-center gap-1.5 ${
                          isPart1
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          <span>{koTrans?.part || (isPart1 ? "제1부 사정 원칙" : "제2부 표준 발음법")}</span>
                          {isDualMode && targetTrans?.part && targetTrans.part !== koTrans?.part && (
                            <span className="opacity-75 font-normal text-[11px]">· {targetTrans.part}</span>
                          )}
                        </div>

                        {/* Chapter Badge with Bilingual Support */}
                        {koTrans?.chapter && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                            <span>{koTrans.chapter}</span>
                            {isDualMode && targetTrans?.chapter && targetTrans.chapter !== koTrans.chapter && (
                              <span className="opacity-75 font-normal text-[11px] text-slate-500">· {targetTrans.chapter}</span>
                            )}
                          </div>
                        )}

                        {/* Section Badge with Bilingual Support */}
                        {koTrans?.section && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-normal border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                            <span>{koTrans.section}</span>
                            {isDualMode && targetTrans?.section && targetTrans.section !== koTrans.section && (
                              <span className="opacity-75 font-normal text-[11px] text-slate-400">· {targetTrans.section}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Article ID with Bilingual Support */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {koTrans?.title || `제${art.articleNum}항`}
                        </span>
                        {isDualMode && targetTrans?.title && targetTrans.title !== koTrans?.title && (
                          <span className="text-[11px] font-mono text-indigo-500/80 dark:text-indigo-300/80 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                            {targetTrans.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rule Text: Always Korean Original on top, Bilingual Translation underneath */}
                    <div className="pt-1">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 select-none">
                          §
                        </span>
                        <div className="flex-1 space-y-2">
                          {/* Primary Korean Rule (Always Korean on top!) */}
                          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug tracking-tight">
                            {koTrans?.rule || ""}
                          </div>
                          {/* Secondary Rule (Bilingual Translation underneath!) */}
                          {isDualMode && targetTrans?.rule && targetTrans.rule !== koTrans?.rule && (
                            <div className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                              {targetTrans.rule}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Explanation Section: Faithful Paragraph-by-Paragraph Alignment & Dual Bilingual Mode */}
                    {(koTrans?.explanation || (targetTrans && targetTrans.explanation)) && (() => {
                      const parasList = commentaryParagraphs[art.id] || [];
                      const hasStructuredParas = parasList.length > 0;

                      return (
                        <div className="space-y-3 pt-1">
                          <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>{uiBase.explanationTitle}</span>
                            {isDualMode && (
                              <span className="text-[11px] font-normal text-slate-400">
                                문단별 한국어 원문 및 번역 병기 모드
                              </span>
                            )}
                          </div>

                          <div className="space-y-3.5">
                            {hasStructuredParas ? (
                              parasList.map((pObj, pIdx) => {
                                const koPara = pObj.ko;
                                const transPara = targetLang ? (pObj[targetLang] || "") : "";

                                return (
                                  <div
                                    key={pIdx}
                                    className="bg-amber-50/40 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs"
                                  >
                                    {/* Primary Korean Commentary Paragraph */}
                                    <RenderFormattedCommentary text={koPara} />

                                    {/* Bilingual Translation Paragraph directly underneath */}
                                    {isDualMode && transPara && transPara !== koPara && (
                                      <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                        <RenderFormattedCommentary text={transPara} isSecondary />
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback using splitCommentaryParagraphs
                              (() => {
                                const koParas = splitCommentaryParagraphs(koTrans?.explanation || "");
                                const transParas = isDualMode && targetTrans?.explanation ? splitCommentaryParagraphs(targetTrans.explanation) : [];
                                return (
                                  <div className="space-y-3.5">
                                    {koParas.map((para, pIdx) => {
                                      const sPara = transParas[pIdx] || (pIdx === koParas.length - 1 ? transParas.slice(pIdx).join("\\n\\n") : "");
                                      return (
                                        <div
                                          key={pIdx}
                                          className="bg-amber-50/40 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs"
                                        >
                                          <RenderFormattedCommentary text={para} />
                                          {isDualMode && sPara && sPara !== para && (
                                            <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                              <RenderFormattedCommentary text={sPara} isSecondary />
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Details Toggle Button */}
                    {hasDetails && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(art.id)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-3.5 py-1.5 rounded-lg transition"
                        >
                          <span>{isExpanded ? uiBase.collapseDetails : uiBase.expandDetails}</span>
                          {hasStructured && (
                            <span className="text-[11px] opacity-75 font-normal">
                              {uiBase.itemsCount.replace("{count}", validStructured.length.toString())}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Accordion Content (Structured Tables with Meanings, Lists, & Text) */}
                  {hasDetails && isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 sm:p-6 space-y-4">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>📋</span>
                        <span>{uiBase.examplesTitle}</span>
                      </div>

                      {hasStructured ? (
                        <div className="space-y-4">
                          {validStructured.map((block, idx) => {
                            if (block.type === "table") {
                              return (
                                <RenderExampleTable
                                  key={idx}
                                  table={block}
                                  targetLang={targetLang}
                                  isDualMode={isDualMode}
                                  wordMeanings={wordMeanings}
                                  noteTranslations={noteTranslations}
                                />
                              );
                            }
                            if (block.type === "list") {
                              return <RenderExampleList key={idx} list={block} />;
                            }
                            if (block.type === "text") {
                              return (
                                <RenderExampleText
                                  key={idx}
                                  text={block}
                                  targetLang={targetLang}
                                  isDualMode={isDualMode}
                                  noteTranslations={noteTranslations}
                                />
                              );
                            }
                            return null;
                          })}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {art.details?.map((det, dIdx) => (
                            <div key={dIdx} className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                              <p className="font-bold text-slate-900 dark:text-slate-100">{det.clause}</p>
                              {det.examples && det.examples.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {det.examples.map((ex, eIdx) => (
                                    <span key={eIdx} className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-medium text-xs">
                                      {ex}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
"""

content = content.replace(old_view_body, new_view_body, 1)

with open(target_file, 'w', encoding='utf-8') as f:
    f.write(content)

print('Successfully applied bilingual standards fix to KoreanStandardsView.tsx')
