import os

view_code = '''"use client";

import React, { useState, useMemo } from "react";
import type { StandardArticle, AnchorLanguage, ExampleBlock, ExampleTableBlock, ExampleListBlock, ExampleTextBlock } from "@/lib/standards/types";
import { ANCHOR_LANGUAGES } from "@/lib/standards/types";
import { useLearner } from "@/components/learn/LearnerProvider";
import standardsData from "@/lib/standards/data/korean_norms_anchor.json";

const articles = standardsData as unknown as StandardArticle[];

function toAnchorLang(loc: string | null | undefined, fallback: AnchorLanguage = "ko"): AnchorLanguage {
  if (!loc) return fallback;
  const l = loc.toLowerCase();
  if (l === "ko") return "ko";
  if (l === "en") return "en";
  if (l === "vi") return "vi";
  if (l === "zh-hant" || l === "zh-tw" || l === "zt") return "zh-Hant";
  if (l === "zh-hans" || l === "zh-cn" || l === "zh" || l === "zs") return "zh-Hans";
  if (l === "ja") return "ja";
  return fallback;
}

/** Render formatted table block */
function RenderExampleTable({ table }: { table: ExampleTableBlock }) {
  const isStandardComparison = table.headers.some((h) => h === "ㄱ") && table.headers.some((h) => h === "ㄴ");

  return (
    <div className="space-y-2">
      {table.caption && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800">
          <span>📊</span>
          <span>{table.caption}</span>
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs bg-white dark:bg-slate-900">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700">
              {table.headers.map((h, idx) => {
                let headerContent: React.ReactNode = h;
                if (isStandardComparison) {
                  if (h === "ㄱ") {
                    headerContent = (
                      <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                        ㄱ (표준어)
                      </span>
                    );
                  } else if (h === "ㄴ") {
                    headerContent = (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                        <span className="w-2 h-2 rounded-full bg-rose-400 inline-block"></span>
                        ㄴ (비표준어 / 버림)
                      </span>
                    );
                  } else if (h === "비고") {
                    headerContent = <span className="text-slate-600 dark:text-slate-300 font-medium">비고 (용례 및 참고)</span>;
                  }
                }
                return (
                  <th key={idx} scope="col" className="px-3.5 py-2.5 font-bold text-slate-700 dark:text-slate-200">
                    {headerContent}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {table.rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                {row.map((cell, cIdx) => {
                  const headerName = table.headers[cIdx] || "";
                  const isStandardCol = isStandardComparison && headerName === "ㄱ";
                  const isNonStandardCol = isStandardComparison && headerName === "ㄴ";

                  return (
                    <td
                      key={cIdx}
                      className={`px-3.5 py-2.5 align-top ${
                        isStandardCol
                          ? "font-bold text-slate-900 dark:text-slate-50"
                          : isNonStandardCol
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-600 dark:text-slate-300 text-xs whitespace-pre-line"
                      }`}
                    >
                      {isNonStandardCol && cell ? (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 line-through">
                          {cell}
                        </span>
                      ) : (
                        cell || <span className="text-slate-300 dark:text-slate-600">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Render formatted list of word examples */
function RenderExampleList({ list }: { list: ExampleListBlock }) {
  return (
    <div className="space-y-2">
      {list.title && (
        <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
          {list.title}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {list.items.map((item, idx) => {
          // Check if item has pronunciation bracket like 닦다[닥따]
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
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-medium text-slate-800 dark:text-slate-200"
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Render text callout */
function RenderExampleText({ text }: { text: ExampleTextBlock }) {
  const isRuleAddition = text.content.startsWith("다만") || text.content.startsWith("[붙임");
  return (
    <div
      className={`p-3.5 rounded-xl text-xs sm:text-sm leading-relaxed border ${
        isRuleAddition
          ? "border-l-4 border-l-amber-500 border-amber-200/70 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-slate-800 dark:text-slate-200"
          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
      }`}
    >
      {text.content}
    </div>
  );
}

export function KoreanStandardsView() {
  const { locale, secondaryLocale, secondaryLocales, isBilingual } = useLearner();

  // Resolve languages dynamically from top header LearnerProvider
  const primaryLang: AnchorLanguage = useMemo(() => {
    return toAnchorLang(locale, "ko");
  }, [locale]);

  const secondaryLang: AnchorLanguage = useMemo(() => {
    if (primaryLang !== "ko") {
      const topSec = secondaryLocale || secondaryLocales?.[0];
      return topSec ? toAnchorLang(topSec, "ko") : "ko";
    }
    const topSec = secondaryLocale || secondaryLocales?.[0];
    return topSec ? toAnchorLang(topSec, "en") : "en";
  }, [primaryLang, secondaryLocale, secondaryLocales]);

  const showBilingual = isBilingual || (primaryLang !== "ko");

  const [selectedPart, setSelectedPart] = useState<number | "all">("all");
  const [selectedChapter, setSelectedChapter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedArticles, setExpandedArticles] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const primaryLangMeta = ANCHOR_LANGUAGES.find((l) => l.code === primaryLang) || ANCHOR_LANGUAGES[0];
  const secondaryLangMeta = ANCHOR_LANGUAGES.find((l) => l.code === secondaryLang) || ANCHOR_LANGUAGES[1];

  // Available chapters for current part
  const availableChapters = useMemo(() => {
    const chapters = new Set<string>();
    for (const art of articles) {
      if (selectedPart === "all" || art.partNum === selectedPart) {
        const chap = art.i18n.ko?.chapter;
        if (chap) chapters.add(chap);
      }
    }
    return Array.from(chapters);
  }, [selectedPart]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return articles.filter((art) => {
      if (selectedPart !== "all" && art.partNum !== selectedPart) {
        return false;
      }
      if (selectedChapter !== "all" && art.i18n.ko?.chapter !== selectedChapter) {
        return false;
      }
      if (!query) return true;

      if (query === String(art.articleNum) || query === `제${art.articleNum}항`) return true;

      const prim = art.i18n[primaryLang] || art.i18n.ko;
      const sec = art.i18n[secondaryLang] || art.i18n.ko;

      const primMatch = (
        (prim?.rule && prim.rule.toLowerCase().includes(query)) ||
        (prim?.explanation && prim.explanation.toLowerCase().includes(query)) ||
        (prim?.chapter && prim.chapter.toLowerCase().includes(query)) ||
        (prim?.title && prim.title.toLowerCase().includes(query))
      );
      if (primMatch) return true;

      if (showBilingual && sec) {
        const secMatch = (
          (sec.rule && sec.rule.toLowerCase().includes(query)) ||
          (sec.explanation && sec.explanation.toLowerCase().includes(query)) ||
          (sec.chapter && sec.chapter.toLowerCase().includes(query)) ||
          (sec.title && sec.title.toLowerCase().includes(query))
        );
        if (secMatch) return true;
      }

      if (art.details && art.details.some((d) => d.toLowerCase().includes(query))) {
        return true;
      }

      return false;
    });
  }, [primaryLang, secondaryLang, showBilingual, selectedPart, selectedChapter, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const updated: Record<string, boolean> = {};
    for (const art of filteredArticles) {
      updated[art.id] = nextState;
    }
    setExpandedArticles(updated);
  };

  const copyArticleLink = (id: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-indigo-700/40 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold backdrop-blur-sm border border-indigo-400/30">
            <span>🏛️</span>
            <span>국립국어원 공식 표준어 규정 (56개 전 조항)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            한국어 표준어 규정 전체
          </h1>
          <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed max-w-3xl">
            제1부 <span className="font-semibold text-white">표준어 사정 원칙</span>(26개 항) 및 제2부 <span className="font-semibold text-white">표준 발음법</span>(30개 항)을 현대적인 맞춤형 UI로 학습하세요. 상단 헤더에서 선택한 언어와 병기 설정이 자동 연동됩니다.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Row 1: Active Language Indicator & Quick Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">적용 언어:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold border border-slate-200 dark:border-slate-700">
              {primaryLangMeta.flag} {primaryLangMeta.native}
            </span>
            {showBilingual && (
              <>
                <span className="text-slate-400">⇄</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                  {secondaryLangMeta.flag} {secondaryLangMeta.native} (병기)
                </span>
              </>
            )}
            <span className="text-[11px] text-slate-400 hidden sm:inline ml-1">
              (상단 메뉴에서 언어 및 병기를 변경할 수 있습니다)
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={toggleAll}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
            >
              {allExpanded ? "🔼 세부 예시 모두 접기" : "🔽 세부 예시 모두 펼치기"}
            </button>
          </div>
        </div>

        {/* Row 2: Part Filter Tabs & Chapter Filter & Search */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Part Tabs */}
          <div className="md:col-span-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === "all" ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              전체 (56)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(1); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === 1 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              제1부 사정원칙 (26)
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(2); setSelectedChapter("all"); }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition ${selectedPart === 2 ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs" : "text-slate-600 dark:text-slate-400 hover:text-slate-900"}`}
            >
              제2부 표준발음 (30)
            </button>
          </div>

          {/* Chapter Selector */}
          <div className="md:col-span-3">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">모든 장(Chapter) 보기</option>
              {availableChapters.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="조항 번호, 규정문, 키워드 검색..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="absolute left-3 top-2.5 text-slate-400 text-xs pointer-events-none">
              🔍
            </span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span>
            총 <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{filteredArticles.length}</strong>개 조항이 표시되고 있습니다.
          </span>
          {searchQuery && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              &lsquo;{searchQuery}&rsquo; 검색 결과
            </span>
          )}
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-6">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <p className="text-3xl mb-2">🔍</p>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">일치하는 조항이 없습니다</h3>
            <p className="text-xs text-slate-500 mt-1">검색어나 필터 조건을 변경해 보세요.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(""); setSelectedPart("all"); setSelectedChapter("all"); }}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
            >
              모든 필터 초기화
            </button>
          </div>
        ) : (
          filteredArticles.map((art) => {
            const pTrans = art.i18n[primaryLang] || art.i18n.ko;
            const sTrans = showBilingual ? (art.i18n[secondaryLang] || art.i18n.ko) : null;
            const isExpanded = !!expandedArticles[art.id];
            const hasStructured = art.structuredExamples && art.structuredExamples.length > 0;
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
                      {/* Part Badge */}
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

                    {/* Article ID & Share Button */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                        {pTrans?.title || `제${art.articleNum}항`}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyArticleLink(art.id)}
                        title="조항 링크 복사"
                        className="text-xs text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        {copiedId === art.id ? "✅ 복사됨" : "🔗"}
                      </button>
                    </div>
                  </div>

                  {/* Rule Section (Highlight Box) */}
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <span className="text-indigo-600 dark:text-indigo-400 text-base font-black shrink-0 mt-0.5">
                        §
                      </span>
                      <div className="flex-1 space-y-2">
                        {/* Primary Rule */}
                        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug tracking-tight">
                          {pTrans?.rule || ""}
                        </div>
                        {/* Secondary Rule (Bilingual) */}
                        {sTrans && sTrans.rule && (
                          <div className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200 dark:border-slate-700 leading-snug">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-500 mr-2 bg-indigo-50 dark:bg-indigo-950 px-1.5 py-0.2 rounded">
                              {secondaryLangMeta.native}
                            </span>
                            {sTrans.rule}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Explanation Section */}
                  {(pTrans?.explanation || (sTrans && sTrans.explanation)) && (
                    <div className="space-y-2 pt-1">
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>💡</span>
                        <span>핵심 해설 및 규정 배경</span>
                      </div>
                      <div className="space-y-2">
                        {pTrans?.explanation && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                            {pTrans.explanation}
                          </p>
                        )}
                        {sTrans && sTrans.explanation && (
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-indigo-500 mr-1.5">
                              [{secondaryLangMeta.native}]
                            </span>
                            {sTrans.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Details Toggle Button */}
                  {hasDetails && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => toggleExpand(art.id)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-3.5 py-1.5 rounded-lg transition"
                      >
                        <span>{isExpanded ? "▲ 세부 예시 및 규정 접기" : "▼ 세부 예시 표 및 단어 목록 보기"}</span>
                        {hasStructured && (
                          <span className="text-[11px] opacity-75 font-normal">
                            ({art.structuredExamples?.length}개 항목)
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Details Accordion Content (Structured Tables, Lists, & Text) */}
                {hasDetails && isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 sm:p-6 space-y-4">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>📋</span>
                      <span>원문 세부 항목 및 단어별 예시 목록</span>
                    </div>

                    {hasStructured ? (
                      <div className="space-y-4">
                        {art.structuredExamples?.map((block, idx) => {
                          if (block.type === "table") {
                            return <RenderExampleTable key={idx} table={block} />;
                          }
                          if (block.type === "list") {
                            return <RenderExampleList key={idx} list={block} />;
                          }
                          if (block.type === "text") {
                            return <RenderExampleText key={idx} text={block} />;
                          }
                          return null;
                        })}
                      </div>
                    ) : (
                      /* Fallback for raw text details */
                      <div className="space-y-3">
                        {art.details.map((detail, idx) => (
                          <div
                            key={idx}
                            className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap bg-white dark:bg-slate-800/90 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
                          >
                            {detail}
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

      {/* Footer Info */}
      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p>출처: 대한민국 문화체육관광부 고시 · 국립국어원 한국어 표준어 규정</p>
        <p>LIFE.HELP 한국어 캠퍼스 · 다국어 병기 표준어 학습 포털</p>
      </footer>
    </div>
  );
}
'''

with open('components/standards/KoreanStandardsView.tsx', 'w', encoding='utf-8') as f:
    f.write(view_code)

print('generate_view.py completed with structured table renderers')
