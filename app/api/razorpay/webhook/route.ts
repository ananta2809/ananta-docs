import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Razorpay webhook receiver.
 *
 * Verification: HMAC-SHA256 of the raw body using the webhook secret
 * (NOT the API key secret — separate value, set when you register
 * the webhook in the Razorpay dashboard). Header is
 * `X-Razorpay-Signature`.
 *
 * Subscription events to expect:
 *   subscription.activated     — first successful charge
 *   subscription.charged       — recurring charge succeeded
 *   subscription.cancelled     — customer cancelled
 *   subscription.completed     — total_count exhausted
 *   subscription.halted        — recurring failures, paused
 *   payment.captured           — one-time payment success
 *   payment.failed             — single charge failure
 *
 * On revenue events we also fire a Telegram alert directly to the
 * operator chat so the first-dollar moment lands in real time.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVENUE_EVENTS = new Set([
  "payment.captured",
  "subscription.activated",
  "subscription.charged",
  "order.paid",
]);

const FAILURE_EVENTS = new Set([
  "payment.failed",
  "subscription.halted",
]);

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  const secret    = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: "missing signature" }, { status: 400 });
  }
  if (!secret) {
    console.error("[razorpay.webhook] RAZORPAY_WEBHOOK_SECRET unset");
    return NextResponse.json(
      { error: "webhook secret not configured" }, { status: 503 });
  }

  const rawBody = await req.text();
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const ok = signature.length === expected.length
    && crypto.timingSafeEqual(
      Buffer.from(signature), Buffer.from(expected));
  if (!ok) {
    console.warn("[razorpay.webhook] bad signature");
    return NextResponse.json(
      { error: "verify failed" }, { status: 400 });
  }

  let event: { event?: string; payload?: any };
  try { event = JSON.parse(rawBody); }
  catch {
    return NextResponse.json(
      { error: "bad_json" }, { status: 400 });
  }

  const eventType = event.event ?? "unknown";
  console.info("[razorpay.webhook] received",
    { type: eventType,
      product: process.env.ANANTA_PRODUCT_SLUG ?? "unknown" });

  // Telegram alert for revenue + failure signals. We `await` so
  // Vercel's serverless runtime doesn't terminate the fetch when
  // the response is sent. Telegram sendMessage is ~200-400ms, well
  // inside Razorpay's 5s webhook deadline.
  if (REVENUE_EVENTS.has(eventType) || FAILURE_EVENTS.has(eventType)) {
    await notifyTelegram(eventType, event.payload);
  }

  // Forward to ANANTA platform (Mac Mini) for the memory + audit
  // trail. Also awaited for the same reason.
  const platform = process.env.ANANTA_PLATFORM_WEBHOOK_URL;
  if (platform) {
    const slug = process.env.ANANTA_PRODUCT_SLUG ?? "unknown";
    const url = `${platform.replace(/\/$/, "")}/webhooks/razorpay/${slug}`;
    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-razorpay-signature": signature,
        },
        body: rawBody,
      });
    } catch (e) {
      console.warn("[razorpay.webhook] forward failed", e);
    }
  }

  return NextResponse.json({ received: true });
}

/** Build a human-readable Telegram message from the Razorpay payload
 * and POST to the bot. Always returns; never throws. */
async function notifyTelegram(
  eventType: string, payload: any
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat  = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  if (token.includes("PLACEHOLDER") || chat.includes("PLACEHOLDER")) return;

  const product = process.env.ANANTA_PRODUCT_SLUG ?? "ats-resume-tailor";
  const isFailure = FAILURE_EVENTS.has(eventType);
  const heading   = isFailure ? "⚠️ Razorpay failure"
                              : "💰 Razorpay revenue";

  // Best-effort field extraction across event shapes.
  const pay  = payload?.payment?.entity ?? {};
  const sub  = payload?.subscription?.entity ?? {};
  const ord  = payload?.order?.entity ?? {};
  const amount   = pay.amount ?? sub.amount ?? ord.amount ?? null;
  const currency = pay.currency ?? sub.currency ?? ord.currency ?? "INR";
  const email    = pay.email ?? sub.notes?.email ?? "";
  const method   = pay.method ?? "";
  const refId    = pay.id ?? sub.id ?? ord.id ?? "";
  const reason   = pay.error_description ?? "";

  const amtStr = (typeof amount === "number")
    ? `${currency === "INR" ? "₹" : currency + " "}${(amount/100).toFixed(2)}`
    : "—";

  const lines = [
    `*${heading}*`,
    `\`${eventType}\`  ·  ${product}`,
    amount ? `Amount: *${amtStr}*` : null,
    email  ? `Email:  \`${email}\`` : null,
    method ? `Method: ${method}` : null,
    refId  ? `Ref:    \`${refId}\`` : null,
    reason ? `Reason: ${reason}` : null,
  ].filter(Boolean).join("\n");

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: {"content-type": "application/json"},
        body: JSON.stringify({
          chat_id: chat,
          text: lines,
          parse_mode: "Markdown",
        }),
      });
    const body = await r.text();
    if (r.ok) {
      console.info("[razorpay.webhook] telegram sent", {
        eventType, status: r.status });
    } else {
      console.warn("[razorpay.webhook] telegram api error", {
        status: r.status, body: body.slice(0, 200) });
    }
  } catch (e) {
    console.warn("[razorpay.webhook] telegram fetch threw", e);
  }
}
