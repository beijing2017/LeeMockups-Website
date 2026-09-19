import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";

export const metadata: Metadata = { title: "Refund Policy", description: "Refund eligibility and request instructions for LeeMockups digital products.", alternates: { canonical: "/refunds/" } };

export default function RefundsPage() {
  return <main className="legal-page"><SiteNav /><article className="legal-shell shell">
    <header><span>LEGAL</span><h1>Refund Policy</h1><p>Last updated: September 20, 2026</p></header>
    <section><h2>1. Digital products are generally non-refundable</h2><p>LeeMockups sells immediately accessible digital software and downloadable mockup templates. Digital files can be copied, retained, and distributed immediately after delivery, so delivery cannot be meaningfully reversed once a product has been downloaded, accessed, or used. For this reason, except where required by applicable law or Paddle’s refund policy, all purchases are final, non-refundable, and non-exchangeable. We do not provide refunds for change of mind, accidental purchases, or failure to review the product description and system requirements before purchase.</p></section>
    <section><h2>2. Limited exceptions</h2><p>A refund will only be considered where there is a specific and valid reason, such as the product not being delivered, being materially different from its description, having a material defect, or being unusable on a supported system after reasonable troubleshooting. Refunds may also be provided where mandatory consumer-protection law requires them. Nothing in this policy limits rights that cannot legally be excluded.</p></section>
    <section><h2>3. Paddle transactions</h2><p>Paddle is the Merchant of Record for purchases processed through Paddle. Eligibility is determined under Paddle’s current refund policy and applicable law. Paddle may also approve or decline a discretionary refund after considering the product, the reason for the request, and whether it has been downloaded, accessed, or used.</p></section>
    <section><h2>4. How to request help or a refund</h2><p>First use the feedback icon in the lower-right corner of this website if you need product troubleshooting. To request a refund for a Paddle purchase, visit <a href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> and provide the email address used at checkout and your transaction details.</p></section>
    <section><h2>5. Processing and access</h2><p>Approved refunds are returned by Paddle to the original payment method where possible. Processing times vary by bank and payment network. If a refund is issued, the associated license and access end, and you must stop using and delete the refunded original software and template files.</p></section>
    <section><h2>6. Fraud, abuse, and chargebacks</h2><p>Refunds may be refused where there is evidence of fraud, refund abuse, chargeback abuse, or other manipulative behavior. Please contact Paddle or LeeMockups support before starting a chargeback so the issue can be investigated promptly. This does not prevent you from exercising rights available through your payment provider or applicable law.</p></section>
  </article><footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer></main>;
}
