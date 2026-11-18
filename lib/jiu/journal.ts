export const JOURNAL_KEY = "jiu-journal-v1";
export const SERVICES = [
  { id: "math", name: "수학", host: "math.life.help", icon: "∑", description: "한 문제씩, 생각하는 힘을 키워요", color: "#e7efff" },
  { id: "english", name: "영어", host: "english.life.help", icon: "Aa", description: "매일 만나는 새로운 영어", color: "#e5f3eb" },
  { id: "korean", name: "한국어", host: "korean.life.help", icon: "가", description: "읽고 쓰며 넓히는 나의 언어", color: "#fff0dc" },
  { id: "life", name: "LIFE.HELP", host: "life.help", icon: "↗", description: "생활에 필요한 도움을 만나요", color: "#f0e9fc" },
] as const;
export type JournalEvent = { id: string; site: string; action: string; at: string };
export const ACTIONS: Record<string, string> = { visit: "사이트 열기", start: "학습 시작", attempt: "문제 풀이", complete: "학습 완료", cards: "카드 학습", diagnostic: "진단 학습" };
export function dayKey(at: string) { return new Date(at).toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" }); }
export function validEvent(value: unknown): value is JournalEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as JournalEvent;
  return typeof e.id === "string" && e.id.length <= 100 && SERVICES.some(s => s.id === e.site) && Object.hasOwn(ACTIONS, e.action) && typeof e.at === "string" && Number.isFinite(Date.parse(e.at));
}
export function readEvents(): JournalEvent[] {
  const data: unknown = JSON.parse(localStorage.getItem(JOURNAL_KEY) || "[]");
  return Array.isArray(data) ? data.filter(validEvent).slice(-5000) : [];
}
export function appendEvent(event: JournalEvent) {
  const events = readEvents();
  if (!events.some(e => e.id === event.id)) {
    localStorage.setItem(JOURNAL_KEY, JSON.stringify([...events, event].slice(-5000)));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("jiu-journal-updated"));
  }
}
