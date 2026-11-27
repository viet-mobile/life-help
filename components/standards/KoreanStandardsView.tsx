"use client";

/** Split commentary into reader-friendly semantic paragraphs based on strict orthographic & punctuation rules */
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
  const pattern = /(?=\b[1-9]\.\s+|[①-⑳]|\[붙임(?:\s*\d+)?\]|\(\d+\)(?=\s|$)|(?<=[.!?]\s)(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)|^(?:첫째,\s*|둘째,\s*|셋째,\s*|넷째,\s*)|(?<=[.!?]\s)(?:반면|따라서|그러나|다만)\b|^(?:반면|따라서|그러나|다만)\b|(?<=[.!?]\s)(?:더\s*알아보기|이\s*외에도|그뿐만\s*아니라))/g;

  const rawParts = t.split(pattern);
  const result: string[] = [];
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (trimmed) {
      result.push(trimmed);
    }
  }
  return result.length > 0 ? result : [t];
}

import React, { useState, useMemo, useEffect } from "react";
import type { StandardArticle, AnchorLanguage, ExampleBlock, ExampleTableBlock, ExampleListBlock, ExampleTextBlock } from "@/lib/standards/types";
import { ANCHOR_LANGUAGES } from "@/lib/standards/types";
import { useLearner } from "@/components/learn/LearnerProvider";
import { splitLocalePrefix } from "@/lib/learn/i18n/path";

interface ClientSecState {
  isBilingual: boolean;
  displayMode?: string;
  secondaryLocale: string | null;
  secondaryLocales: string[];
}

function getClientSecondaryLocales(pathOverride?: string): ClientSecState {
  if (typeof window === "undefined") return { isBilingual: false, displayMode: "monolingual", secondaryLocale: null, secondaryLocales: [] };
  const path = pathOverride || window.location.pathname;
  const fromPath = splitLocalePrefix(path).secondaryLocales || [];
  if (fromPath.length > 0) {
    return { isBilingual: true, displayMode: "bilingual", secondaryLocale: fromPath[0], secondaryLocales: fromPath };
  }
  let lsMode: string | null = null;
  try {
    lsMode = localStorage.getItem("life_help_display_mode");
    const lsMulti = localStorage.getItem("life_help_secondary_locales");
    if (lsMulti) {
      const parts = lsMulti.split(/[,+]/).filter(Boolean);
      if (parts.length > 0) return { isBilingual: true, displayMode: "bilingual", secondaryLocale: parts[0], secondaryLocales: parts };
    }
    const lsSingle = localStorage.getItem("life_help_secondary_locale");
    if (lsSingle) return { isBilingual: true, displayMode: "bilingual", secondaryLocale: lsSingle, secondaryLocales: [lsSingle] };
    if (lsMode === "single" || lsMode === "monolingual") return { isBilingual: false, displayMode: "monolingual", secondaryLocale: null, secondaryLocales: [] };
  } catch {}
  const mode = document.cookie.match(/life_help_display_mode=([^;]+)/)?.[1];
  const sec = document.cookie.match(/life_help_secondary_locale=([^;]+)/)?.[1] ?? null;
  const multiStr = document.cookie.match(/life_help_secondary_locales=([^;]+)/)?.[1];
  const multi = multiStr ? multiStr.split(/[,+]/).filter(Boolean) : (sec ? [sec] : []);
  const isBi = mode === "bilingual" || mode === "multilingual" || multi.length > 0 || !!sec;
  return {
    isBilingual: isBi,
    displayMode: isBi ? "bilingual" : "monolingual",
    secondaryLocale: sec || (multi[0] ?? null),
    secondaryLocales: multi,
  };
}

// In-memory module cache to prevent re-fetching across tab navigations
let cachedArticles: StandardArticle[] | null = null;
let cachedMeanings: Record<string, Record<string, string>> | null = null;
let cachedNotes: Record<string, Record<string, string>> | null = null;
let cachedParagraphs: Record<string, Array<Record<string, string>>> | null = null;

function toAnchorLang(loc: string | null | undefined, fallback: AnchorLanguage = "ko"): AnchorLanguage {
  if (!loc) return fallback;
  const lower = loc.toLowerCase().trim();
  if (lower === "ko" || lower === "korean") return "ko";
  if (lower === "en" || lower === "english") return "en";
  if (lower === "vi" || lower === "vietnamese") return "vi";
  if (lower === "zh-hant" || lower === "zh-tw" || lower === "zt") return "zh-Hant";
  if (lower === "zh-hans" || lower === "zh-cn" || lower === "zh" || lower === "zs") return "zh-Hans";
  if (lower === "ja" || lower === "japanese") return "ja";
  return fallback;
}

const UI_TEXTS: Record<AnchorLanguage, Record<string, string>> = {
  ko: {
    badge: "🏛️ 국립국어원 공식 표준어 규정 (56개 전 조항)",
    title: "한국어 표준어 규정 전체",
    subtitle: "제1부 표준어 사정 원칙(26개 항) 및 제2부 표준 발음법(30개 항)을 현대적인 맞춤형 UI로 학습하세요. 규정문과 상세 해설 전체가 상단 선택 언어로 번역 및 병기됩니다.",
    expandAll: "🔽 세부 예시 모두 펼치기",
    collapseAll: "🔼 세부 예시 모두 접기",
    allArticles: "전체 (56)",
    part1Tab: "제1부 사정원칙 (26)",
    part2Tab: "제2부 표준발음 (30)",
    allChapters: "모든 장(Chapter) 보기",
    searchPlaceholder: "🔍 조항 번호, 규정문, 키워드 검색...",
    showingCount: "총 {count}개 조항이 표시되고 있습니다.",
    expandDetails: "▼ 세부 예시 표 및 단어 목록 보기",
    collapseDetails: "▲ 세부 예시 및 규정 접기",
    itemsCount: "({count}개 항목)",
    examplesTitle: "📋 원문 세부 항목 및 단어별 예시 목록",
    exampleBadge: "예시",
    colStandard: "ㄱ (표준어)",
    colMeaning: "의미",
    colNonStandard: "ㄴ (비표준어 / 버림)",
    colNote: "비고 (용례 및 참고)",
    colMultiStandard: "복수 표준어",
    explanationTitle: "💡 핵심 해설 및 규정 배경",
    noMatchTitle: "일치하는 조항이 없습니다",
    noMatchDesc: "검색어나 필터 조건을 변경해 보세요.",
    resetFilter: "모든 필터 초기화"
  },
  vi: {
    badge: "🏛️ Quy định tiếng Hàn chuẩn chính thức của Viện Ngôn ngữ Quốc gia (56 điều)",
    title: "Toàn văn Quy định Tiếng Hàn Chuẩn",
    subtitle: "Học tập Phần 1 Nguyên tắc thẩm định từ chuẩn (26 điều) và Phần 2 Quy tắc phát âm chuẩn (30 điều) với giao diện trực quan hiện đại. Toàn bộ quy chuẩn và chú giải được dịch và song ngữ theo ngôn ngữ bạn chọn.",
    expandAll: "🔽 Mở rộng tất cả ví dụ",
    collapseAll: "🔼 Thu gọn tất cả ví dụ",
    allArticles: "Tất cả (56)",
    part1Tab: "Phần 1: Thẩm định từ (26)",
    part2Tab: "Phần 2: Phát âm chuẩn (30)",
    allChapters: "Xem tất cả các chương (Chapter)",
    searchPlaceholder: "🔍 Tìm số điều, văn bản quy định, từ khóa...",
    showingCount: "Đang hiển thị tổng cộng {count} điều khoản.",
    expandDetails: "▼ Xem bảng ví dụ chi tiết & danh sách từ",
    collapseDetails: "▲ Thu gọn ví dụ chi tiết & quy định",
    itemsCount: "({count} mục)",
    examplesTitle: "📋 Danh mục chi tiết các mục và từ vựng ví dụ",
    exampleBadge: "Ví dụ",
    colStandard: "ㄱ (Từ chuẩn)",
    colMeaning: "Ý nghĩa",
    colNonStandard: "ㄴ (Từ không chuẩn / Bỏ)",
    colNote: "Ghi chú (Ví dụ & Tham khảo)",
    colMultiStandard: "Từ chuẩn kép (song hành)",
    explanationTitle: "💡 Chú giải quy chuẩn & Bối cảnh quy định",
    noMatchTitle: "Không tìm thấy điều khoản phù hợp",
    noMatchDesc: "Vui lòng thử thay đổi từ khóa hoặc điều kiện lọc.",
    resetFilter: "Đặt lại toàn bộ bộ lọc"
  },
  en: {
    badge: "🏛️ Official National Institute of Korean Language Standards (All 56 Articles)",
    title: "Full Regulations of Standard Korean",
    subtitle: "Study Part 1 Principles of Standard Language (26 Articles) and Part 2 Standard Pronunciation (30 Articles) with a modern responsive UI. All rules and detailed commentaries are translated and displayed in dual language mode.",
    expandAll: "🔽 Expand All Examples",
    collapseAll: "🔼 Collapse All Examples",
    allArticles: "All (56)",
    part1Tab: "Part 1: Determination (26)",
    part2Tab: "Part 2: Pronunciation (30)",
    allChapters: "View All Chapters",
    searchPlaceholder: "🔍 Search article number, rule text, keyword...",
    showingCount: "Displaying a total of {count} articles.",
    expandDetails: "▼ View Detailed Examples Table & Words",
    collapseDetails: "▲ Collapse Detailed Examples & Rules",
    itemsCount: "({count} items)",
    examplesTitle: "📋 Original Detailed Items & Vocabulary List",
    exampleBadge: "Examples",
    colStandard: "A (Standard)",
    colMeaning: "Meaning",
    colNonStandard: "B (Non-standard / Discarded)",
    colNote: "Notes & Usage Reference",
    colMultiStandard: "Multiple Standards",
    explanationTitle: "💡 Core Commentary & Linguistic Context",
    noMatchTitle: "No matching articles found",
    noMatchDesc: "Try adjusting your search query or filter options.",
    resetFilter: "Reset all filters"
  },
  ja: {
    badge: "🏛️ 国立国語院 公式標準語規定（全56箇条）",
    title: "韓国語 標準語規定 全文",
    subtitle: "第1部 標準語査定原則（26条）および第2部 標準発音法（30条）を現代的で快適なUIで学習できます。規定文と詳細な解説のすべてが選択した言語で翻訳・併記表示されます。",
    expandAll: "🔽 詳細な例をすべて展開",
    collapseAll: "🔼 詳細な例をすべて折りたたむ",
    allArticles: "全条項 (56)",
    part1Tab: "第1部 査定原則 (26)",
    part2Tab: "第2部 標準発音 (30)",
    allChapters: "すべての章を表示",
    searchPlaceholder: "🔍 条項番号、規定文、キーワード検索...",
    showingCount: "合計 {count} 箇条を表示中。",
    expandDetails: "▼ 詳細な用例表および単語一覧を見る",
    collapseDetails: "▲ 詳細な用例および規定を折りたたむ",
    itemsCount: "({count}項目)",
    examplesTitle: "📋 原文詳細項目および単語別用例一覧",
    exampleBadge: "用例",
    colStandard: "ㄱ (標準語)",
    colMeaning: "意味",
    colNonStandard: "ㄴ (非標準語 / 廃止)",
    colNote: "備考（用例および参考）",
    colMultiStandard: "複数標準語",
    explanationTitle: "💡 重要解説および規定背景",
    noMatchTitle: "該当する条項がありません",
    noMatchDesc: "検索語またはフィルター条件を変更してください。",
    resetFilter: "すべてのフィルターを初期化"
  },
  "zh-Hans": {
    badge: "🏛️ 韩国国立国语院 官方标准语规定（全56条）",
    title: "韩语标准语规定 全文",
    subtitle: "通过现代化的自适应UI学习第1部标准语审定原则（26条）及第2部标准发音法（30条）。规定原文与详细解说均支持所选语种的高清翻译与双语对照展示。",
    expandAll: "🔽 展开所有详细范例",
    collapseAll: "🔼 折叠所有详细范例",
    allArticles: "全部 (56)",
    part1Tab: "第1部 审定原则 (26)",
    part2Tab: "第2部 标准发音 (30)",
    allChapters: "查看所有章节",
    searchPlaceholder: "🔍 搜索条款编号、规定原文、关键词...",
    showingCount: "共显示 {count} 个条款。",
    expandDetails: "▼ 查看详细范例表及词汇列表",
    collapseDetails: "▲ 折叠详细范例及规定",
    itemsCount: "({count}个项目)",
    examplesTitle: "📋 原文细则及逐词范例列表",
    exampleBadge: "范例",
    colStandard: "甲（标准语）",
    colMeaning: "词义",
    colNonStandard: "乙（非标准语 / 废除）",
    colNote: "备注（用法及参考）",
    colMultiStandard: "并列标准语",
    explanationTitle: "💡 核心解说与规定背景",
    noMatchTitle: "未找到匹配条款",
    noMatchDesc: "请尝试更改搜索词或筛选条件。",
    resetFilter: "重置所有筛选"
  },
  "zh-Hant": {
    badge: "🏛️ 韓國國立國語院 官方標準語規定（全56條）",
    title: "韓語標準語規定 全文",
    subtitle: "透過現代化的自適應UI研讀第1部標準語審定原則（26條）及第2部標準發音法（30條）。規定原文與詳細解說均支援所選語種的高清翻譯與雙語對照展示。",
    expandAll: "🔽 展開所有詳細範例",
    collapseAll: "🔼 折疊所有詳細範例",
    allArticles: "全部 (56)",
    part1Tab: "第1部 審定原則 (26)",
    part2Tab: "第2部 標準發音 (30)",
    allChapters: "檢視所有章節",
    searchPlaceholder: "🔍 搜尋條款編號、規定原文、關鍵詞...",
    showingCount: "共顯示 {count} 個條款。",
    expandDetails: "▼ 檢視詳細範例表及詞彙列表",
    collapseDetails: "▲ 折疊詳細範例及規定",
    itemsCount: "({count}個項目)",
    examplesTitle: "📋 原文細則及逐詞範例列表",
    exampleBadge: "範例",
    colStandard: "甲（標準語）",
    colMeaning: "詞義",
    colNonStandard: "乙（非標準語 / 廢除）",
    colNote: "備註（用法及參考）",
    colMultiStandard: "並列標準語",
    explanationTitle: "💡 核心解說與規定背景",
    noMatchTitle: "未找到相符條款",
    noMatchDesc: "請嘗試變更搜尋字詞或篩選條件。",
    resetFilter: "重設所有篩選"
  }
};

const CHAPTER_TRANSLATIONS: Record<AnchorLanguage, Record<string, string>> = {
  ko: {
    "제1장 총칙": "제1장 총칙",
    "제2장 발음 변화에 따른 표준어 규정": "제2장 발음 변화에 따른 표준어 규정",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "제3장 어휘 선택의 변화에 따른 표준어 규정",
    "제2장 자음과 모음": "제2장 자음과 모음",
    "제3장 음의 길이": "제3장 음의 길이",
    "제4장 받침의 발음": "제4장 받침의 발음",
    "제5장 음의 동화": "제5장 음의 동화",
    "제6장 경음화": "제6장 경음화",
    "제7장 음의 첨가": "제7장 음의 첨가"
  },
  vi: {
    "제1장 총칙": "Chương 1: Quy tắc chung",
    "제2장 발음 변화에 따른 표준어 규정": "Chương 2: Quy định chuẩn theo biến đổi ngữ âm",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "Chương 3: Quy định chuẩn theo biến đổi từ vựng",
    "제2장 자음과 모음": "Chương 2: Phụ âm và Nguyên âm",
    "제3장 음의 길이": "Chương 3: Độ dài của âm",
    "제4장 받침의 발음": "Chương 4: Phát âm phụ âm cuối (Batchim)",
    "제5장 음의 동화": "Chương 5: Hiện tượng đồng hóa âm",
    "제6장 경음화": "Chương 6: Hiện tượng căng âm (Gấp đôi phụ âm)",
    "제7장 음의 첨가": "Chương 7: Hiện tượng thêm âm"
  },
  en: {
    "제1장 총칙": "Chapter 1: General Principles",
    "제2장 발음 변화에 따른 표준어 규정": "Chapter 2: Standard Rules by Pronunciation Shifts",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "Chapter 3: Standard Rules by Vocabulary Shifts",
    "제2장 자음과 모음": "Chapter 2: Consonants and Vowels",
    "제3장 음의 길이": "Chapter 3: Vowel Length",
    "제4장 받침의 발음": "Chapter 4: Pronunciation of Final Consonants",
    "제5장 음의 동화": "Chapter 5: Phonological Assimilation",
    "제6장 경음화": "Chapter 6: Tensification (Glottalization)",
    "제7장 음의 첨가": "Chapter 7: Sound Insertion"
  },
  ja: {
    "제1장 총칙": "第1章 総則",
    "제2장 발음 변화에 따른 표준어 규정": "第2章 発音変化に伴う標準語規定",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "第3章 語彙選択の変化に伴う標準語規定",
    "제2장 자음과 모음": "第2章 子音と母音",
    "제3장 음의 길이": "第3章 音の長さ",
    "제4장 받침의 발음": "第4章 パッチムの発音",
    "제5장 음의 동화": "第5章 音の同化",
    "제6장 경음화": "第6章 濃音化",
    "제7장 음의 첨가": "第7章 音の添加"
  },
  "zh-Hans": {
    "제1장 총칙": "第1章 总则",
    "제2장 발음 변화에 따른 표준어 규정": "第2章 基于发音变化的标准语规定",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "第3章 基于词汇选择变化的标准语规定",
    "제2장 자음과 모음": "第2章 辅音与元音",
    "제3장 음의 길이": "第3章 音长",
    "제4장 받침의 발음": "第4章 收音（韵尾）的发音",
    "제5장 음의 동화": "第5章 语音同化",
    "제6장 경음화": "第6章 紧音化",
    "제7장 음의 첨가": "第7章 增音现象"
  },
  "zh-Hant": {
    "제1장 총칙": "第1章 總則",
    "제2장 발음 변화에 따른 표준어 규정": "第2章 基於發音變化的標準語規定",
    "제3장 어휘 선택의 변화에 따른 표준어 규정": "第3章 基於詞彙選擇變化的標準語規定",
    "제2장 자음과 모음": "第2章 輔音與元音",
    "제3장 음의 길이": "第3章 音長",
    "제4장 받침의 발음": "第4章 收音（韻尾）的發音",
    "제5장 음의 동화": "第5章 語音同化",
    "제6장 경음화": "第6章 緊音化",
    "제7장 음의 첨가": "第7章 增音現象"
  }
};

/** Render beautiful formatted table of standard vs non-standard examples with Meanings */
function RenderExampleTable({
  table,
  firstTransLang,
  secondTransLang,
  isDualMode,
  wordMeanings,
  noteTranslations,
  primaryLang = "ko"
}: {
  table: ExampleTableBlock;
  firstTransLang: AnchorLanguage | null;
  secondTransLang?: AnchorLanguage | null;
  isDualMode: boolean;
  wordMeanings: Record<string, Record<string, string>>;
  noteTranslations: Record<string, Record<string, string>>;
  primaryLang?: AnchorLanguage;
}) {
  const isComparison = table.headers.includes("ㄱ") && table.headers.includes("ㄴ");
  const isMultiStandard = table.headers.includes("복수 표준어");

  const uiBase = UI_TEXTS.ko;
  const uiFirst = firstTransLang ? (UI_TEXTS[firstTransLang] || null) : null;
  const uiSecond = secondTransLang ? (UI_TEXTS[secondTransLang] || null) : null;

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
                    {isDualMode && uiFirst && uiFirst.colStandard !== uiBase.colStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colStandard}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colStandard !== uiBase.colStandard && uiSecond.colStandard !== uiFirst?.colStandard && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiBase.colMeaning}</span>
                    {isDualMode && uiFirst && uiFirst.colMeaning !== uiBase.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colMeaning}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colMeaning !== uiBase.colMeaning && uiSecond.colMeaning !== uiFirst?.colMeaning && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-500">
                    <span>{uiBase.colNonStandard}</span>
                    {isDualMode && uiFirst && uiFirst.colNonStandard !== uiBase.colNonStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colNonStandard}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colNonStandard !== uiBase.colNonStandard && uiSecond.colNonStandard !== uiFirst?.colNonStandard && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colNonStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiBase.colNote}</span>
                    {isDualMode && uiFirst && uiFirst.colNote !== uiBase.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colNote}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colNote !== uiBase.colNote && uiSecond.colNote !== uiFirst?.colNote && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colNote}</span>
                    )}
                  </th>
                </>
              ) : isMultiStandard ? (
                <>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-700 dark:text-indigo-300">
                    <span>{uiBase.colMultiStandard}</span>
                    {isDualMode && uiFirst && uiFirst.colMultiStandard !== uiBase.colMultiStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colMultiStandard}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colMultiStandard !== uiBase.colMultiStandard && uiSecond.colMultiStandard !== uiFirst?.colMultiStandard && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colMultiStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiBase.colMeaning}</span>
                    {isDualMode && uiFirst && uiFirst.colMeaning !== uiBase.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colMeaning}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colMeaning !== uiBase.colMeaning && uiSecond.colMeaning !== uiFirst?.colMeaning && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiBase.colNote}</span>
                    {isDualMode && uiFirst && uiFirst.colNote !== uiBase.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiFirst.colNote}</span>
                    )}
                    {secondTransLang && uiSecond && uiSecond.colNote !== uiBase.colNote && uiSecond.colNote !== uiFirst?.colNote && (
                      <span className="block text-[10px] font-normal text-slate-400/80">{uiSecond.colNote}</span>
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
                const fMeaning = isDualMode && firstTransLang && meaningObj ? (meaningObj[firstTransLang] || "") : "";
                const sMeaning = secondTransLang && meaningObj ? (meaningObj[secondTransLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const fNoteTrans = isDualMode && firstTransLang && noteObj ? (noteObj[firstTransLang] || "") : "";
                const sNoteTrans = secondTransLang && noteObj ? (noteObj[secondTransLang] || "") : "";

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    {/* Standard Word */}
                    <td className="px-3.5 py-2.5 align-top font-bold text-slate-900 dark:text-slate-50 text-base sm:text-lg">
                      {stdWord}
                    </td>

                    {/* Meaning Column: Primary on Top */}
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-700 dark:text-slate-300">
                      {primaryLang !== "ko" ? (
                        <div className="space-y-0.5">
                          {fMeaning ? (
                            <div className="font-bold text-indigo-700 dark:text-indigo-300">{fMeaning}</div>
                          ) : pMeaning ? (
                            <div className="font-medium text-slate-800 dark:text-slate-200">{pMeaning}</div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          {sMeaning && sMeaning !== fMeaning && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">{sMeaning}</div>
                          )}
                          {pMeaning && pMeaning !== fMeaning && (
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">🇰🇷 {pMeaning}</div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {pMeaning ? (
                            <div className="font-bold text-slate-800 dark:text-slate-200">{pMeaning}</div>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                          {fMeaning && fMeaning !== pMeaning && (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">{fMeaning}</div>
                          )}
                          {sMeaning && sMeaning !== pMeaning && sMeaning !== fMeaning && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{sMeaning}</div>
                          )}
                        </div>
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

                    {/* Note Column: Primary on Top */}
                    <td className="px-3.5 py-2.5 align-top text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                      {primaryLang !== "ko" ? (
                        (fNoteTrans || note) ? (
                          <div className="space-y-1">
                            <div className="font-medium text-slate-800 dark:text-slate-200">{fNoteTrans || note}</div>
                            {sNoteTrans && sNoteTrans !== fNoteTrans && (
                              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                                {sNoteTrans}
                              </div>
                            )}
                            {note && note !== fNoteTrans && (
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                                🇰🇷 {note}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )
                      ) : (
                        note ? (
                          <div className="space-y-1">
                            <div className="text-slate-700 dark:text-slate-200">{note}</div>
                            {fNoteTrans && fNoteTrans !== note && (
                              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded">
                                {fNoteTrans}
                              </div>
                            )}
                            {sNoteTrans && sNoteTrans !== note && sNoteTrans !== fNoteTrans && (
                              <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-800/60 px-2 py-0.5 rounded">
                                {sNoteTrans}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )
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
                const fMeaning = isDualMode && firstTransLang && meaningObj ? (meaningObj[firstTransLang] || "") : "";
                const sMeaning = secondTransLang && meaningObj ? (meaningObj[secondTransLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const fNoteTrans = isDualMode && firstTransLang && noteObj ? (noteObj[firstTransLang] || "") : "";
                const sNoteTrans = secondTransLang && noteObj ? (noteObj[secondTransLang] || "") : "";

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

function RenderExampleList({
  list,
  firstTransLang,
  secondTransLang,
  isDualMode,
  wordMeanings
}: {
  list: ExampleListBlock;
  firstTransLang?: AnchorLanguage | null;
  secondTransLang?: AnchorLanguage | null;
  isDualMode?: boolean;
  wordMeanings?: Record<string, Record<string, string>>;
}) {
  return (
    <div className="space-y-2.5">
      {list.title && !/^\s*\(\d+\)\s*$/.test(list.title) && (
        <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
          {list.title}
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {list.items.map((rawItem, idx) => {
          const item = rawItem.replace(/ː\s*/g, ":").replace(/：\s*/g, ":");
          const match = item.match(/^([^\[\]]+)(\[[^\[\]]+\])(.*)$/);
          if (match) {
            const [, word, pron, rest] = match;
            const trimmedWord = word.trim();
            const fMeaning = (isDualMode && firstTransLang && wordMeanings) ? wordMeanings[trimmedWord]?.[firstTransLang] : null;
            const sMeaning = (secondTransLang && wordMeanings) ? wordMeanings[trimmedWord]?.[secondTransLang] : null;
            return (
              <div
                key={idx}
                className="droplet-card flex flex-col justify-between gap-1.5 px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs transition hover:border-indigo-200 dark:hover:border-indigo-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">{trimmedWord}</span>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm sm:text-base border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs">
                    {pron}
                  </span>
                </div>
                {fMeaning && (
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-normal pt-1 border-t border-slate-100 dark:border-slate-700/60 leading-snug">
                    {fMeaning}
                  </div>
                )}
                {sMeaning && sMeaning !== fMeaning && (
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal pt-0.5 leading-snug">
                    {sMeaning}
                  </div>
                )}
                {rest && <span className="text-xs text-slate-400">{rest}</span>}
              </div>
            );
          }
          const trimmedItem = item.trim();
          const fMeaning = (isDualMode && firstTransLang && wordMeanings) ? wordMeanings[trimmedItem]?.[firstTransLang] : null;
          const sMeaning = (secondTransLang && wordMeanings) ? wordMeanings[trimmedItem]?.[secondTransLang] : null;
          return (
            <div
              key={idx}
              className="droplet-card px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-2xs space-y-1.5"
            >
              <div className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100">{trimmedItem}</div>
              {fMeaning && (
                <div className="text-xs text-indigo-600 dark:text-indigo-400 font-normal pt-1 border-t border-slate-100 dark:border-slate-700/60 leading-snug">
                  {fMeaning}
                </div>
              )}
              {sMeaning && sMeaning !== fMeaning && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal pt-0.5 leading-snug">
                  {sMeaning}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Render formatted explanatory callout with bilingual translation support */
function RenderExampleText({
  text,
  firstTransLang,
  secondTransLang,
  isDualMode,
  noteTranslations
}: {
  text: ExampleTextBlock;
  firstTransLang: AnchorLanguage | null;
  secondTransLang?: AnchorLanguage | null;
  isDualMode: boolean;
  noteTranslations?: Record<string, Record<string, string>>;
}) {
  const trimmed = text.content?.trim() || "";
  if (/^\(\d+\)$/.test(trimmed)) {
    return null;
  }

  const fNoteTrans = (isDualMode && firstTransLang && noteTranslations) ? noteTranslations[trimmed]?.[firstTransLang] : null;
  const sNoteTrans = (secondTransLang && noteTranslations) ? noteTranslations[trimmed]?.[secondTransLang] : null;

  return (
    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-1.5 leading-relaxed">
      <div className="text-xs sm:text-sm font-medium text-indigo-950 dark:text-indigo-200">
        {text.content}
      </div>
      {fNoteTrans && fNoteTrans !== text.content && (
        <div className="text-xs text-indigo-700 dark:text-indigo-300 font-normal pt-1 border-t border-indigo-100/70 dark:border-indigo-900/50">
          {fNoteTrans}
        </div>
      )}
      {sNoteTrans && sNoteTrans !== text.content && sNoteTrans !== fNoteTrans && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 font-normal pt-0.5">
          {sNoteTrans}
        </div>
      )}
    </div>
  );
}

function RenderFormattedCommentary({
  text,
  isSecondary = false
}: {
  text: string;
  isSecondary?: boolean;
}) {
  if (!text) return null;

  // Clean fullwidth/triangular colons to halfwidth colon and remove unintended spacing
  const cleanText = text
    .replace(/ː\s*/g, ":")
    .replace(/：\s*/g, ":");

  // Check if text contains a markdown table
  if (cleanText.includes("|") && cleanText.includes(String.fromCharCode(10) + "|")) {
    const lines = cleanText.split(String.fromCharCode(10));
    const preTableLines: string[] = [];
    const tableLines: string[] = [];
    let inTable = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        inTable = true;
        tableLines.push(trimmed);
      } else if (!inTable) {
        preTableLines.push(line);
      }
    }

    if (tableLines.length >= 2) {
      const headerLine = tableLines[0];
      const headers = headerLine.split("|").slice(1, -1).map(h => h.trim());
      // Skip delimiter row (tableLines[1])
      const rowLines = tableLines.slice(2);
      const rows = rowLines.map(r => r.split("|").slice(1, -1).map(c => c.trim()));
      const introText = preTableLines.join(" ").trim();

      return (
        <div className="space-y-3">
          {introText && (
            <p className={isSecondary
              ? "text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed"
              : "text-base sm:text-lg font-normal text-slate-800 dark:text-slate-100 leading-relaxed"
            }>
              {introText}
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-amber-300/70 dark:border-amber-800/60 bg-white/95 dark:bg-slate-900/90 shadow-xs my-2">
            <table className="min-w-full text-xs sm:text-sm divide-y divide-amber-200 dark:divide-amber-800/60">
              <thead className="bg-amber-100/70 dark:bg-amber-950/70 text-slate-800 dark:text-slate-100 font-bold">
                <tr>
                  {headers.map((h, i) => (
                    <th key={i} className="px-3 py-2.5 text-center first:text-left whitespace-nowrap border-r border-amber-200/50 dark:border-amber-800/40 last:border-r-0">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100 dark:divide-amber-900/40">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`px-3 py-2 text-center first:text-left border-r border-amber-100 dark:border-amber-900/30 last:border-r-0 ${
                          cIdx === 0
                            ? "font-semibold text-slate-700 dark:text-slate-300 bg-amber-50/30 dark:bg-amber-950/20"
                            : cell === "-"
                            ? "text-slate-300 dark:text-slate-600"
                            : "font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm sm:text-base"
                        }`}
                      >
                        {cell.replace(/\*\*/g, "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    }
  }

  // Standard paragraph rendering
  return (
    <p className={isSecondary
      ? "text-sm sm:text-base font-normal text-slate-600 dark:text-slate-300 leading-relaxed"
      : "text-base sm:text-lg font-normal text-slate-800 dark:text-slate-100 leading-relaxed"
    }>
      {cleanText}
    </p>
  );
}

export function KoreanStandardsView() {
  const { locale, secondaryLocale, secondaryLocales, isBilingual } = useLearner();

  // Load articles & dictionary via static asset fetch to keep Worker code size under Cloudflare limit
  const [articles, setArticles] = useState<StandardArticle[]>(() => cachedArticles || []);
  const [wordMeanings, setWordMeanings] = useState<Record<string, Record<string, string>>>(() => cachedMeanings || {});
  const [noteTranslations, setNoteTranslations] = useState<Record<string, Record<string, string>>>(() => cachedNotes || {});
  const [commentaryParagraphs, setCommentaryParagraphs] = useState<Record<string, Array<Record<string, string>>>>(() => cachedParagraphs || {});
  const [loading, setLoading] = useState<boolean>(!cachedArticles);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        if (!cachedArticles) {
          const res = await fetch("/standards/korean_norms_anchor.json");
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data: StandardArticle[] = await res.json();
          cachedArticles = data;
          if (active) setArticles(data);
        } else if (active) {
          setArticles(cachedArticles);
        }

        if (!cachedMeanings) {
          const mRes = await fetch("/standards/word_meanings.json");
          if (mRes.ok) {
            const mData = await mRes.json();
            cachedMeanings = mData;
            if (active) setWordMeanings(mData);
          }
        } else if (active) {
          setWordMeanings(cachedMeanings);
        }

        if (!cachedNotes) {
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
        console.error("Failed to load standards assets:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Client-side synchronized secondary locales to handle dynamic changes from header popover
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
    const isAnchorCode = (c: string): c is AnchorLanguage => ANCHOR_LANGUAGES.some(a => a.code === c);

    if (clientSec.secondaryLocales && clientSec.secondaryLocales.length > 0) {
      for (const loc of clientSec.secondaryLocales) {
        const parsed = toAnchorLang(loc, "ko");
        if (parsed !== primaryLang && isAnchorCode(parsed)) {
          return parsed;
        }
      }
    }
    if (clientSec.secondaryLocale) {
      const parsed = toAnchorLang(clientSec.secondaryLocale, "ko");
      if (parsed !== primaryLang && isAnchorCode(parsed)) {
        return parsed;
      }
    }
    if (secondaryLocales && secondaryLocales.length > 0) {
      for (const loc of secondaryLocales) {
        const parsed = toAnchorLang(loc, "ko");
        if (parsed !== primaryLang && isAnchorCode(parsed)) {
          return parsed;
        }
      }
    }
    if (secondaryLocale) {
      const parsed = toAnchorLang(secondaryLocale, "ko");
      if (parsed !== primaryLang && isAnchorCode(parsed)) {
        return parsed;
      }
    }
    return primaryLang === "ko" ? "vi" : "ko";
  }, [clientSec, secondaryLocales, secondaryLocale, primaryLang]);

  // Bilingual mode enabled check
  const showBilingual: boolean = useMemo(() => {
    if (clientSec.isBilingual || clientSec.displayMode === "bilingual" || isBilingual) {
      return true;
    }
    if (clientSec.secondaryLocales && clientSec.secondaryLocales.length > 0) {
      return true;
    }
    if (clientSec.secondaryLocale && clientSec.secondaryLocale !== primaryLang) {
      return true;
    }
    return Boolean((secondaryLocales && secondaryLocales.length > 0) || (secondaryLocale && secondaryLocale !== primaryLang));
  }, [clientSec, isBilingual, primaryLang, secondaryLocales, secondaryLocale]);

  // Primary translation language:
  // If primary is not Korean (e.g. Vietnamese learner mode), first translation is that foreign language.
  // If primary is Korean and bilingual is enabled, first translation is the chosen secondary language.
  const firstTransLang = useMemo<AnchorLanguage | null>(() => {
    if (primaryLang !== "ko") return primaryLang;
    if (showBilingual && secondaryLang !== "ko") return secondaryLang;
    return null;
  }, [primaryLang, showBilingual, secondaryLang]);

  // Secondary translation language:
  // When primary locale is a foreign language (e.g. 'en') and a secondary foreign language is selected (e.g. 'vi'),
  // render secondary foreign translation underneath the primary translation.
  const secondTransLang = useMemo<AnchorLanguage | null>(() => {
    if (primaryLang !== "ko" && showBilingual && secondaryLang !== "ko" && secondaryLang !== primaryLang) {
      return secondaryLang;
    }
    return null;
  }, [primaryLang, showBilingual, secondaryLang]);

  const targetLang = firstTransLang;
  const isDualMode = Boolean(firstTransLang && firstTransLang !== "ko");
  const isTriMode = Boolean(secondTransLang && secondTransLang !== "ko");

  // In-page secondary language switcher helper
  const setSecondaryLanguage = (lang: AnchorLanguage | "off") => {
    if (lang === "off") {
      try {
        localStorage.setItem("life_help_display_mode", "monolingual");
        localStorage.removeItem("life_help_secondary_locale");
        localStorage.setItem("life_help_secondary_locales", JSON.stringify([]));
      } catch {}
      window.dispatchEvent(new Event("life_help_display_mode_change"));
      window.dispatchEvent(new Event("life_help_secondary_locale_change"));
      setClientSec(prev => ({
        ...prev,
        isBilingual: false,
        displayMode: "monolingual",
        secondaryLocale: null,
        secondaryLocales: []
      }));
    } else {
      try {
        localStorage.setItem("life_help_display_mode", "bilingual");
        localStorage.setItem("life_help_secondary_locale", lang);
        localStorage.setItem("life_help_secondary_locales", JSON.stringify([lang]));
      } catch {}
      window.dispatchEvent(new Event("life_help_display_mode_change"));
      window.dispatchEvent(new Event("life_help_secondary_locale_change"));
      setClientSec(prev => ({
        ...prev,
        isBilingual: true,
        displayMode: "bilingual",
        secondaryLocale: lang,
        secondaryLocales: [lang]
      }));
    }
  };

  // Always keep Korean base text prominent, with target language translation underneath
  const uiBase = UI_TEXTS.ko;
  const uiPrimary = UI_TEXTS[primaryLang] || uiBase;
  const uiFirst = firstTransLang ? (UI_TEXTS[firstTransLang] || null) : null;
  const uiSecond = secondTransLang ? (UI_TEXTS[secondTransLang] || null) : null;
  const uiTarget = uiFirst;

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
      if (selectedPart !== "all" && art.partNum !== selectedPart) {
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-36 sm:pb-40 space-y-6 sm:space-y-8 font-sans antialiased text-slate-800 dark:text-slate-100">
      {/* Header Banner - LIFE.HELP Droplet Banner Design Code */}
      <div className="droplet-banner border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200 dark:border-indigo-800 shadow-2xs">
              <span>📜</span>
              <span>{primaryLang === "ko" ? "대한민국 국립국어원 공식 어문 규정" : (uiPrimary.badge || "National Institute of Korean Language Official Norms")}</span>
            </div>
            {/* Title: Primary on Top, Bilingual Underneath, Korean Reference */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
              {primaryLang !== "ko" && uiPrimary.title ? (
                <>
                  <span>{uiPrimary.title}</span>
                  {secondTransLang && uiSecond && uiSecond.title !== uiPrimary.title && (
                    <span className="block mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                      {uiSecond.title}
                    </span>
                  )}
                  <span className="block mt-1 text-sm sm:text-base font-semibold text-slate-500 dark:text-slate-400">
                    🇰🇷 {uiBase.title}
                  </span>
                </>
              ) : (
                <>
                  <span>{uiBase.title}</span>
                  {isDualMode && uiTarget && uiTarget.title !== uiBase.title && (
                    <span className="block mt-1 text-lg sm:text-xl lg:text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                      {uiTarget.title}
                    </span>
                  )}
                </>
              )}
            </h1>

            {/* Subtitle: Primary on Top, Bilingual Underneath, Korean Reference */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
              {primaryLang !== "ko" && uiPrimary.subtitle ? (
                <>
                  <span>{uiPrimary.subtitle}</span>
                  {secondTransLang && uiSecond && uiSecond.subtitle !== uiPrimary.subtitle && (
                    <span className="block mt-0.5 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                      {uiSecond.subtitle}
                    </span>
                  )}
                  <span className="block mt-0.5 text-slate-500 dark:text-slate-400 text-xs">
                    🇰🇷 {uiBase.subtitle}
                  </span>
                </>
              ) : (
                <>
                  <span>{uiBase.subtitle}</span>
                  {isDualMode && uiTarget && uiTarget.subtitle !== uiBase.subtitle && (
                    <span className="block mt-0.5 text-indigo-600 dark:text-indigo-400 font-medium">
                      {uiTarget.subtitle}
                    </span>
                  )}
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Controls Bar - LIFE.HELP Droplet Card & Uniform Height / Font */}
      <div className="droplet-card p-3 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
          {/* Part Filter Tabs: Uniform h-10, text-xs, font-bold */}
          <div className="h-10 droplet-card flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => { setSelectedPart("all"); setSelectedChapter("all"); }}
              className={`h-full px-3 inline-flex items-center justify-center text-xs font-bold droplet-btn transition whitespace-nowrap ${
                selectedPart === "all"
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{primaryLang === "ko" ? uiBase.allArticles : (uiPrimary.allArticles || uiBase.allArticles)} (56)</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(1); setSelectedChapter("all"); }}
              className={`h-full px-3 inline-flex items-center justify-center text-xs font-bold droplet-btn transition whitespace-nowrap ${
                selectedPart === 1
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{primaryLang === "ko" ? uiBase.part1Tab : (uiPrimary.part1Tab || uiBase.part1Tab)} (26)</span>
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPart(2); setSelectedChapter("all"); }}
              className={`h-full px-3 inline-flex items-center justify-center text-xs font-bold droplet-btn transition whitespace-nowrap ${
                selectedPart === 2
                  ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <span>{primaryLang === "ko" ? uiBase.part2Tab : (uiPrimary.part2Tab || uiBase.part2Tab)} (30)</span>
            </button>
          </div>

          {/* Chapter Selector Dropdown: Uniform h-10, text-xs, font-bold */}
          <div className="flex-1 min-w-[180px]">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="h-10 w-full droplet-card text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="all">
                {primaryLang === "ko" ? uiBase.allChapters : (uiPrimary.allChapters || uiBase.allChapters)}
                {isDualMode && uiTarget && uiTarget.allChapters !== (uiPrimary.allChapters || uiBase.allChapters) ? ` (${uiTarget.allChapters})` : ""}
              </option>
              {availableChapters.map((ch) => {
                const trPrimary = primaryLang !== "ko" ? (CHAPTER_TRANSLATIONS[primaryLang]?.[ch] || ch) : ch;
                const trTarget = targetLang ? (CHAPTER_TRANSLATIONS[targetLang]?.[ch] || ch) : null;
                const label = isDualMode && trTarget && trTarget !== trPrimary ? `${trPrimary} (${trTarget})` : trPrimary;
                return (
                  <option key={ch} value={ch}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Input: Uniform h-10, text-xs, font-bold */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={primaryLang === "ko" ? (isDualMode && uiTarget && uiTarget.searchPlaceholder !== uiBase.searchPlaceholder ? `${uiBase.searchPlaceholder} (${uiTarget.searchPlaceholder})` : uiBase.searchPlaceholder) : (uiPrimary.searchPlaceholder || uiBase.searchPlaceholder)}
              className="h-10 w-full droplet-card text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Toggle All Button: Uniform h-10, text-xs, font-bold */}
          <button
            type="button"
            onClick={toggleAll}
            className="h-10 droplet-btn px-3.5 inline-flex items-center justify-center text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition shrink-0 cursor-pointer whitespace-nowrap"
          >
            <span>{allExpanded ? (primaryLang === "ko" ? uiBase.collapseAll : uiPrimary.collapseAll) : (primaryLang === "ko" ? uiBase.expandAll : uiPrimary.expandAll)}</span>
          </button>
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
              const firstTrans = firstTransLang ? (art.i18n[firstTransLang] || null) : null;
              const secondTrans = secondTransLang ? (art.i18n[secondTransLang] || null) : null;
              const targetTrans = firstTrans;
              const isExpanded = !!expandedArticles[art.id];
              const validStructured = (art.structuredExamples || []).filter(
                (b) => !(b.type === "text" && /^\s*\(\d+\)\s*$/.test(b.content || ""))
              );
              const hasStructured = validStructured.length > 0;
              const hasDetails = (art.details && art.details.length > 0) || hasStructured;
              const isPart1 = art.partNum === 1;

              return (
                <article
                  key={art.id}
                  id={art.id}
                  className="droplet-card bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Article Header Card */}
                  <div className="p-5 sm:p-6 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Part Badge with Primary on Top */}
                        <div className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1.5 flex-wrap ${
                          isPart1
                            ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                            : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                        }`}>
                          <span>{primaryLang !== "ko" ? (firstTrans?.part || (isPart1 ? uiPrimary.part1Tab : uiPrimary.part2Tab)) : (koTrans?.part || (isPart1 ? "제1부 사정 원칙" : "제2부 표준 발음법"))}</span>
                          {secondTransLang && secondTrans?.part && (
                            <span className="opacity-80 font-medium text-[11px]">· {secondTrans.part}</span>
                          )}
                          {primaryLang !== "ko" && secondTransLang !== "ko" && koTrans?.part && (
                            <span className="opacity-60 font-normal text-[10px]">· 🇰🇷 {koTrans.part}</span>
                          )}
                        </div>

                        {/* Chapter Badge */}
                        {(primaryLang !== "ko" ? (firstTrans?.chapter || koTrans?.chapter) : koTrans?.chapter) && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                            <span>{primaryLang !== "ko" ? (firstTrans?.chapter || koTrans?.chapter) : koTrans?.chapter}</span>
                            {secondTransLang && secondTrans?.chapter && (
                              <span className="opacity-80 font-medium text-[11px] text-slate-500">· {secondTrans.chapter}</span>
                            )}
                            {primaryLang !== "ko" && secondTransLang !== "ko" && koTrans?.chapter && (
                              <span className="opacity-60 font-normal text-[10px] text-slate-400">· 🇰🇷 {koTrans.chapter}</span>
                            )}
                          </div>
                        )}

                        {/* Section Badge */}
                        {(primaryLang !== "ko" ? (firstTrans?.section || koTrans?.section) : koTrans?.section) && (
                          <div className="px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
                            <span>{primaryLang !== "ko" ? (firstTrans?.section || koTrans?.section) : koTrans?.section}</span>
                            {secondTransLang && secondTrans?.section && (
                              <span className="opacity-80 font-medium text-[11px] text-slate-400">· {secondTrans.section}</span>
                            )}
                            {primaryLang !== "ko" && secondTransLang !== "ko" && koTrans?.section && (
                              <span className="opacity-60 font-normal text-[10px] text-slate-400">· 🇰🇷 {koTrans.section}</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Article ID */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {primaryLang !== "ko" ? (firstTrans?.title || `Article ${art.articleNum}`) : (koTrans?.title || `제${art.articleNum}항`)}
                        </span>
                        {secondTransLang && secondTrans?.title && (
                          <span className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                            {secondTrans.title}
                          </span>
                        )}
                        {primaryLang !== "ko" && secondTransLang !== "ko" && koTrans?.title && (
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            🇰🇷 {koTrans.title}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rule Text: Primary Language on Top, Bilingual Underneath */}
                    <div className="pt-1">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 select-none">
                          §
                        </span>
                        <div className="flex-1 space-y-2">
                          {primaryLang !== "ko" ? (
                            <>
                              {/* Layer 1: Primary Rule Text ON TOP */}
                              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug tracking-tight">
                                {firstTrans?.rule || koTrans?.rule || ""}
                              </div>
                              {/* Layer 2: Secondary Language Rule Text UNDERNEATH */}
                              {secondTransLang && secondTrans?.rule && secondTrans.rule !== firstTrans?.rule && (
                                <div className="text-sm sm:text-base font-semibold text-indigo-700 dark:text-indigo-300 pt-1.5 border-t border-slate-100 dark:border-slate-800 leading-snug">
                                  {secondTrans.rule}
                                </div>
                              )}
                              {/* Layer 3: Korean Base Norm Text */}
                              {secondTransLang !== "ko" && koTrans?.rule && (
                                <div className="pt-2">
                                  <div className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed">
                                    <span className="font-bold text-slate-700 dark:text-slate-300 mr-1.5">🇰🇷 한국어 원문:</span>
                                    {koTrans.rule}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Korean Rule ON TOP */}
                              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug tracking-tight">
                                {koTrans?.rule || ""}
                              </div>
                              {/* Secondary Rule UNDERNEATH */}
                              {isDualMode && firstTrans?.rule && firstTrans.rule !== koTrans?.rule && (
                                <div className="text-sm sm:text-base font-semibold text-indigo-700 dark:text-indigo-300 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                                  {firstTrans.rule}
                                </div>
                              )}
                            </>
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
                                const fPara = firstTransLang ? (pObj[firstTransLang] || "") : "";
                                const sPara = secondTransLang ? (pObj[secondTransLang] || "") : "";

                                return (
                                  <div
                                    key={pIdx}
                                    className="droplet-card bg-amber-50/40 dark:bg-amber-950/20 p-4 sm:p-5 border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs"
                                  >
                                    {primaryLang !== "ko" ? (
                                      <>
                                        {/* Primary Language Paragraph ON TOP */}
                                        <RenderFormattedCommentary text={fPara || koPara} />

                                        {/* Secondary Language Paragraph UNDERNEATH */}
                                        {secondTransLang && sPara && sPara !== fPara && (
                                          <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                            <RenderFormattedCommentary text={sPara} isSecondary />
                                          </div>
                                        )}

                                        {/* Korean Reference Paragraph */}
                                        {secondTransLang !== "ko" && koPara && koPara !== fPara && (
                                          <div className="pt-1.5 border-t border-amber-200/30 dark:border-amber-900/20 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            <span className="font-bold text-slate-600 dark:text-slate-300 mr-1">🇰🇷 원문:</span>
                                            <RenderFormattedCommentary text={koPara} isSecondary />
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {/* Korean Commentary Paragraph ON TOP */}
                                        <RenderFormattedCommentary text={koPara} />

                                        {/* Secondary Language Paragraph UNDERNEATH */}
                                        {isDualMode && fPara && fPara !== koPara && (
                                          <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                            <RenderFormattedCommentary text={fPara} isSecondary />
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              // Fallback using splitCommentaryParagraphs
                              (() => {
                                const koParas = splitCommentaryParagraphs(koTrans?.explanation || "");
                                const firstParas = isDualMode && firstTrans?.explanation ? splitCommentaryParagraphs(firstTrans.explanation) : [];
                                const secondParas = isTriMode && secondTrans?.explanation ? splitCommentaryParagraphs(secondTrans.explanation) : [];
                                return (
                                  <div className="space-y-3.5">
                                    {koParas.map((para, pIdx) => {
                                      const fPara = firstParas[pIdx] || (pIdx === koParas.length - 1 ? firstParas.slice(pIdx).join("\n\n") : "");
                                      const sPara = secondParas[pIdx] || (pIdx === koParas.length - 1 ? secondParas.slice(pIdx).join("\n\n") : "");
                                      return (
                                        <div
                                          key={pIdx}
                                          className="bg-amber-50/40 dark:bg-amber-950/20 p-5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 space-y-2.5 shadow-2xs"
                                        >
                                          <RenderFormattedCommentary text={para} />
                                          {isDualMode && fPara && fPara !== para && (
                                            <div className="pt-2 border-t border-amber-200/40 dark:border-amber-900/30">
                                              <RenderFormattedCommentary text={fPara} isSecondary />
                                            </div>
                                          )}
                                          {isTriMode && sPara && sPara !== para && sPara !== fPara && (
                                            <div className="pt-1.5 border-t border-amber-200/30 dark:border-amber-900/20 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
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
                          <div>
                            <span>{isExpanded ? uiBase.collapseDetails : uiBase.expandDetails}</span>
                            {isDualMode && uiTarget && (
                              <span className="block text-[10px] font-normal opacity-80 leading-tight">
                                {isExpanded ? uiTarget.collapseDetails : uiTarget.expandDetails}
                              </span>
                            )}
                          </div>
                          {hasStructured && (
                            <span className="text-[11px] opacity-75 font-normal">
                              {uiBase.itemsCount.replace("{count}", validStructured.length.toString())}
                              {isDualMode && uiTarget && (
                                <span className="ml-1 opacity-75">
                                  · {uiTarget.itemsCount.replace("{count}", validStructured.length.toString())}
                                </span>
                              )}
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
                        {isDualMode && uiTarget && uiTarget.examplesTitle !== uiBase.examplesTitle && (
                          <span className="text-[11px] font-normal text-slate-400">· {uiTarget.examplesTitle}</span>
                        )}
                      </div>

                      {hasStructured ? (
                        <div className="space-y-4">
                          {validStructured.map((block, idx) => {
                            if (block.type === "table") {
                              return (
                                <RenderExampleTable
                                  key={idx}
                                  table={block}
                                  firstTransLang={firstTransLang}
                                  secondTransLang={secondTransLang}
                                  isDualMode={isDualMode}
                                  wordMeanings={wordMeanings}
                                  noteTranslations={noteTranslations}
                                />
                              );
                            }
                            if (block.type === "list") {
                              return (
                                <RenderExampleList
                                  key={idx}
                                  list={block}
                                  firstTransLang={firstTransLang}
                                  secondTransLang={secondTransLang}
                                  isDualMode={isDualMode}
                                  wordMeanings={wordMeanings}
                                />
                              );
                            }
                            if (block.type === "text") {
                              return (
                                <RenderExampleText
                                  key={idx}
                                  text={block}
                                  firstTransLang={firstTransLang}
                                  secondTransLang={secondTransLang}
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
                          {art.details?.map((detail, idx) => (
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
      </main>
      {/* Footer Info */}
      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p>대한민국 국립국어원 표준어 규정 (문체부 고시 제2017-13호 등 공인 규범 완비)</p>
        <p className="font-mono text-[11px]">LIFE.HELP Standard Korean Learning Portal · 88-Language Dual Display</p>
      </footer>
    </div>
  );
}
