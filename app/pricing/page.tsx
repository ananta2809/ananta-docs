"use client";

import { useEffect, useState } from "react";

const TIERS = [
  {
    name: "Free",
    envKey: "",
    USD: { label: "$0",      sublabel: "" },
    INR: { label: "₹0",      sublabel: "" },
    features: [
      "50 pages / month indexed",
      "Local Llama-3.1 + sentence embeddings",
      "Documents auto-deleted after 24 hours",
      "Cited answers — every claim links to source",
    ],
  },
  {
    name: "Starter",
    envKey: "starter",
    badge: "Best for researchers + students",
    USD: { label: "$3.50/mo", sublabel: "billed monthly · cancel anytime" },
    INR: { label: "₹299/mo", sublabel: "billed monthly · cancel anytime" },
    features: [
      "50 documents / month, 500 pages each",
      "Up to 100 MB / file (vs 10 MB free)",
      "Documents retained for 30 days",
      "Llama-3.1 8B engine",
    ],
  },
  {
    name: "Pro",
    envKey: "pro",
    badge: "Best for teams + heavy use",
    USD: { label: "$12/mo",   sublabel: "billed monthly · cancel anytime" },
    INR: { label: "₹999/mo",  sublabel: "billed monthly · cancel anytime" },
    features: [
      "Unlimited documents indexed",
      "Up to 100 MB / file",
      "Documents retained until you delete",
      "Priority queue + Llama-3.1 70B (planned)",
    ],
  },
];

export default function Pricing() {
  const [busy, setBusy] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("");
  const [intlPaymentsEnabled, setIntl] = useState<boolean>(false);

  useEffect(() => {
    // Detect visitor country via Cloudflare's trace endpoint (it's a
    // simple text response with `loc=XX` line — no API key, no CORS).
    fetch("https://www.cloudflare.com/cdn-cgi/trace")
      .then((r) => r.text())
      .then((t) => {
        const line = t.split("\n").find((l) => l.startsWith("loc="));
        setCountry(line?.split("=")[1] ?? "");
      })
      .catch(() => setCountry(""));
    // Read intl-payments flag from public env
    try {
      const m = JSON.parse(process.env.NEXT_PUBLIC_RAZORPAY_PLAN_IDS ?? "{}");
      setIntl(Boolean(m.intl_payments_enabled));
    } catch {}
  }, []);

  const isIndia = country.toUpperCase() === "IN";
  const showINR = isIndia || !intlPaymentsEnabled;
  const cur = showINR ? "INR" : "USD";

  async function subscribe(tier: string) {
    if (!tier || busy) return;
    setBusy(tier);
    try {
      const r = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await r.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(`Checkout error: ${data.error ?? "unknown"}`);
        setBusy(null);
      }
    } catch (e) {
      console.error(e);
      setBusy(null);
    }
  }

  return (
    <main>
      <h1>Pricing</h1>
      <p>
        Local-LLM resume tailoring. Cancel any time. Refunds within 7 days,
        no questions asked.
      </p>

      {/* Mid-funnel reminder — visitors landing here directly need to
         see what they're paying for. Same demo as the home page. */}
      <div style={{
          margin: "20px 0 28px",
          maxWidth: 280,
          marginLeft: "auto", marginRight: "auto",
          borderRadius: 14, overflow: "hidden",
          border: "1px solid #1e242c",
          background: "#0a0e16",
      }}>
        <video
          src="/launch-demo.mp4"
          poster="/launch-demo-poster.png"
          autoPlay muted loop playsInline
          style={{ width: "100%", display: "block" }}
          aria-label="ATS Resume Tailor demo: keyword match jumps from 47% to 89%"
        />
      </div>
      {showINR && !isIndia && (
        <p style={{ background: "#1f2740", padding: "10px 14px",
                    borderRadius: 8, fontSize: 13, color: "#a9b0bd" }}>
          International cards are billed in INR for now (~{Math.round(83)} INR per USD).
          Native USD billing coming once Razorpay approves international payments.
        </p>
      )}

      {TIERS.map((t) => {
        const price = t[cur as "USD" | "INR"];
        const isFree = !t.envKey;
        return (
          <section key={t.name} className="tier">
            <div style={{
                display: "flex", alignItems: "baseline",
                justifyContent: "space-between", flexWrap: "wrap",
                gap: 8,
            }}>
              <h2 style={{ margin: 0 }}>{t.name}</h2>
              {t.badge && (
                <span style={{
                    fontSize: 12, color: "#a9b0bd",
                    background: "#0f1218", padding: "4px 10px",
                    borderRadius: 999, border: "1px solid #1e242c",
                }}>{t.badge}</span>
              )}
            </div>
            <div className="price">{price.label}</div>
            {price.sublabel && (
              <p style={{ fontSize: 12, color: "#6b7280", marginTop: -8 }}>
                {price.sublabel}
              </p>
            )}
            <ul>{t.features.map((f) => <li key={f}>{f}</li>)}</ul>
            {isFree ? (
              <a className="cta" href="/">Try it now →</a>
            ) : (
              <button
                type="button"
                className="cta"
                disabled={busy === t.envKey}
                onClick={() => subscribe(t.envKey)}>
                {busy === t.envKey ? "Redirecting…" : "Subscribe"}
              </button>
            )}
          </section>
        );
      })}
    </main>
  );
}
