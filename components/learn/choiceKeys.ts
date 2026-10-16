/**
 * Keyboard selection of a multiple-choice answer. The letters printed on the options (A, B, C, D, ...) are keys: typing one is the same
 * as clicking that option. The letter comes from the typed character when it is a Latin letter, otherwise from the PHYSICAL key
 * (event.code), so it also works while a Korean (or any other) input method is active, where the character is "ㅁ" / "Process".
 */
export interface KeyLike { key: string; code: string; ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean; repeat?: boolean; defaultPrevented?: boolean }

/** 0-based option index addressed by the key press, or -1 when it addresses nothing (no letter, modifier chord, out of range). */
export function choiceKeyIndex(e: KeyLike, optionCount: number): number {
  if (e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return -1;
  let letter: string | null = null;
  if (/^[a-zA-Z]$/.test(e.key)) letter = e.key.toUpperCase();
  else {
    const m = /^Key([A-Z])$/.exec(e.code);
    if (m) letter = m[1];
  }
  if (!letter) return -1;
  const index = letter.charCodeAt(0) - 65;
  return index >= 0 && index < optionCount ? index : -1;
}

/**
 * True / false questions: O selects "true", X selects "false" (any case; also under a Korean input method, where the typed character is
 * "ㅐ" / "ㅌ", via the physical key). Returns the option id, or null when the key addresses nothing.
 */
export function trueFalseKeyId(e: KeyLike): "true" | "false" | null {
  if (e.repeat || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return null;
  const letter = /^[a-zA-Z]$/.test(e.key) ? e.key.toUpperCase() : /^Key([A-Z])$/.exec(e.code)?.[1];
  return letter === "O" ? "true" : letter === "X" ? "false" : null;
}

/** Keys typed into a text field are text, not answers. */
export function isTextTarget(target: EventTarget | null): boolean {
  const el = target as { closest?: (s: string) => unknown } | null;
  return !!el?.closest?.("input, textarea, select, [contenteditable='true'], [contenteditable='']");
}
