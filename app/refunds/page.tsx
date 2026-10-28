import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";

export const metadata: Metadata = { title: "Refund Policy", description: "Refund eligibility and request instructions for LeeMockups digital products.", alternates: { canonical: "/refunds/" } };

export default function RefundsPage() {
  return <main className="legal-page"><SiteNav /><article className="legal-shell shell">
    <header><span>LEGAL</span><h1>Refund Policy</h1><p>Last updated: September 23, 2026</p></header>
    <section><h2>1. Digital products are generally non-refundable</h2><p>LeeMockups sells immediately accessible digital mockups for online video creation. <strong>Digital content can be accessed and used immediately after delivery.</strong> For this reason, except where required by applicable law or Creem’s refund policy, <strong>purchases are generally final, non-refundable, and non-exchangeable.</strong> Please review the product description before purchase.</p></section>
    <section><h2>2. Limited exceptions</h2><p><strong>A refund will only be considered where there is a specific and valid reason</strong>, such as the product not being delivered, being materially different from its description, having a material defect, or being unusable on a supported system after reasonable troubleshooting. Refunds may also be provided where mandatory consumer-protection law requires them. Nothing in this policy limits rights that cannot legally be excluded.</p></section>
    <section><h2>3. Creem transactions</h2><p>Creem is the Merchant of Record for purchases processed through Creem. Eligibility is determined under Creem’s current refund policy and applicable law. Creem may also approve or decline a discretionary refund after considering the product, the reason for the request, and whether it has been downloaded, accessed, or used.</p></section>
    <section><h2>4. How to request help or a refund</h2><p>For product troubleshooting or to request a refund, email <a href="mailto:support@leemockups.com">support@leemockups.com</a> and provide the email address used at checkout and your order details.</p></section>
    <section><h2>5. Processing and access</h2><p>Approved refunds are returned to the original payment method where possible. Processing times vary by bank and payment network. If a refund is issued, the associated license and access end.</p></section>
    <section><h2>6. Fraud, abuse, and chargebacks</h2><p>Refunds may be refused where there is evidence of fraud, refund abuse, chargeback abuse, or other manipulative behavior. Please contact LeeMockups support before starting a chargeback so the issue can be investigated promptly. This does not prevent you from exercising rights available through your payment provider or applicable law.</p></section>
  </article><footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer></main>;
}
