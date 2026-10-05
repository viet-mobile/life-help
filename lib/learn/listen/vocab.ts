/**
 * Saved vocabulary ("Words") and the flashcard deck. DEVICE-LOCAL by design for this release: it needs no migration and no server write
 * (a server-side word list would be a learning-only migration, separate from every marketplace migration, and is future work).
 * Only canonical lesson content is saved: the English text, the canonical meaning when the lesson carries one, the lesson reference.
 */
export interface SavedWord {
  /** canonical identity: the normalized English text (target language is the site, English) */
  id: string;
  en: string;
  /** canonical meaning from the lesson; never invented */
  ko?: string;
  /** an English example sentence from the same lesson, when it has one */
  exampleEn?: string;
  lessonId: string;
  lessonTitle?: string;
  savedAt: number;
}

/** Normalization is deliberately light (case and whitespace only): "a lot" and "a lot of" stay distinct. */
export const wordId = (en: string) => en.trim().toLowerCase().replace(/\s+/g, " ");

/** Adds a word. The same normalized English text is never added twice; a duplicate may only fill a missing meaning / example. */
export function addWord(list: SavedWord[], w: Omit<SavedWord, "id" | "savedAt"> & { savedAt?: number }): { list: SavedWord[]; added: boolean } {
  const id = wordId(w.en);
  if (!id) return { list, added: false };
  const hit = list.find((x) => x.id === id);
  if (hit) {
    const merged = { ...hit, ko: hit.ko ?? w.ko, exampleEn: hit.exampleEn ?? w.exampleEn };
    const changed = merged.ko !== hit.ko || merged.exampleEn !== hit.exampleEn;
    return { list: changed ? list.map((x) => (x.id === id ? merged : x)) : list, added: false };
  }
  return { list: [...list, { ...w, id, en: w.en.trim(), savedAt: w.savedAt ?? Date.now() }], added: true };
}
export const removeWord = (list: SavedWord[], id: string) => list.filter((x) => x.id !== id);
export const hasWord = (list: SavedWord[], en: string) => list.some((x) => x.id === wordId(en));

export type WordFilter = { kind: "all" } | { kind: "lesson"; lessonId: string };
export const filterWords = (list: SavedWord[], f: WordFilter) => (f.kind === "all" ? list : list.filter((w) => w.lessonId === f.lessonId));

/** Deterministic shuffle (mulberry32) so a shuffled deck is stable for a seed and testable. */
export function shuffled<T>(items: T[], seed: number): T[] {
  const a = [...items];
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Card navigation: previous / next wrap around; an empty deck stays at 0. */
export const stepIndex = (i: number, dir: 1 | -1, n: number) => (n <= 0 ? 0 : (i + dir + n) % n);

const KEY = (base: string, site: string, mode: string) => `${base}:words:${site}:${mode}`;
type StorageLike = Pick<Storage, "getItem" | "setItem">;
export function loadWords(storage: StorageLike | null, base: string, site: string, mode: string): SavedWord[] {
  try {
    const raw = storage?.getItem(KEY(base, site, mode));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((w): w is SavedWord => w && typeof w.id === "string" && typeof w.en === "string" && typeof w.lessonId === "string");
  } catch { return []; }
}
export function saveWords(storage: StorageLike | null, base: string, site: string, mode: string, list: SavedWord[]) {
  try { storage?.setItem(KEY(base, site, mode), JSON.stringify(list)); } catch { /* storage full / blocked: the list stays in memory for this page */ }
}
