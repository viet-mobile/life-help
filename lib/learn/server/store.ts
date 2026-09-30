import type { EngineResult, PlayerState, Site, StudentProfile } from "@/lib/learn/types";

export type SessionKind = "lesson" | "review" | "practice" | "diagnostic";

export interface SessionRecord {
  id: string;
  userId: string;
  site: Site;
  kind: SessionKind;
  lessonId: string | null;
  completedAt: string | null;
}

export interface SessionSummary {
  /** questionId -> what happened in this session */
  questions: Record<string, { attempts: number; correct: boolean; firstTryCorrect: boolean; revealed: boolean }>;
}

/**
 * Persistence port for authenticated students. The engine is pure; a store
 * only loads the current state and durably records what the engine produced.
 * Implementations: SupabaseLearnStore (production) and MemoryLearnStore (tests).
 */
export interface LearnStore {
  loadState(userId: string, site: Site, now: Date): Promise<PlayerState>;
  saveProfile(userId: string, profile: StudentProfile): Promise<void>;
  createSession(rec: Omit<SessionRecord, "completedAt">): Promise<void>;
  getSession(userId: string, sessionId: string): Promise<SessionRecord | null>;
  sessionSummary(userId: string, sessionId: string): Promise<SessionSummary>;
  /** Atomically record engine events. Must be idempotent for XP ledger entries. */
  commit(userId: string, site: Site, result: EngineResult, ctx: { sessionId: string | null; lessonId: string | null }): Promise<void>;
  /** Persist a state change that has no attempt events (e.g. diagnostic placement). */
  commitState(userId: string, site: Site, state: PlayerState, events: EngineResult["events"]): Promise<void>;
  markSessionComplete(userId: string, sessionId: string, now: Date): Promise<void>;
}
