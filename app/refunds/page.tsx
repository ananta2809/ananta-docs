export const metadata = {
  title: "Refund & Cancellation Policy · ATS Resume Tailor",
  description: "How refunds and cancellations work.",
};

export default function Refunds() {
  const today = "April 25, 2026";
  return (
    <main>
      <h1>Refund &amp; Cancellation Policy</h1>
      <p style={{color:"#a9b0bd"}}>Last updated: {today}</p>

      <h2>Cancellation</h2>
      <p>
        You can cancel a paid subscription at any time from the Stripe
        customer portal (link in any invoice email). Your access remains
        active through the end of the current billing period; we do not
        charge any cancellation fee.
      </p>

      <h2>Refunds</h2>
      <p>
        We offer a <strong>7-day no-questions-asked refund</strong> on the
        first month of any new paid subscription. To request, email the
        address listed at <a href="/contact">/contact</a> with your Stripe
        receipt or the email used for checkout. Refunds are processed
        through Stripe and typically appear on your statement within 5-10
        business days.
      </p>

      <h2>Outside the refund window</h2>
      <p>
        Renewals after the first 7 days are non-refundable, but you can
        cancel at any time to prevent the next renewal. Pro-rata refunds
        for unused time within a renewed period are not available.
      </p>

      <h2>Failed payments</h2>
      <p>
        If a payment fails, Stripe automatically retries on a standard
        schedule. After repeated failures the subscription is paused; you
        can resume it from the customer portal once the card is updated.
      </p>

      <h2>Service unavailability</h2>
      <p>
        If the Service is unavailable for more than 24 consecutive hours
        within a billing period due to our fault, we will refund a pro-rata
        amount on request.
      </p>

      <h2>Disputes</h2>
      <p>
        Please contact us before opening a chargeback — most issues are
        resolved faster directly. Chargebacks lodged without prior contact
        may be contested with Stripe.
      </p>
    </main>
  );
}
