import Razorpay from "razorpay";

/**
 * Razorpay client factory — lazy by design so `next build` doesn't
 * fail when keys aren't set (e.g. preview branch without env).
 */
export function getRazorpay(): Razorpay {
  const key_id     = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not configured");
  }
  return new Razorpay({ key_id, key_secret });
}

export function tryGetRazorpay(): Razorpay | null {
  try { return getRazorpay(); } catch { return null; }
}

export function isLiveMode(): boolean {
  return (process.env.RAZORPAY_KEY_ID ?? "").startsWith("rzp_live_");
}

/**
 * Resolve which plan id (and currency) to use for the visitor.
 *
 * Inputs:
 *   tier     "starter" | "pro"
 *   country  ISO-2 country code (from cf-ipcountry header). May be "".
 *
 * Returns null when:
 *   - no plan map configured
 *   - the tier requested doesn't have a price for the resolved currency
 *
 * Until "International Payments" is approved on the Razorpay account,
 * the USD slot is null in the plan map → ALL visitors fall through to
 * INR. We surface this transparently to the UI via `currency` so the
 * pricing page can show "(billed in INR for now)" if needed.
 */
type PlanMap = {
  starter: { USD: string | null; INR: string | null };
  pro:     { USD: string | null; INR: string | null };
  intl_payments_enabled: boolean;
};

export function resolvePlan(tier: "starter" | "pro",
                              country: string): {
  planId:   string | null;
  currency: "INR" | "USD";
  fallback: boolean;
} {
  const raw = process.env.NEXT_PUBLIC_RAZORPAY_PLAN_IDS;
  if (!raw) return { planId: null, currency: "INR", fallback: false };
  let map: PlanMap;
  try { map = JSON.parse(raw); }
  catch { return { planId: null, currency: "INR", fallback: false }; }

  const tierMap = map[tier];
  if (!tierMap) return { planId: null, currency: "INR", fallback: false };

  const isIndia = country.toUpperCase() === "IN";
  const wantUSD = !isIndia && map.intl_payments_enabled
                  && tierMap.USD;
  if (wantUSD) {
    return { planId: tierMap.USD, currency: "USD", fallback: false };
  }
  // Fallback for non-IN visitors when intl payments isn't enabled yet
  return {
    planId:   tierMap.INR,
    currency: "INR",
    fallback: !isIndia,   // true when intl visitor pays in INR
  };
}
