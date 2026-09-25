import { supabase } from "@/lib/supabaseClient";
import type { MatchHelperResult, ReleaseAssignmentResult } from "./schema";

/**
 * Invokes the atomic database matching procedure on Supabase.
 * Atomically locks and matches an on-duty helper or escalates to NO_HELPER_AVAILABLE.
 */
export async function matchAndAssignHelper(
  requestId: string
): Promise<MatchHelperResult> {
  if (!requestId || typeof requestId !== "string") {
    return {
      success: false,
      status: "ERROR",
      error: "Invalid request ID",
    };
  }

  try {
    const { data, error } = await supabase.rpc("match_and_assign_helper", {
      p_request_id: requestId,
    });

    if (error) {
      console.error("Supabase match_and_assign_helper RPC error:", error);
      return {
        success: false,
        status: "ERROR",
        error: error.message,
      };
    }

    const result = data as MatchHelperResult;
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("matchAndAssignHelper execution failed:", message);
    return {
      success: false,
      status: "ERROR",
      error: message,
    };
  }
}

/**
 * Invokes the atomic assignment release procedure on Supabase.
 * Atomically marks an assignment as DECLINED or TIMEOUT and transitions
 * the parent service request status back to SEARCHING if no other active assignment exists.
 */
export async function releaseAssignmentForRematch(
  assignmentId: string,
  releaseStatus: "DECLINED" | "TIMEOUT"
): Promise<ReleaseAssignmentResult> {
  if (!assignmentId || typeof assignmentId !== "string") {
    return {
      success: false,
      error: "Invalid assignment ID",
    };
  }

  if (releaseStatus !== "DECLINED" && releaseStatus !== "TIMEOUT") {
    return {
      success: false,
      error: "Release status must be DECLINED or TIMEOUT",
    };
  }

  try {
    const { data, error } = await supabase.rpc("release_assignment_for_rematch", {
      p_assignment_id: assignmentId,
      p_release_status: releaseStatus,
    });

    if (error) {
      console.error("Supabase release_assignment_for_rematch RPC error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as ReleaseAssignmentResult;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("releaseAssignmentForRematch execution failed:", message);
    return {
      success: false,
      error: message,
    };
  }
}

