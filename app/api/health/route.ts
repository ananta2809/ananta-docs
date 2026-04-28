import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    product: process.env.ANANTA_PRODUCT_SLUG ?? "unknown",
    billing_mode: process.env.ANANTA_BILLING_MODE ?? "test",
    ts: Date.now(),
  });
}
