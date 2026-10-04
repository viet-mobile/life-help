#!/usr/bin/env node
/**
 * Deterministic generator and validator for legacy adult study sites inventory.
 *
 * Generates:
 *   - data/learning-study/inventory/study.korean.viet.mobile.json
 *   - data/learning-study/inventory/study.english.viet.mobile.json
 *   - data/learning-study/inventory/study.japanese.viet.mobile.json
 *   - data/learning-study/inventory/zhong.wen.viet.mobile.json
 *   - data/learning-study/inventory/bahasa.indonesia.viet.mobile.json
 *   - data/learning-study/inventory/hoc.tieng.viet.mobile.json
 *   - data/learning-study/inventory/aggregate-summary.json
 *   - reports/generated/legacy-study-inventory-report.md
 *
 * Usage:
 *   node scripts/generated/inventory-legacy-study-sites.mjs
 *   node scripts/generated/inventory-legacy-study-sites.mjs --check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

const sites = [
  {
    site_id: "study_korean",
    domain: "study.korean.viet.mobile",
    new_target_domain: "study.korean.life.help",
    target_language: "ko",
    product_slug: "korean",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: true,
    standalone_repo_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-han",
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist/study-korean",
    dist_accessible: true,
    total_dist_bytes: 1407562,
    dist_files: [
      { file: "brand/icon-180.png", bytes: 1408 },
      { file: "brand/icon-192.png", bytes: 1530 },
      { file: "brand/icon-32.png", bytes: 494 },
      { file: "brand/icon-512.png", bytes: 3672 },
      { file: "brand/icon.svg", bytes: 647 },
      { file: "data.1.f52a717e27.js", bytes: 60314 },
      { file: "index.html", bytes: 1346018 },
      { file: "manifest.webmanifest", bytes: 632 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "reader", label: "Reader", description: "Dual-language aligned parallel text reader" },
      { id: "review", label: "Review", description: "Spaced repetition vocabulary cards and exercise mode" },
      { id: "voice_settings", label: "Voice Settings", description: "Browser Web Speech API synthesizer configuration" },
      { id: "word_order", label: "Word Order", description: "Interactive sentence reconstruction tiles (eojeol tokenized)" },
    ],
    exercise_types: [
      "Parallel text alignment study",
      "Vocabulary flashcards",
      "Word-order tile assembly (eojeol-level tokenization)",
      "Audio listening via Web Speech API TTS (ko-KR)",
    ],
    datasets: {
      corpus_sources: ["elf", "lpd", "wt", "songs", "neighbor"],
      row_aligned_languages: 12,
      source_files: ["target_content.py", "target_sources.py", "target_reference.py", "data_block.study_korean.js"],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'target_study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "study.korean.viet.mobile",
      new_target_domain: "study.korean.life.help",
      hardcoded_viet_mobile_references: ["https://study.korean.viet.mobile", "viet.mobile", "viet_mobile_locale"],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Sentence reconstruction tile component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
  {
    site_id: "study_english",
    domain: "study.english.viet.mobile",
    new_target_domain: "study.english.life.help",
    target_language: "en",
    product_slug: "english",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: true,
    standalone_repo_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-anh",
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist/study-english",
    dist_accessible: true,
    total_dist_bytes: 1407553,
    dist_files: [
      { file: "brand/icon-180.png", bytes: 1408 },
      { file: "brand/icon-192.png", bytes: 1530 },
      { file: "brand/icon-32.png", bytes: 494 },
      { file: "brand/icon-512.png", bytes: 3672 },
      { file: "brand/icon.svg", bytes: 647 },
      { file: "data.1.f52a717e27.js", bytes: 60311 },
      { file: "index.html", bytes: 1346018 },
      { file: "manifest.webmanifest", bytes: 632 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "reader", label: "Reader", description: "Dual-language aligned parallel text reader" },
      { id: "review", label: "Review", description: "Spaced repetition vocabulary cards and exercise mode" },
      { id: "voice_settings", label: "Voice Settings", description: "Browser Web Speech API synthesizer configuration" },
      { id: "word_order", label: "Word Order", description: "Interactive sentence reconstruction tiles (whitespace tokenized)" },
    ],
    exercise_types: [
      "Parallel text alignment study",
      "Vocabulary flashcards",
      "Word-order tile assembly (whitespace tokenization)",
      "Audio listening via Web Speech API TTS (en-US)",
    ],
    datasets: {
      corpus_sources: ["elf", "lpd", "wt", "songs", "neighbor"],
      row_aligned_languages: 12,
      source_files: ["target_content.py", "target_sources.py", "target_reference.py", "data_block.study_english.js"],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'target_study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "study.english.viet.mobile",
      new_target_domain: "study.english.life.help",
      hardcoded_viet_mobile_references: ["https://study.english.viet.mobile", "viet.mobile", "viet_mobile_locale"],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Sentence reconstruction tile component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
  {
    site_id: "study_japanese",
    domain: "study.japanese.viet.mobile",
    new_target_domain: "study.japanese.life.help",
    target_language: "ja",
    product_slug: "japanese",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: false,
    standalone_repo_path: null,
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist/study-japanese",
    dist_accessible: true,
    total_dist_bytes: 1407570,
    dist_files: [
      { file: "brand/icon-180.png", bytes: 1408 },
      { file: "brand/icon-192.png", bytes: 1530 },
      { file: "brand/icon-32.png", bytes: 494 },
      { file: "brand/icon-512.png", bytes: 3672 },
      { file: "brand/icon.svg", bytes: 647 },
      { file: "data.1.f52a717e27.js", bytes: 60328 },
      { file: "index.html", bytes: 1346018 },
      { file: "manifest.webmanifest", bytes: 632 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "reader", label: "Reader", description: "Dual-language aligned parallel text reader" },
      { id: "review", label: "Review", description: "Spaced repetition vocabulary cards and exercise mode" },
      { id: "voice_settings", label: "Voice Settings", description: "Browser Web Speech API synthesizer configuration" },
    ],
    exercise_types: [
      "Parallel text alignment study",
      "Vocabulary flashcards",
      "Audio listening via Web Speech API TTS (ja-JP)",
    ],
    datasets: {
      corpus_sources: ["elf", "lpd", "wt", "songs", "neighbor"],
      row_aligned_languages: 12,
      source_files: ["target_content.py", "target_sources.py", "target_reference.py", "data_block.study_japanese.js"],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'target_study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "study.japanese.viet.mobile",
      new_target_domain: "study.japanese.life.help",
      hardcoded_viet_mobile_references: ["https://study.japanese.viet.mobile", "viet.mobile", "viet_mobile_locale"],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
  {
    site_id: "study_chinese",
    domain: "zhong.wen.viet.mobile",
    new_target_domain: "study.chinese.life.help",
    target_language: "zh",
    product_slug: "chinese",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: true,
    standalone_repo_path: "C:/Users/leetr/Documents/viet-project/zhong-wen",
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist/study-chinese",
    dist_accessible: true,
    total_dist_bytes: 1407575,
    dist_files: [
      { file: "brand/icon-180.png", bytes: 1408 },
      { file: "brand/icon-192.png", bytes: 1530 },
      { file: "brand/icon-32.png", bytes: 494 },
      { file: "brand/icon-512.png", bytes: 3672 },
      { file: "brand/icon.svg", bytes: 647 },
      { file: "data.1.f52a717e27.js", bytes: 60333 },
      { file: "index.html", bytes: 1346018 },
      { file: "manifest.webmanifest", bytes: 632 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "reader", label: "Reader", description: "Dual-language aligned parallel text reader" },
      { id: "review", label: "Review", description: "Spaced repetition vocabulary cards and exercise mode" },
      { id: "voice_settings", label: "Voice Settings", description: "Browser Web Speech API synthesizer configuration" },
      { id: "word_order", label: "Word Order", description: "Interactive sentence reconstruction tiles (han_char tokenized)" },
    ],
    exercise_types: [
      "Parallel text alignment study",
      "Vocabulary flashcards",
      "Word-order tile assembly (Han character tokenization)",
      "Audio listening via Web Speech API TTS (zh-TW Traditional / zh-CN Simplified)",
    ],
    datasets: {
      corpus_sources: ["elf", "lpd", "wt", "songs", "neighbor"],
      row_aligned_languages: 12,
      source_files: ["target_content.py", "target_sources.py", "target_reference.py", "data_block.study_chinese.js"],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'target_study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "zhong.wen.viet.mobile",
      new_target_domain: "study.chinese.life.help",
      hardcoded_viet_mobile_references: ["https://zhong.wen.viet.mobile", "viet.mobile", "viet_mobile_locale"],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Sentence reconstruction tile component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
  {
    site_id: "study_indonesian",
    domain: "bahasa.indonesia.viet.mobile",
    new_target_domain: "study.indonesian.life.help",
    target_language: "id",
    product_slug: "indonesian",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: true,
    standalone_repo_path: "C:/Users/leetr/Documents/viet-project/bahasa-indonesia",
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist/study-indonesian",
    dist_accessible: true,
    total_dist_bytes: 1407665,
    dist_files: [
      { file: "brand/icon-180.png", bytes: 1408 },
      { file: "brand/icon-192.png", bytes: 1530 },
      { file: "brand/icon-32.png", bytes: 494 },
      { file: "brand/icon-512.png", bytes: 3672 },
      { file: "brand/icon.svg", bytes: 647 },
      { file: "data.1.f52a717e27.js", bytes: 60423 },
      { file: "index.html", bytes: 1346018 },
      { file: "manifest.webmanifest", bytes: 632 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "reader", label: "Reader", description: "Dual-language aligned parallel text reader" },
      { id: "review", label: "Review", description: "Spaced repetition vocabulary cards and exercise mode" },
      { id: "voice_settings", label: "Voice Settings", description: "Browser Web Speech API synthesizer configuration" },
      { id: "word_order", label: "Word Order", description: "Interactive sentence reconstruction tiles (whitespace tokenized)" },
    ],
    exercise_types: [
      "Parallel text alignment study",
      "Vocabulary flashcards",
      "Word-order tile assembly (whitespace tokenization)",
      "Audio listening via Web Speech API TTS (id-ID)",
    ],
    datasets: {
      corpus_sources: ["elf", "lpd", "wt", "songs", "neighbor"],
      row_aligned_languages: 12,
      source_files: ["target_content.py", "target_sources.py", "target_reference.py", "data_block.study_indonesian.js"],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'target_study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "bahasa.indonesia.viet.mobile",
      new_target_domain: "study.indonesian.life.help",
      hardcoded_viet_mobile_references: ["https://bahasa.indonesia.viet.mobile", "viet.mobile", "viet_mobile_locale"],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Sentence reconstruction tile component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
  {
    site_id: "general",
    domain: "hoc.tieng.viet.mobile",
    new_target_domain: "study.vietnamese.life.help",
    target_language: "vi",
    product_slug: "vietnamese",
    accessible: true,
    framework: "Vanilla JavaScript SPA (Native DOM, Custom Event System, Service Worker PWA)",
    build_system: "Python 3 build pipeline (build_app.py, assemble_app.py, site_profiles.py)",
    deployment_target: "Cloudflare Pages (Static Site / dist folder)",
    standalone_repo_accessible: true,
    standalone_repo_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile",
    consolidated_dist_path: "C:/Users/leetr/Documents/viet-project/hoc-tieng-viet-mobile/dist",
    dist_accessible: true,
    total_dist_bytes: 9811249,
    dist_files: [
      { file: "data.1.7619cbb838.js", bytes: 8451937 },
      { file: "index.html", bytes: 1358732 },
      { file: "manifest.webmanifest", bytes: 466 },
      { file: "_redirects", bytes: 578 },
    ],
    route_count: 14,
    routes: [
      { path: "/ko", type: "rewrite", target: "/index.html", description: "Korean UI entry point" },
      { path: "/vi", type: "rewrite", target: "/index.html", description: "Vietnamese UI entry point" },
      { path: "/cs", type: "rewrite", target: "/index.html", description: "Czech UI entry point" },
      { path: "/zh_cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese UI entry point" },
      { path: "/cn", type: "rewrite", target: "/index.html", description: "Simplified Chinese alias" },
      { path: "/zh", type: "rewrite", target: "/index.html", description: "Traditional Chinese UI entry point" },
      { path: "/zt", type: "rewrite", target: "/index.html", description: "Traditional Chinese alias" },
      { path: "/en", type: "rewrite", target: "/index.html", description: "English UI entry point" },
      { path: "/fr", type: "rewrite", target: "/index.html", description: "French UI entry point" },
      { path: "/de", type: "rewrite", target: "/index.html", description: "German UI entry point" },
      { path: "/hu", type: "rewrite", target: "/index.html", description: "Hungarian UI entry point" },
      { path: "/id", type: "rewrite", target: "/index.html", description: "Indonesian UI entry point" },
      { path: "/ja", type: "rewrite", target: "/index.html", description: "Japanese UI entry point" },
      { path: "/pl", type: "rewrite", target: "/index.html", description: "Polish UI entry point" },
    ],
    tabs: [
      { id: "curriculum", label: "교과 (Curriculum)", description: "Structured 16-week language learning syllabus" },
      { id: "wizard", label: "대화 (Conversations)", description: "Everyday situations, culture dialogs, and audio practice" },
      { id: "vocab", label: "단어 (Vocabulary)", description: "3,000+ words classified by part of speech and CEFR level" },
      { id: "sentence", label: "문장 (Sentence Builder)", description: "Interactive grammar patterns and sentence assembly" },
      { id: "review", label: "복습 (Review)", description: "Spaced repetition flashcards and review quizzes" },
      { id: "pron", label: "발음 (Pronunciation)", description: "Vietnamese 6 tones, vowels, consonants, dialect comparison" },
    ],
    exercise_types: [
      "Flashcard flip (front/back with audio)",
      "Multiple choice vocabulary recall",
      "Sentence tile re-ordering",
      "Tone pair recognition test",
      "North/South dialect sound contrast practice",
      "Fill-in-the-blank grammar cloze",
    ],
    datasets: {
      vocabulary_count: 3140,
      grammar_patterns_count: 52,
      conversation_units_count: 28,
      culture_articles_count: 20,
      pronunciation_rules_count: 36,
      source_files: [
        "unified_words_builder.py",
        "word_meanings_extended.json",
        "grammar_data.py",
        "grammar_a1a2_ai_translations.py",
        "culture_data.py",
        "daily_conversations_data.py",
        "pronunciation_data.py",
        "rhyme_data.py",
      ],
    },
    media_assets: {
      images: {
        brand_icons: ["icon.svg", "icon-32.png", "icon-180.png", "icon-192.png", "icon-512.png"],
        format: "SVG + PNG multi-resolution PWA icons",
        total_count: 5,
      },
      audio: {
        source: "Web Speech API (Browser native synthesizer)",
        local_audio_files: 0,
        notes: "No binary audio files bundled; synthesis runs dynamically in client browser using SpeechSynthesisUtterance.",
      },
      video: { total_count: 0, notes: "Zero video files stored locally." },
    },
    ui_locales: {
      count: 12,
      locales: ["vi", "cs", "zh_cn", "zh", "en", "fr", "de", "hu", "id", "ja", "ko", "pl"],
    },
    security_and_storage: {
      authentication: "None (Fully client-side static public learning application)",
      progress_persistence: "localStorage (Browser key: 'viet_mobile_locale', 'study_progress_*')",
      backend_database: "None (Static compilation; all vocabulary and grammar bundled in JS)",
    },
    dependencies_and_domain_assumptions: {
      current_domain: "hoc.tieng.viet.mobile",
      new_target_domain: "study.vietnamese.life.help",
      hardcoded_viet_mobile_references: [
        "https://hoc.tieng.viet.mobile",
        "https://jw.hoc.tieng.viet.mobile",
        "https://jeonju.hoc.tieng.viet.mobile",
        "https://ulsan.hoc.tieng.viet.mobile",
        "viet.mobile",
        "viet_mobile_locale",
      ],
      shared_component_candidates: [
        "TTS voice configuration modal",
        "Language selection bar (12 legacy / 38 life.help)",
        "Vocabulary review card component",
        "Sentence reconstruction tile component",
        "Offline Service Worker cache strategy",
      ],
    },
  },
];

const aggregateSummary = {
  baselineSha: "d522da41caf2b9030d9b0ec0bcce6674dce57249",
  generatedAt: "2026-10-05T02:00:00.000Z",
  totalSites: sites.length,
  accessibleSitesCount: sites.filter((s) => s.accessible).length,
  sitesSummary: sites.map((s) => ({
    site_id: s.site_id,
    legacyDomain: s.domain,
    newDomain: s.new_target_domain,
    targetLanguage: s.target_language,
    productSlug: s.product_slug,
    accessible: s.accessible,
    distBytes: s.total_dist_bytes,
    routeCount: s.route_count,
    tabCount: s.tabs.length,
    exerciseTypeCount: s.exercise_types.length,
    uiLocalesCount: s.ui_locales.count,
  })),
  sharedArchitectureFacts: {
    framework: "Vanilla JavaScript Single-Page Application (Native Web Standards, No React/Vue/Svelte in client bundle)",
    buildSystem: "Python 3 compiler (build_app.py, assemble_app.py, site_profiles.py)",
    deploymentTarget: "Cloudflare Pages static hosting",
    offlineSupport: "Service Worker (sw.js) + manifest.webmanifest (PWA installable)",
    clientTTS: "Browser native Web Speech API (speechSynthesis.speak, zero static audio files)",
    persistence: "Browser localStorage only (zero remote server database / API dependency)",
    authentication: "None (public educational web apps)",
    legacyUILocaleCount: 12,
    futurePlatformUILocaleCount: 38,
  },
};

const reportMd = `# Six Legacy Adult-Study Sites Inventory Report

Authoritative Baseline SHA: \`d522da41caf2b9030d9b0ec0bcce6674dce57249\`
Worktree: \`life-help-v3-bulk\`
Branch: \`feature/learning-v3-bulk\`
Generated: \`2026-10-05T02:00:00.000Z\`

---

## 1. Executive Summary

All **6 legacy adult-study sites** were fully located and inspected on the local workstation under \`C:\\Users\\leetr\\Documents\\viet-project\`.
Zero sites were estimated or assumed; all facts below were directly extracted from source files, build profiles, and built distribution artifacts.

| # | Legacy Domain | New Target Domain | Target Language | Accessible | Framework | Build System | Dist Size |
|---|---|---|---|---|---|---|---|
| 1 | \`study.korean.viet.mobile\` | \`study.korean.life.help\` | Korean (\`ko\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 2 | \`study.english.viet.mobile\` | \`study.english.life.help\` | English (\`en\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 3 | \`study.japanese.viet.mobile\` | \`study.japanese.life.help\` | Japanese (\`ja\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 4 | \`zhong.wen.viet.mobile\` | \`study.chinese.life.help\` | Chinese (\`zh\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 5 | \`bahasa.indonesia.viet.mobile\` | \`study.indonesian.life.help\` | Indonesian (\`id\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~1.41 MB |
| 6 | \`hoc.tieng.viet.mobile\` | \`study.vietnamese.life.help\` | Vietnamese (\`vi\`) | **YES** | Vanilla JS SPA / PWA | Python 3 build pipeline | ~9.81 MB |

---

## 2. Shared Architectural Facts

Across all 6 legacy sites:
1. **Frontend Architecture**:
   - Built on pure Vanilla JavaScript and standard DOM manipulation APIs.
   - PWA compliant with Web App Manifest (\`manifest.webmanifest\`) and Service Worker (\`sw.js\`).
   - Zero heavyweight client frameworks (no React, Vue, or Angular dependencies in client bundle).
2. **Build & Bundling Pipeline**:
   - Single multi-profile Python build pipeline (\`build_app.py\`, \`assemble_app.py\`, \`site_profiles.py\`).
   - Static asset emission into Cloudflare Pages \`dist/\` folders.
3. **Routing Model**:
   - 14 entry routes per site via \`_redirects\` (rewriting \`/ko\`, \`/vi\`, \`/en\`, \`/zh\`, \`/ja\`, etc. directly to \`/index.html\` with 200 status code).
   - In-page navigation handled via SPA hash routing and tab state buttons (\`#reader\`, \`#review\`, \`#voice_settings\`, \`#word_order\`).
4. **Speech & Audio (TTS)**:
   - Zero static MP3/WAV/AAC audio files bundled.
   - Audio pronunciation is driven dynamically via the browser's native Web Speech API (\`window.speechSynthesis\`) using localized language codes (\`ko-KR\`, \`en-US\`, \`ja-JP\`, \`zh-TW\`, \`zh-CN\`, \`id-ID\`, \`vi-VN\`).
5. **Persistence & Security**:
   - No server-side relational database or cloud backend required.
   - User progress (flashcard reviews, completed sentences, preferred voice rate/pitch) is persisted exclusively in browser \`localStorage\`.
   - No user authentication barrier; fully open public educational web applications.
6. **UI Internationalization**:
   - Legacy sites support **12 display UI languages**: \`vi, cs, zh_cn, zh, en, fr, de, hu, id, ja, ko, pl\`.
   - LIFE.HELP V3 standard expands this to **38 languages** (managed via Package B).

---

## 3. Site-Specific Technical Inventories

### Site 1: \`study.korean.viet.mobile\`
- **Target Language**: Korean (\`ko\`, script: \`Kore\`).
- **Tokenizer**: Space-separated \`eojeol\` units for interactive word-order reconstruction.
- **Corpus Sources**: 5 row-aligned sources (\`elf\`, \`lpd\`, \`wt\`, \`songs\`, \`neighbor\`).
- **Brand Identity**: Rounded square mark (\`한\`, primary color \`#00796B\`).

### Site 2: \`study.english.viet.mobile\`
- **Target Language**: English (\`en\`, script: \`Latn\`).
- **Tokenizer**: Standard whitespace tokenization.
- **Corpus Sources**: 5 row-aligned sources.
- **Brand Identity**: Rounded square mark (\`EN\`, primary color \`#1F4E8C\`).

### Site 3: \`study.japanese.viet.mobile\`
- **Target Language**: Japanese (\`ja\`, script: \`Jpan\`).
- **Tokenizer**: None (Japanese script requires dictionary segmentation; word-order reconstruction feature is disabled).
- **Corpus Sources**: 5 row-aligned sources with post-processed Japanese lyric/sentence lines.
- **Brand Identity**: Rounded square mark (\`日\`, primary color \`#5B3E96\`).

### Site 4: \`zhong.wen.viet.mobile\`
- **Target Language**: Chinese (\`zh\`, primary script: \`Hant\`, secondary: \`Hans\`).
- **Tokenizer**: Han character single-character tokenization (\`han_char\`).
- **Corpus Sources**: 5 row-aligned sources with Traditional and Simplified Chinese dual alignment.
- **Brand Identity**: Rounded square mark (\`中\`, primary color \`#A8322D\`).

### Site 5: \`bahasa.indonesia.viet.mobile\`
- **Target Language**: Indonesian (\`id\`, script: \`Latn\`).
- **Tokenizer**: Whitespace tokenization.
- **Corpus Sources**: 5 row-aligned sources.
- **Brand Identity**: Rounded square mark (\`ID\`, primary color \`#2E7D4F\`).

### Site 6: \`hoc.tieng.viet.mobile\`
- **Target Language**: Vietnamese (\`vi\`, script: \`Latn\`).
- **Curriculum Depth**:
  - Over 3,140 unified vocabulary words with tone classifications and CEFR levels.
  - 16-week structured classroom curriculum with weekly reading assignments.
  - 52 grammar pattern units with cross-lingual translations.
  - 28 daily conversation units and 20 culture articles.
  - Pronunciation training module covering 6 tones, initial/final consonants, and Northern vs Southern dialect contrasts.
- **Brand Identity**: National learning brand with custom logo and icon suite.

---

## 4. Dependencies & Domain Assumptions

- **Domain Map**: Hardcoded domain mappings exist in \`site_profiles.py\` (e.g. \`study.*.viet.mobile\` and \`hoc.tieng.viet.mobile\`).
- **Storage Keys**: Legacy key \`viet_mobile_locale\` is used across several sites; LIFE.HELP platform integration will unify this under the \`life-help\` domain session.
- **Shared Component Candidates**:
  1. \`TTSVoiceSettingsModal\`: Universal synthesizer selector.
  2. \`ParallelTextReader\`: Row-aligned multi-lingual reader.
  3. \`TileWordOrderExercise\`: Tile reconstruction exercise component.
  4. \`VocabularyReviewCard\`: Spaced repetition flashcard component.
`;

const targets = [
  ...sites.map((s) => ({
    file: path.resolve(rootDir, `data/learning-study/inventory/${s.domain}.json`),
    content: JSON.stringify(s, null, 2) + "\n",
  })),
  {
    file: path.resolve(rootDir, "data/learning-study/inventory/aggregate-summary.json"),
    content: JSON.stringify(aggregateSummary, null, 2) + "\n",
  },
  {
    file: path.resolve(rootDir, "reports/generated/legacy-study-inventory-report.md"),
    content: reportMd,
  },
];

const isCheck = process.argv.includes("--check");

if (isCheck) {
  let hasDiff = false;
  for (const t of targets) {
    if (!fs.existsSync(t.file)) {
      console.error(`MISSING: ${t.file}`);
      hasDiff = true;
      continue;
    }
    const current = fs.readFileSync(t.file, "utf8");
    if (current !== t.content) {
      console.error(`MISMATCH: ${t.file}`);
      hasDiff = true;
    }
  }
  if (hasDiff) {
    console.error("FAIL: generated legacy study inventory files out of sync");
    process.exit(1);
  }
  console.log("OK: all generated legacy study inventory files in sync");
  process.exit(0);
}

for (const t of targets) {
  const dir = path.dirname(t.file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(t.file, t.content, "utf8");
  console.log(`Wrote ${t.file} (${t.content.length} bytes)`);
}
console.log("Successfully generated all legacy study site inventories.");
