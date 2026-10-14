import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readLearnPublicConfig } from "./config";

/**
 * Session refresh for the learning hosts, run from proxy.ts. It needs ONLY the learning publishable credentials: it imports
 * neither the service client nor the secret reader, so no secret can reach the proxy bundle. Without a valid learning public
 * configuration it does nothing (no network call). getUser() verifies the token with Supabase and refreshes it if needed.
 */
export async function updateLearnSession(request: NextRequest): Promise<{ response: NextResponse }> {
  let response = NextResponse.next({ request });
  const config = readLearnPublicConfig();
  if (!config) return { response };

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  await supabase.auth.getUser();
  return { response };
}
