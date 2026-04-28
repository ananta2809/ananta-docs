"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (resp: unknown) => void) => void;
    };
  }
}

const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? "";

export default function Pay() {
  const [status, setStatus] = useState<"idle"|"loading"|"open"
                                         |"paid"|"failed"|"cancelled">("idle");
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    // Inject Razorpay checkout SDK once
    if (document.getElementById("rzp-sdk")) return;
    const s = document.createElement("script");
    s.id = "rzp-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  async function pay(amount_paise: number, label: string) {
    if (status === "loading" || status === "open") return;
    setStatus("loading");
    setMsg(`creating ${label} order…`);
    try {
      const r = await fetch("/api/razorpay/order/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amount: amount_paise,
          currency: "INR",
          receipt: `pay-${Date.now().toString(36)}`,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "create_failed");

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not yet loaded — try in 2s");
      }

      setStatus("open");
      setMsg("opening payment modal…");
      const rzp = new window.Razorpay({
        key:      data.key_id ?? KEY_ID,
        order_id: data.order_id,
        amount:   data.amount,
        currency: data.currency,
        name:     "ANANTA · ATS Resume Tailor",
        description: label,
        theme:    { color: "#FFB400" },
        modal: {
          ondismiss: () => {
            setStatus("cancelled");
            setMsg("you cancelled the payment.");
          },
        },
        handler: async (resp: Record<string, string>) => {
          setMsg("verifying signature…");
          const v = await fetch("/api/razorpay/order/verify", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(resp),
          });
          const j = await v.json();
          if (j.ok) {
            setStatus("paid");
            setMsg(`✅ paid · payment_id ${resp.razorpay_payment_id}`);
          } else {
            setStatus("failed");
            setMsg(`signature verification failed: ${j.error ?? "?"}`);
          }
        },
      });
      rzp.on("payment.failed", (resp) => {
        setStatus("failed");
        const r = resp as { error?: { description?: string } };
        setMsg(`payment failed: ${r.error?.description ?? "unknown"}`);
      });
      rzp.open();
    } catch (e: unknown) {
      setStatus("failed");
      setMsg(e instanceof Error ? e.message : "unknown error");
    }
  }

  return (
    <main>
      <h1>Pay (test)</h1>
      <p>
        Razorpay Standard Checkout demo. Use test card{" "}
        <code>4111 1111 1111 1111</code> · any future expiry · any CVV.
        Amounts are in paise; ₹100 = 10,000 paise.
      </p>
      <div className="tier" style={{marginTop: 24}}>
        <h2 style={{margin: 0}}>One-time test payment</h2>
        <div style={{display: "flex", gap: 12, marginTop: 16,
                      flexWrap: "wrap"}}>
          <button className="cta" onClick={() => pay(10000,  "₹100 test")}>
            Pay ₹100
          </button>
          <button className="cta" onClick={() => pay(50000,  "₹500 test")}>
            Pay ₹500
          </button>
          <button className="cta" onClick={() => pay(100000, "₹1,000 test")}>
            Pay ₹1,000
          </button>
        </div>
        {msg && (
          <p style={{
              marginTop: 18, padding: "10px 14px",
              background: status === "paid"
                ? "rgba(34,197,94,0.12)"
                : status === "failed"
                  ? "rgba(239,68,68,0.12)"
                  : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, fontSize: 13,
          }}>
            {msg}
          </p>
        )}
      </div>
      <p style={{marginTop: 32, fontSize: 13, color: "#a9b0bd"}}>
        Note: this is the one-time-payment surface. Subscription
        signups (Starter/Pro recurring) live on the{" "}
        <a href="/pricing" style={{color: "#FFB400"}}>pricing page</a>.
      </p>
    </main>
  );
}
