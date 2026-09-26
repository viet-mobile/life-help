import { NextResponse } from "next/server";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

/** Public detailed-service catalog (codes only; display names come from the i18n files). */
export async function GET(request: Request) {
  const service = new URL(request.url).searchParams.get("service");
  const client = await createRuntimeServiceRoleClient();
  if (!client) return NextResponse.json({ success: false, code: "SERVICE_UNAVAILABLE" }, { status: 503 });
  let query = client.from("service_subitems").select("service_code, subitem_code, allowed_pricing_modes, default_pricing_mode, sort_order").eq("active", true).order("service_code").order("sort_order");
  if (service && /^[a-z-]{3,40}$/.test(service)) query = query.eq("service_code", service);
  const { data, error } = await query;
  if (error) return NextResponse.json({ success: false, code: "CATALOG_UNAVAILABLE" }, { status: 502 });
  return NextResponse.json({ success: true, subitems: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
