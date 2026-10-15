/**
 * Reading questions are stored as one line: `<instruction> "<passage>" <Label>: <question>` where the label is the learner language's word
 * for "Question" (질문, Question, 質問, 问题, Вопрос, ...). The passage and the question must not run together on screen: this puts a blank
 * line before the label, in every language, by structure (the closing quote of the passage + a short word + a colon), not by a word list.
 * Display only: the stored prompt, the answer key and the listening segmenter (lib/learn/listen/segments.ts) keep reading the original.
 */
const LABEL_BREAK = /(["”»」』])\s+([^"“”«»「」『』\n:：៖]{1,24}[:：៖])(\s+|(?<=[：៖]))(?=\S)/g;

export function formatPrompt(prompt: string): string {
  if (prompt.includes("\n")) return prompt;
  const hit = [...prompt.matchAll(LABEL_BREAK)].at(-1);
  if (!hit || hit.index === undefined) return prompt;
  return `${prompt.slice(0, hit.index)}${hit[1]}\n\n${hit[2]}${hit[3]}${prompt.slice(hit.index + hit[0].length)}`;
}
