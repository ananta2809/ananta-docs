import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Razorpay Standard Checkout — payment signature verification.
 *
 * Algorithm (per Razorpay docs):
 *   expected = HMAC-SHA256(`${razorpay_order_id}|${razorpay_payment_id}`,
 *                          KEY_SECRET).hex
 *   match    = constant_time_compare(expected, razorpay_signature)
 *
 * Only when match is true should the caller mark the purchase as
 * paid. Anything else → 400, no side effects.
 */
export const runtime = "nodejs";

interface VerifyBody {
  razorpay_order_id?:    string;
  razorpay_payment_id?:  string;
  razorpay_signature?:   string;
}

export async function POST(req: Request) {
  let body: VerifyBody;
  try { body = await req.json(); }
  catch {
    return NextResponse.json(
      { error: "bad_json" }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id,
          razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id
      || !razorpay_signature) {
    return NextResponse.json(
      { error: "missing required fields" }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[razorpay.order.verify] KEY_SECRET unset");
    return NextResponse.json(
      { error: "server_not_configured" }, { status: 503 });
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const ok = expected.length === razorpay_signature.length
    && crypto.timingSafeEqual(
      Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!ok) {
    console.warn(
      `[razorpay.order.verify] mismatch order=${razorpay_order_id} `
      + `payment=${razorpay_payment_id}`);
    return NextResponse.json(
      { ok: false, error: "signature_mismatch" }, { status: 400 });
  }

  console.info(
    `[razorpay.order.verify] ok order=${razorpay_order_id} `
    + `payment=${razorpay_payment_id}`);
  // Caller (the /pay page) marks the user as paid client-side for
  // demo. For real fulfillment, the webhook handler at
  // /api/razorpay/webhook is the authoritative path.
  return NextResponse.json({ ok: true });
}
