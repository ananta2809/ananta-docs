import { NextResponse } from "next/server";
const PROXY = process.env.ANANTA_DOCS_ASK_PROXY
  ?? "https://anantatrade.com/docs/ask";
const BEARER = process.env.ANANTA_DOCS_BEARER ?? "";

export async function POST(req: Request) {
  if (!BEARER) return NextResponse.json(
    { ok: false, reason: "server_not_configured" }, { status: 503 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json(
    { ok: false, reason: "bad_json" }, { status: 400 });
  const fwd = req.headers.get("x-forwarded-for") ?? "";
  const realIp = (fwd.split(",")[0] ?? "").trim()
              || (req.headers.get("x-real-ip") ?? "");
  const plan = req.headers.get("x-ananta-plan") ?? "free";
  try {
    const r = await fetch(PROXY, {
      method:"POST",
      headers: {
        "Authorization": `Bearer ${BEARER}`,
        "Content-Type":  "application/json",
        "X-Real-IP":     realIp,
        "X-Plan":        plan,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(150_000),
    });
    if (!r.ok && r.headers.get("content-type")?.includes("application/json")) {
      return NextResponse.json(await r.json(), { status: r.status });
    }
    if (!r.ok) return NextResponse.json(
      { ok: false, reason: `proxy_${r.status}` }, { status: 502 });
    return NextResponse.json(await r.json());
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { ok: false, reason: `proxy_fetch_failed:${msg.slice(0, 80)}` },
      { status: 502 });
  }
}
export const runtime = "nodejs";
export const maxDuration = 180;
