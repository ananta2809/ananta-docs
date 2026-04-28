import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";

/**
 * Razorpay Standard Checkout — order creation.
 *
 * One-time payment flow (parallel to the Subscriptions flow at
 * /api/razorpay/checkout). Use this for:
 *   - "Buy 20 tailorings for ₹100" credit packs
 *   - "Lifetime deal" one-off purchases
 *   - Any non-recurring SKU
 *
 * Body: { amount: number (paise), currency?: "INR" | "USD", receipt?: string }
 *   - amount minimum: 100 paise (Razorpay requirement)
 *   - currency defaults to INR; USD requires international payments enabled
 *
 * Returns: { order_id, amount, currency, key_id }
 *   key_id is included so the client can pass it to the Razorpay
 *   modal without needing a separate fetch — saves one round trip.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { amount?: number; currency?: string; receipt?: string };
  try { body = await req.json(); }
  catch (e) {
    console.error(`[razorpay.order.create] bad_json: ${e}`);
    return NextResponse.json(
      { error: "bad_json" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 100) {
    return NextResponse.json(
      { error: "amount must be >= 100 paise" }, { status: 400 });
  }
  if (amount > 50_00_000) {
    // ₹50,000 sanity cap — adjust upward when bigger SKUs ship.
    return NextResponse.json(
      { error: "amount over sanity cap" }, { status: 400 });
  }

  const currency = (body.currency || "INR").toUpperCase();
  if (!["INR", "USD"].includes(currency)) {
    return NextResponse.json(
      { error: "unsupported currency" }, { status: 400 });
  }

  let rzp;
  try { rzp = getRazorpay(); }
  catch (e) {
    console.error(`[razorpay.order.create] client init: ${e}`);
    return NextResponse.json(
      { error: "razorpay_not_configured" }, { status: 503 });
  }

  try {
    const order = await rzp.orders.create({
      amount,
      currency,
      receipt: body.receipt
        || `rcpt_${Date.now().toString(36)}`,
      notes: {
        product_slug: process.env.ANANTA_PRODUCT_SLUG ?? "ats-resume-tailor",
      },
    });
    console.info("[razorpay.order.create] ok",
      { order_id: order.id, amount, currency });
    return NextResponse.json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
                ?? process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = msg.toLowerCase().includes("auth") ? 401 : 500;
    console.error(`[razorpay.order.create] api_err: ${msg}`);
    return NextResponse.json(
      { error: msg.slice(0, 240) }, { status });
  }
}
