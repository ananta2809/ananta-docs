export const metadata = {
  title: "Privacy Policy · ATS Resume Tailor",
  description: "How ATS Resume Tailor handles your data.",
};

export default function Privacy() {
  const today = "April 25, 2026";
  return (
    <main>
      <h1>Privacy Policy</h1>
      <p style={{color:"#a9b0bd"}}>Last updated: {today}</p>

      <h2>What we collect</h2>
      <ul>
        <li><strong>Resume + job description text</strong> — submitted by you for processing. Held in memory for the duration of one tailor request, then discarded. Not stored, not used for training.</li>
        <li><strong>Email address</strong> — only if you subscribe to a paid plan, and only via Stripe&apos;s checkout. Used to send invoices and account-related emails.</li>
        <li><strong>IP address (hashed)</strong> — for free-tier quota enforcement. We hash it with a process secret + the calendar month so we can count your monthly usage without storing the IP itself.</li>
        <li><strong>Stripe customer ID</strong> — to associate your subscription state with your account.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We never send your resume or job description to a third-party LLM provider (OpenAI, Anthropic, Google). The model runs on hardware we control.</li>
        <li>We do not sell, rent, or share your data with advertisers or data brokers.</li>
        <li>No tracking pixels, no behavioural analytics. Page-load timing is collected by Vercel for infrastructure metrics only.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We set a session cookie only after you sign in (post-launch feature).
        Stripe sets its own cookies on the checkout page; their cookie policy
        is at <a href="https://stripe.com/cookies-policy/legal">stripe.com</a>.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request deletion of any data we hold about you by emailing
        the address in <a href="/contact">/contact</a>. We respond within 30
        days. Stripe-held billing records are retained for legal/tax
        obligations as required by law.
      </p>

      <h2>Data location</h2>
      <p>
        Inference compute is performed on a Mac Mini located in the United
        States. Vercel hosts the website (multi-region). Stripe processes
        payments and stores billing data per their global policy.
      </p>

      <h2>Changes</h2>
      <p>
        Material changes are announced on this page 30 days before they take
        effect.
      </p>
    </main>
  );
}
