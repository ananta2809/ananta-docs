import { NextResponse } from "next/server";
import { getRazorpay, resolvePlan } from "@/lib/razorpay";

/**
 * Create a Razorpay subscription. Returns a `short_url` the customer
 * is redirected to, equivalent to Stripe Checkout's `session.url`.
 *
 * Body: { tier: "starter" | "pro" }
 *
 * Country is read from cf-ipcountry (Cloudflare attaches this
 * automatically on Vercel projects fronted by Cloudflare). When
 * absent, defaults to "" → falls into the non-IN code path.
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { tier?: string };
  try { body = await req.json(); }
  catch (e) {
    console.error(`[razorpay.checkout] bad_json: ${e}`);
    return NextResponse.json(
      { error: "bad_json" }, { status: 400 });
  }
  const tier = (body.tier as "starter" | "pro" | undefined);
  if (tier !== "starter" && tier !== "pro") {
    return NextResponse.json(
      { error: "tier must be 'starter' or 'pro'" }, { status: 400 });
  }

  const country =
    req.headers.get("cf-ipcountry") ??
    req.headers.get("x-vercel-ip-country") ??
    "";
  const resolved = resolvePlan(tier, country);
  if (!resolved.planId) {
    return NextResponse.json(
      { error: "plan_not_configured" }, { status: 503 });
  }

  let rzp;
  try { rzp = getRazorpay(); }
  catch (e) {
    console.error(`[razorpay.checkout] client init: ${e}`);
    return NextResponse.json(
      { error: "razorpay_not_configured" }, { status: 503 });
  }

  try {
    // Subscription created with no customer_id → Razorpay collects
    // the email via the hosted checkout, attaches a customer record
    // on first payment, and we capture the link from the response.
    const sub = await rzp.subscriptions.create({
      plan_id:        resolved.planId,
      total_count:    120,    // 10 years monthly — effectively "forever"
      customer_notify: 1,
      notes: {
        product_slug: process.env.ANANTA_PRODUCT_SLUG ?? "ats-resume-tailor",
        billing_country: country || "unknown",
        billing_currency: resolved.currency,
        intl_fallback: String(resolved.fallback),
        tier,
      },
    });

    console.info("[razorpay.checkout] created", {
      sub_id: sub.id, tier, country, currency: resolved.currency });

    return NextResponse.json({
      url:        sub.short_url,
      sub_id:     sub.id,
      currency:   resolved.currency,
      fallback:   resolved.fallback,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[razorpay.checkout] create: ${msg}`);
    return NextResponse.json(
      { error: msg.slice(0, 200) }, { status: 500 });
  }
}
