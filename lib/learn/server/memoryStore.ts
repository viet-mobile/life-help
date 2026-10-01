import { createInitialState } from "@/lib/learn/domain/engine";
import { dayKey } from "@/lib/learn/domain/dates";
import type { EngineResult, LearnEvent, PlayerState, Site, StudentProfile } from "@/lib/learn/types";
import type { LearnStore, SessionRecord, SessionSummary } from "./store";

interface UserData {
  profile: StudentProfile | null;
  states: Partial<Record<Site, PlayerState>>;
}

/** In-memory store: the reference implementation used by tests and local tooling. */
export class MemoryLearnStore implements LearnStore {
  private users = new Map<string, UserData>();
  private sessions = new Map<string, SessionRecord>();
  private attempts: {
    userId: string;
    sessionId: string;
    questionId: string;
    correct: boolean;
    attemptNo: number;
    revealed: boolean;
  }[] = [];
  /** exposed for assertions */
  ledger = new Set<string>();
  eventLog: LearnEvent[] = [];

  private user(userId: string): UserData {
    let u = this.users.get(userId);
    if (!u) {
      u = { profile: null, states: {} };
      this.users.set(userId, u);
    }
    return u;
  }

  async loadState(userId: string, site: Site, now: Date): Promise<PlayerState> {
    const u = this.user(userId);
    const base = u.states[site] ?? createInitialState(site);
    const today = dayKey(now);
    // Mirror a DB load: profile is shared across sites and the quest is per-day.
    return {
      ...base,
      profile: u.profile,
      quest: base.quest && base.quest.day === today ? base.quest : null,
    };
  }

  async saveProfile(userId: string, profile: StudentProfile) {
    this.user(userId).profile = profile;
  }

  async createSession(rec: Omit<SessionRecord, "completedAt">) {
    this.sessions.set(rec.id, { ...rec, completedAt: null });
  }

  async getSession(userId: string, sessionId: string) {
    const s = this.sessions.get(sessionId);
    return s && s.userId === userId ? s : null;
  }

  async sessionSummary(userId: string, sessionId: string): Promise<SessionSummary> {
    const questions: SessionSummary["questions"] = {};
    for (const a of this.attempts.filter((x) => x.userId === userId && x.sessionId === sessionId)) {
      const cur = questions[a.questionId] ?? { attempts: 0, correct: false, firstTryCorrect: false, revealed: false };
      cur.attempts += 1;
      if (a.correct) {
        cur.correct = true;
        if (a.attemptNo === 1) cur.firstTryCorrect = true;
      }
      if (a.revealed) cur.revealed = true;
      questions[a.questionId] = cur;
    }
    return { questions };
  }

  async commit(userId: string, site: Site, result: EngineResult, ctx: { sessionId: string | null; lessonId: string | null }) {
    for (const ev of result.events) {
      if (ev.type === "attempt") {
        this.attempts.push({
          userId,
          sessionId: ev.input.sessionId,
          questionId: ev.input.questionId,
          correct: ev.input.correct,
          attemptNo: ev.input.attemptNo,
          revealed: !!ev.input.revealed,
        });
      }
      if (ev.type === "xp") this.ledger.add(`${userId}:${site}:${ev.entry.sourceType}:${ev.entry.sourceId}`);
      this.eventLog.push(ev);
    }
    void ctx;
    this.user(userId).states[site] = { ...result.state, profile: null };
  }

  async commitState(userId: string, site: Site, state: PlayerState, events: LearnEvent[]) {
    for (const ev of events) {
      if (ev.type === "xp") this.ledger.add(`${userId}:${site}:${ev.entry.sourceType}:${ev.entry.sourceId}`);
      this.eventLog.push(ev);
    }
    this.user(userId).states[site] = { ...state, profile: null };
  }

  async markSessionComplete(userId: string, sessionId: string, now: Date) {
    const s = this.sessions.get(sessionId);
    if (s && s.userId === userId) s.completedAt = now.toISOString();
  }
}
