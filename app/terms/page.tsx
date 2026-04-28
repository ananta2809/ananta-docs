export const metadata = {
  title: "Terms of Service · ATS Resume Tailor",
  description: "Service terms for the ATS Resume Tailor subscription.",
};

export default function Terms() {
  const today = "April 25, 2026";
  return (
    <main>
      <h1>Terms of Service</h1>
      <p style={{color:"#a9b0bd"}}>Last updated: {today}</p>

      <h2>1. Service</h2>
      <p>
        ATS Resume Tailor (&quot;the Service&quot;) is operated by ANANTA Trade
        (&quot;we&quot;, &quot;us&quot;). The Service rewrites a user-supplied
        resume to match a user-supplied job description, using a self-hosted
        large-language model. We do not store the resume or job description
        beyond the request lifecycle.
      </p>

      <h2>2. Subscriptions</h2>
      <p>
        Paid plans (Starter $9/month, Pro $29/month) renew automatically every
        billing period. You can cancel at any time from your Stripe customer
        portal; access continues through the end of the current billing
        period. We charge through Stripe; we never see or store your card
        details.
      </p>

      <h2>3. Acceptable use</h2>
      <p>
        You may not submit content you do not have the right to share, attempt
        to extract or reverse-engineer the underlying model, or use the
        Service to generate fraudulent applications. We reserve the right to
        suspend accounts violating these terms.
      </p>

      <h2>4. No employment guarantee</h2>
      <p>
        The Service produces a tailored resume; it does not guarantee any
        interview, offer, or employment outcome. Resume effectiveness depends
        on factors outside our control.
      </p>

      <h2>5. Limitation of liability</h2>
      <p>
        We provide the Service &quot;as is&quot;. To the maximum extent
        permitted by law, our aggregate liability for any claim is limited to
        the amount you paid us in the 12 months preceding the claim.
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update these terms; material changes will be announced 30 days
        before they take effect. Continued use after that date constitutes
        acceptance.
      </p>

      <h2>7. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Disputes are subject
        to the exclusive jurisdiction of the courts in the operator&apos;s
        registered state.
      </p>

      <h2>8. Contact</h2>
      <p>See <a href="/contact">/contact</a> for ways to reach us.</p>
    </main>
  );
}
