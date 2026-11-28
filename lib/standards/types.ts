export type AnchorLanguage = 'ko' | 'en' | 'vi' | 'zh-Hant' | 'zh-Hans' | 'ja' | 'mn' | 'ru' | 'uz' | 'ne' | string;

export interface StandardArticleTranslation {
  part: string;
  chapter: string;
  section: string;
  title: string;
  rule: string;
  explanation: string;
}

export type ExampleTableBlock = {
  type: 'table';
  caption?: string;
  headers: string[];
  rows: string[][];
};

export type ExampleListBlock = {
  type: 'list';
  title?: string;
  items: string[];
};

export type ExampleTextBlock = {
  type: 'text';
  content: string;
};

export type ExampleBlock = ExampleTableBlock | ExampleListBlock | ExampleTextBlock;

export interface StandardArticle {
  id: string;
  path: string;
  partNum: number;
  articleNum: number;
  articleTitle: string;
  details: string[];
  structuredExamples?: ExampleBlock[];
  i18n: Record<string, StandardArticleTranslation>;
}

export const ANCHOR_LANGUAGES: { code: string; label: string; native: string; flag: string }[] = [
  { code: 'ko', label: '한국어 (원문)', native: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-Hant', label: 'Traditional Chinese', native: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-Hans', label: 'Simplified Chinese', native: '简体中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { code: 'mn', label: 'Mongolian', native: 'Монгол хэл', flag: '🇲🇳' },
  { code: 'ru', label: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'uz', label: 'Uzbek', native: "O'zbek tili", flag: '🇺🇿' },
  { code: 'ne', label: 'Nepali', native: 'नेपाली', flag: '🇳🇵' },
];
