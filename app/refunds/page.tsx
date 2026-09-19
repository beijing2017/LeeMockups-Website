import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";

export const metadata: Metadata = { title: "Refund Policy", description: "Refund eligibility and request instructions for LeeMockups digital products.", alternates: { canonical: "/refunds/" } };

export default function RefundsPage() {
  return <main className="legal-page"><SiteNav /><article className="legal-shell shell">
    <header><span>LEGAL</span><h1>Refund Policy</h1><p>Last updated: September 19, 2026</p></header>
    <section><h2>1. Our 30-day guarantee</h2><p>We want you to be confident in your purchase. You may request a refund within 30 days of the transaction date. We will review requests fairly, including where a product cannot be delivered, is materially different from its description, is defective, or cannot be used on a supported system after reasonable troubleshooting.</p></section>
    <section><h2>2. Digital products</h2><p>LeeMockups sells downloadable software and digital templates. Because digital files can be copied after delivery, we may ask for the order details and a short explanation of the issue. This does not limit any mandatory cancellation, withdrawal, refund, or consumer rights available under applicable law.</p></section>
    <section><h2>3. How to request a refund</h2><p>For purchases processed by Paddle, submit the request through <a href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> and provide the email address used at checkout and your transaction details. You may also contact <a href="mailto:deaspliang@gmail.com">deaspliang@gmail.com</a> for product troubleshooting or supporting information.</p></section>
    <section><h2>4. Processing</h2><p>Paddle is the Merchant of Record and processes approved refunds to the original payment method. Bank and payment-network processing times vary. Paddle may refuse or reverse a refund where there is evidence of fraud, refund abuse, chargeback abuse, or other manipulative behavior.</p></section>
    <section><h2>5. Effect of a refund</h2><p>When a purchase is refunded, the license and access associated with that purchase end. You must stop using and delete the refunded original template files. Exported customer work created before a legitimate refund is not automatically deleted, subject to applicable law and these Terms.</p></section>
    <section><h2>6. Chargebacks</h2><p>Please contact Paddle or LeeMockups support before starting a chargeback so the issue can be investigated promptly. This does not prevent you from exercising rights available through your payment provider or applicable law.</p></section>
  </article><footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer></main>;
}
