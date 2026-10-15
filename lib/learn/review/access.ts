import type { User } from "@supabase/supabase-js";
import { allowsLearnPathAccess } from "@/lib/env";
import { isLearnStaff } from "@/lib/learn/server/adminAccess";
import { accountsEnabled, getLearnServiceClient } from "@/lib/learn/server/runtime";
import { createLearnSessionClient } from "@/lib/learn/server/supabase/session";

/**
 * Access to the Korean REVIEW console (the unpublished bank, K7..K10 and the K6->K7 bridge).
 *
 * Two independent server-side conditions, both required, both evaluated on every request:
 *  1. The environment is a review environment: KOREAN_REVIEW_MODE=1 (a plain Worker variable) AND path access is allowed
 *     (APP_ENV staging / local). A production build with APP_ENV=production, or with no APP_ENV, can never enable it.
 *  2. The caller is a verified, signed-in reviewer: the Supabase user (auth.getUser(), never a cookie or body the browser sets) is either
 *     staff (a row in learn_staff_users) or has a CONFIRMED e-mail address listed in KOREAN_REVIEWER_EMAILS (comma separated Worker variable).
 * Anything else is refused: no URL secrecy, no client flag, no query parameter takes part in the decision.
 * Nothing here reads or writes progress: the console keeps its notes in the reviewer's browser.
 */
type Env = Record<string, string | undefined>;

export function reviewModeEnabled(env: Env = process.env): boolean {
  return env.KOREAN_REVIEW_MODE === "1" && allowsLearnPathAccess(env);
}

export function reviewerEmails(env: Env = process.env): Set<string> {
  return new Set((env.KOREAN_REVIEWER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));
}

/** Pure decision for a verified user. `staff` is the result of the learn_staff_users lookup. */
export function isReviewer(user: Pick<User, "email" | "email_confirmed_at" | "is_anonymous"> | null, staff: boolean, allow: ReadonlySet<string>): boolean {
  if (!user || user.is_anonymous) return false;
  if (staff) return true;
  return !!user.email && !!user.email_confirmed_at && allow.has(user.email.toLowerCase());
}

export type ReviewAccess = { state: "disabled" } | { state: "login" } | { state: "forbidden"; reason: string } | { state: "ok"; email: string };

export async function reviewAccess(env: Env = process.env): Promise<ReviewAccess> {
  if (!reviewModeEnabled(env)) return { state: "disabled" };
  if (!accountsEnabled()) return { state: "forbidden", reason: "accounts are not configured on this host" };
  let user: User | null = null;
  try {
    const supabase = await createLearnSessionClient();
    user = supabase ? (await supabase.auth.getUser()).data.user : null;
  } catch {
    user = null;
  }
  if (!user || user.is_anonymous) return { state: "login" };
  let staff = false;
  try { staff = await isLearnStaff(getLearnServiceClient(), user); } catch { staff = false; }
  return isReviewer(user, staff, reviewerEmails(env)) ? { state: "ok", email: user.email ?? "" } : { state: "forbidden", reason: "this account is not a reviewer" };
}
