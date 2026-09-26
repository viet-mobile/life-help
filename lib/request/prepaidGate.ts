import "server-only";
import { NextResponse } from "next/server";
import { authorizePlatformOperator, createStagingSettlementClient } from "@/lib/settlement/platformAuth";

/**
 * Prepaid invariant at the API edge (migration 014): customers create service requests ONLY through
 * a funded checkout (/api/checkouts -> verified payment -> activation). The old unpaid creation routes
 * (/api/requests, /api/requests/selected) remain solely as explicit internal test compatibility:
 * platform-operator token AND the staging settlement client, and their rows are marked
 * legacy_unfunded by the database. A public caller always gets 402 PREPAYMENT_REQUIRED.
 */
export async function refuseUnlessLegacyTestCompat(request: Request): Promise<NextResponse | null> {
  const actor = await authorizePlatformOperator(request);
  const staging = actor ? await createStagingSettlementClient() : null;
  if (actor && staging) return null;
  return NextResponse.json(
    { success: false, code: "PREPAYMENT_REQUIRED", message: "Service requests are created only after payment through a checkout." },
    { status: 402, headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * True only for the platform operator on the STAGING project (test harness). Used to mark live test
 * checkouts as test fixtures so purge_payment_fixture() can remove them; never true for a customer.
 */
export async function isStagingTestOperator(request: Request): Promise<boolean> {
  const actor = await authorizePlatformOperator(request);
  return !!actor && !!(await createStagingSettlementClient());
}
