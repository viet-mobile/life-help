import { NextResponse } from "next/server";
import { resolveCustomerOwner } from "@/lib/request/customerOwner";
import { openPaymentIntent } from "@/lib/payments/paymentRail";
import { formatUsdc, solanaPayUrl } from "@/lib/payments/solana";
import { createRuntimeServiceRoleClient } from "@/lib/supabase/serviceRole";

function respond(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * POST /api/checkouts/{checkoutId}/payment: USDC (Solana devnet, staging only) payment intent for the
 * owner's checkout. FX rate, network, native mint, recipient and reference are all server-side; the
 * body is ignored. Returns a Solana Pay transfer request the customer's own wallet signs.
 */
export async function POST(_request: Request, context: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(checkoutId)) return respond(404, { success: false, code: "CHECKOUT_NOT_FOUND" });
  const client = await createRuntimeServiceRoleClient();
  if (!client) return respond(503, { success: false, code: "SERVICE_UNAVAILABLE" });
  const owner = await resolveCustomerOwner(client);
  if (!owner.ok) return respond(owner.status, { success: false, code: owner.code });
  const opened = await openPaymentIntent(client, checkoutId, owner.owner.customerId);
  if (!opened.ok) return respond(opened.httpStatus, { success: false, code: opened.code });
  const { intent, quote } = opened;
  return respond(201, {
    success: true,
    intentId: intent.intent_id,
    status: intent.status,
    network: intent.network,
    asset: "USDC",
    mint: intent.mint,
    recipient: intent.recipient,
    reference: intent.reference,
    amountBaseUnits: String(intent.amount_base_units),
    amountUsdc: formatUsdc(intent.amount_base_units),
    fiat: { currency: quote.source_currency, amount: Number(quote.source_amount) },
    fx: { rate: Number(quote.fx_rate), provider: quote.fx_provider },
    expiresAt: intent.expires_at,
    solanaPayUrl: solanaPayUrl({ recipient: intent.recipient, amountBaseUnits: intent.amount_base_units, mint: intent.mint, reference: intent.reference, label: "LIFE.HELP" }),
  });
}
