// Rules shared by structure-stems.ts and its regression test.
// A SPEAKER LABEL is a person name or speaker id at the start of a line ("Eva:", "Ms. Han:", "A:", "B:", "Customer:"), never the title of a text ("Calendar note:", "Read the sign:", "Shopping list:").
const TEXT_TYPE = /^(calendar|schedule|menu|notice|note|sign|list|shopping|school|field|read|look|text|email|e-mail|letter|message|ticket|poster|flyer|label|recipe|diary|announcement|timetable|weather|map|chart|table|advertisement|ad|review|article|story|passage|dialogue|conversation|instructions?|directions?|rules?)\b/i;
export const isSpeakerLabel = (line: string): boolean => {
  const m = line.match(/^((?:Mr|Ms|Mrs|Dr)\.? )?([A-Z][A-Za-z]{0,11}):\s/);
  if (!m) return false;
  if (!m[1] && TEXT_TYPE.test(line)) return false;
  return true;
};
