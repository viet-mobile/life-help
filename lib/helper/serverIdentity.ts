import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

export type AuthenticatedHelper = {
  user: User;
  helper: {
    id: string;
    helper_id: string;
    name: string;
    primary_locale: string;
  };
  client: SupabaseClient;
};

export async function resolveAuthenticatedHelper(): Promise<
  | { ok: true; value: AuthenticatedHelper }
  | { ok: false; status: 401 | 403; code: "UNAUTHENTICATED" | "HELPER_NOT_LINKED" }
> {
  const sessionClient = await createClient();
  const { data, error } = await sessionClient.auth.getUser();
  if (error || !data.user) {
    return { ok: false, status: 401, code: "UNAUTHENTICATED" };
  }

  const serviceClient = await createRuntimeServiceRoleClient();
  if (!serviceClient) {
    return { ok: false, status: 403, code: "HELPER_NOT_LINKED" };
  }

  const { data: helper, error: helperError } = await serviceClient
    .from("helpers")
    .select("id, helper_id, name, primary_locale")
    .eq("auth_user_id", data.user.id)
    .maybeSingle();

  if (helperError || !helper) {
    return { ok: false, status: 403, code: "HELPER_NOT_LINKED" };
  }

  return { ok: true, value: { user: data.user, helper, client: serviceClient } };
}
