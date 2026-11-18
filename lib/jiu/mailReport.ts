import { ACTIONS, SERVICES, dayKey, validEvent, type JournalEvent } from "./journal";
export const MAIL_RECIPIENT = "jiubag850@gmail.com";
export const MAIL_SENDER = "jiu@life.help";
export type MailReport = { events: JournalEvent[]; notes: { day: string; text: string }[] };
export function parseMailReport(input: unknown): MailReport | null {
  if (!input || typeof input !== "object") return null;
  const value = input as MailReport;
  if (!Array.isArray(value.events) || value.events.length > 200 || !value.events.every(validEvent)) return null;
  if (!Array.isArray(value.notes) || value.notes.length > 10 || !value.notes.every(n => n && typeof n.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(n.day) && typeof n.text === "string" && n.text.length <= 5000)) return null;
  if (!value.events.length && !value.notes.length) return null;
  return { events: value.events.map(({ id, site, action, at }) => ({ id, site, action, at })).sort((a,b) => a.id.localeCompare(b.id)), notes: value.notes.map(({ day, text }) => ({ day, text })).sort((a,b) => a.day.localeCompare(b.day)) };
}
export function formatMailReport(report: MailReport) {
  const days = [...new Set([...report.events.map(e => dayKey(e.at)), ...report.notes.map(n => n.day)])].sort();
  const sections = days.map(day => {
    const events = report.events.filter(e => dayKey(e.at) === day);
    const rows = SERVICES.flatMap(service => {
      const counts = Object.entries(ACTIONS).flatMap(([action, label]) => { const count = events.filter(e => e.site === service.id && e.action === action).length; return count ? [`${label} ${count}회`] : []; });
      return counts.length ? [`${service.name}: ${counts.join(" · ")}`] : [];
    });
    const note = report.notes.find(n => n.day === day);
    return [day, ...rows, ...(note ? ["", "오늘의 발견과 소감", note.text || "(소감을 지웠습니다.)"] : [])].join("\n");
  });
  return { subject: `[JIU 학습 일지] ${days.join(", ")}`, text: ["JIU 학습 일지 — 새 활동과 소감", ...sections, "브라우저에 저장된 일지의 새로운 활동 및 수정된 소감을 보냅니다.\nhttps://jiu.life.help\n시간 기준: 대한민국 (Asia/Seoul)"].join("\n\n") };
}
