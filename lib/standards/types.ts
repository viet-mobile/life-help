export type AnchorLanguage = 'ko' | 'en' | 'vi' | 'zh-Hant' | 'zh-Hans' | 'ja';

export interface StandardArticleTranslation {
  part: string;
  chapter: string;
  section: string;
  title: string;
  rule: string;
  explanation: string;
}

export interface StandardArticle {
  id: string;
  path: string;
  partNum: number;
  articleNum: number;
  articleTitle: string;
  details: string[];
  i18n: Record<AnchorLanguage, StandardArticleTranslation>;
}

export const ANCHOR_LANGUAGES: { code: AnchorLanguage; label: string; native: string; flag: string }[] = [
  { code: 'ko', label: '한국어 (원문)', native: '한국어', flag: '🇰🇷' },
  { code: 'en', label: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh-Hant', label: 'Traditional Chinese', native: '繁體中文', flag: '🇹🇼' },
  { code: 'zh-Hans', label: 'Simplified Chinese', native: '简体中文', flag: '🇨🇳' },
  { code: 'ja', label: 'Japanese', native: '日本語', flag: '🇯🇵' },
];
