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
  primaryLang,
  secondaryLang,
  showBilingual,
  wordMeanings,
  noteTranslations
}: {
  table: ExampleTableBlock;
  primaryLang: AnchorLanguage;
  secondaryLang: AnchorLanguage;
  showBilingual: boolean;
  wordMeanings: Record<string, Record<string, string>>;
  noteTranslations: Record<string, Record<string, string>>;
}) {
  const isComparison = table.headers.includes("ㄱ") && table.headers.includes("ㄴ");
  const isMultiStandard = table.headers.includes("복수 표준어");

  const uiP = UI_TEXTS[primaryLang] || UI_TEXTS.ko;
  const uiS = showBilingual ? (UI_TEXTS[secondaryLang] || UI_TEXTS.ko) : null;

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
                    <span>{uiP.colStandard}</span>
                    {uiS && uiS.colStandard !== uiP.colStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiP.colMeaning}</span>
                    {uiS && uiS.colMeaning !== uiP.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-500">
                    <span>{uiP.colNonStandard}</span>
                    {uiS && uiS.colNonStandard !== uiP.colNonStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colNonStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiP.colNote}</span>
                    {uiS && uiS.colNote !== uiP.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colNote}</span>
                    )}
                  </th>
                </>
              ) : isMultiStandard ? (
                <>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-700 dark:text-indigo-300">
                    <span>{uiP.colMultiStandard}</span>
                    {uiS && uiS.colMultiStandard !== uiP.colMultiStandard && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colMultiStandard}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{uiP.colMeaning}</span>
                    {uiS && uiS.colMeaning !== uiP.colMeaning && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colMeaning}</span>
                    )}
                  </th>
                  <th scope="col" className="px-3.5 py-2.5 font-bold text-slate-600 dark:text-slate-300">
                    <span>{uiP.colNote}</span>
                    {uiS && uiS.colNote !== uiP.colNote && (
                      <span className="block text-[11px] font-normal text-slate-400">{uiS.colNote}</span>
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
                const pMeaning = meaningObj?.[primaryLang] || meaningObj?.ko || "";
                const sMeaning = showBilingual && meaningObj ? (meaningObj[secondaryLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const pNoteTrans = noteObj?.[primaryLang] || "";

                return (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    {/* Standard Word */}
                    <td className="px-3.5 py-2.5 align-top font-bold text-slate-900 dark:text-slate-50">
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
                          {pNoteTrans && pNoteTrans !== note && (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded">
                              {pNoteTrans}
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
                const pMeaning = meaningObj?.[primaryLang] || meaningObj?.ko || "";
                const sMeaning = showBilingual && meaningObj ? (meaningObj[secondaryLang] || "") : "";

                const noteObj = (table as any).notesI18n?.[note] || noteTranslations[note] || null;
                const pNoteTrans = noteObj?.[primaryLang] || "";

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
                          {pNoteTrans && pNoteTrans !== note && (
                            <div className="text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 px-2 py-1 rounded">
                              {pNoteTrans}
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

/** Render formatted list of word examples */
function RenderExampleList({ list }: { list: ExampleListBlock }) {
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
}

/** Render formatted explanatory callout */
function RenderExampleText({ text }: { text: ExampleTextBlock }) {
  const trimmed = text.content?.trim() || "";
  // Delete redundant standalone index markers like '(1)', '(2)', '(3)'
  if (/^\(\d+\)$/.test(trimmed)) {
    return null;
  }
  return (
    <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
      {text.content}
    </div>
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

  // Resolve languages dynamically from top header LearnerProvider
  const primaryLang: AnchorLanguage = useMemo(() => {
    return toAnchorLang(locale, "ko");
  }, [locale]);

  const secondaryLang: AnchorLanguage = useMemo(() => {
    const raw = (secondaryLocales && secondaryLocales.length > 0) ? secondaryLocales[0] : secondaryLocale;
    return toAnchorLang(raw, "ko");
  }, [secondaryLocales, secondaryLocale]);

  const showBilingual: boolean = useMemo(() => {
    return !!isBilingual && secondaryLang !== primaryLang;
  }, [isBilingual, secondaryLang, primaryLang]);

  const uiP = UI_TEXTS[primaryLang] || UI_TEXTS.ko;
  const uiS = showBilingual ? (UI_TEXTS[secondaryLang] || UI_TEXTS.ko) : null;

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

      const pTrans = art.i18n[primaryLang] || art.i18n.ko;
      const sTrans = showBilingual ? (art.i18n[secondaryLang] || art.i18n.ko) : null;
      const koTrans = art.i18n.ko;

      if (
        pTrans?.rule?.toLowerCase().includes(q) ||
        pTrans?.explanation?.toLowerCase().includes(q) ||
        pTrans?.title?.toLowerCase().includes(q)
      ) {
        return true;
      }

      if (
        sTrans?.rule?.toLowerCase().includes(q) ||
        sTrans?.explanation?.toLowerCase().includes(q) ||
        sTrans?.title?.toLowerCase().includes(q)
      ) {
        return true;
      }

      if (
        koTrans?.rule?.toLowerCase().includes(q) ||
        koTrans?.explanation?.toLowerCase().includes(q)
      ) {
        return true;
      }

      if (art.details && art.details.some((d) => d.toLowerCase().includes(q))) {
        return true;
      }

      return false;
    });
  }, [primaryLang, secondaryLang, showBilingual, selectedPart, selectedChapter, searchQuery, articles]);

  const toggleExpand = (id: string) => {
    setExpandedArticles((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded: Record<string, boolean> = {};
    for (const art of filteredArticles) {
      newExpanded[art.id] = nextState;
    }
    setExpandedArticles(newExpanded);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Banner with Full Dual Display */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-10 shadow-xl border border-indigo-700/30 text-white">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200 text-xs font-semibold">
            <span>{uiP.badge}</span>
            {uiS && uiS.badge !== uiP.badge && (
              <span className="text-[11px] opacity-75">· {uiS.badge}</span>
            )}
          </div>
          <div>
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
          </div>
        </div>
      </div>

      {/* Filter & Search Bar (Redundant indicator completely deleted) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Quick Action Button */}
        <div className="flex justify-end border-b border-slate-100 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg transition"
          >
            {allExpanded ? uiP.collapseAll : uiP.expandAll}
          </button>
        </div>

        {/* Part Filter Tabs, Chapter Filter & Search Input */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Part Tabs */}
          <div className="md:col-span-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
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
          </div>

          {/* Chapter Selector with Fully Translated & Bilingual Chapter Names */}
          <div className="md:col-span-3">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">{uiP.allChapters}</option>
              {availableChapters.map((ch) => {
                const trP = CHAPTER_TRANSLATIONS[primaryLang]?.[ch] || ch;
                const trS = showBilingual ? (CHAPTER_TRANSLATIONS[secondaryLang]?.[ch] || ch) : null;
                const label = trS && trS !== trP
                  ? `${trP} · ${trS}`
                  : (primaryLang !== "ko" ? `${trP} · ${ch}` : ch);
                return (
                  <option key={ch} value={ch}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Search Input */}
          <div className="md:col-span-4 relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={uiP.searchPlaceholder}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Counter Info with Dual Display */}
        <div className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
          <span>
            {uiP.showingCount.replace("{count}", filteredArticles.length.toString())}
            {primaryLang !== "ko" && (
              <span className="opacity-75 ml-1.5 font-light">
                (총 {filteredArticles.length}개 조항)
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-16 bg-slate-100 dark:bg-slate-800/60 rounded"></div>
            </div>
          ))}
        </div>
      )}

      {/* Articles List */}
      {!loading && (
        <div className="space-y-6">
          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
              <p className="text-3xl mb-2">🔍</p>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{uiP.noMatchTitle}</h3>
              <p className="text-xs text-slate-500 mt-1">{uiP.noMatchDesc}</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedPart("all"); setSelectedChapter("all"); }}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition"
              >
                {uiP.resetFilter}
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

                      {/* Article ID */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded">
                          {pTrans?.title || `제${art.articleNum}항`}
                        </span>
                      </div>
                    </div>

                    {/* Rule Text (No ugly tag badges) */}
                    <div className="pt-1">
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400 select-none">
                          §
                        </span>
                        <div className="flex-1 space-y-2">
                          {/* Primary Rule */}
                          <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 leading-snug tracking-tight">
                            {pTrans?.rule || ""}
                          </div>
                          {/* Secondary Rule (Bilingual) */}
                          {sTrans && sTrans.rule && sTrans.rule !== pTrans.rule && (
                            <div className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 leading-snug">
                              {sTrans.rule}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Explanation Section (Faithful Paragraph-by-Paragraph Alignment & Dual Bilingual Mode) */}
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
                    })()}

                    {/* Details Toggle Button */}
                    {hasDetails && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(art.id)}
                          className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 px-3.5 py-1.5 rounded-lg transition"
                        >
                          <span>{isExpanded ? uiP.collapseDetails : uiP.expandDetails}</span>
                          {hasStructured && (
                            <span className="text-[11px] opacity-75 font-normal">
                              {uiP.itemsCount.replace("{count}", (art.structuredExamples?.length || 0).toString())}
                            </span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Details Accordion Content (Structured Tables with Meanings, Lists, & Text) */}
                  {hasDetails && isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-5 sm:p-6 space-y-4">
                      <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span>{uiP.examplesTitle}</span>
                      </div>

                      {hasStructured ? (
                        <div className="space-y-4">
                          {art.structuredExamples?.map((block, idx) => {
                            if (block.type === "table") {
                              return (
                                <RenderExampleTable
                                  key={idx}
                                  table={block}
                                  primaryLang={primaryLang}
                                  secondaryLang={secondaryLang}
                                  showBilingual={showBilingual}
                                  wordMeanings={wordMeanings}
                                  noteTranslations={noteTranslations}
                                />
                              );
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
      )}

      {/* Footer Info */}
      <footer className="text-center py-6 text-xs text-slate-400 dark:text-slate-500 space-y-1">
        <p>대한민국 국립국어원 표준어 규정 (문체부 고시 제2017-13호 등 공인 규범 완비)</p>
        <p className="font-mono text-[11px]">LIFE.HELP Standard Korean Learning Portal · 88-Language Dual Display</p>
      </footer>
    </div>
  );
}
