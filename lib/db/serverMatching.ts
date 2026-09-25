import { supabase } from "@/lib/supabaseClient";
import type { MatchHelperResult } from "./schema";

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
