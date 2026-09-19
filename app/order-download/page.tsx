"use client";

import { Download, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";

type DownloadItem = { sku: string; name: string; url: string };

export default function OrderDownloadPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setDownloads([]);
    try {
      const response = await fetch("https://downloads.leemockups.com/commerce/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "PADDLE", transactionId: orderNumber, email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not verify this order.");
      const verifiedDownloads: DownloadItem[] = body.downloads || [];
      for (const item of verifiedDownloads) {
        localStorage.setItem(`leemockups-purchase:${item.sku}`, JSON.stringify({ transactionId: orderNumber, claimToken: "", email }));
      }
      setDownloads(verifiedDownloads);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not verify this order.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="order-page">
    <SiteNav current="order-download" />
    <section className="order-shell shell">
      <div className="order-copy"><span className="section-tag">PURCHASE DOWNLOAD</span><h1>Get your mockup.</h1><p>Enter the invoice number shown in your Paddle receipt. We’ll verify the payment and create a private download link.</p><ul><li><ShieldCheck /> Secure, time-limited download</li><li><KeyRound /> No LeeMockups account required</li></ul></div>
      <div className="order-card">
        <form onSubmit={redeem}>
          <label>Invoice number<input required autoComplete="off" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.trim())} placeholder="e.g. 47733-10001" /></label>
          <label>Email used at checkout<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <button className="button primary" disabled={busy}>{busy ? "Verifying purchase…" : "Get my download"}</button>
        </form>
        {error && <div className="order-message error" role="alert">{error}</div>}
        {downloads.length > 0 && <div className="order-results" aria-live="polite"><strong>Purchase verified</strong><p>Your private links expire in 30 minutes.</p>{downloads.map((item) => <a className="button primary" key={item.sku} href={item.url}><Download size={17} /> Download {item.name}</a>)}</div>}
        <p className="order-help">Need help? Contact LeeMockups support with your order details.</p>
      </div>
    </section>
    <footer className="shell"><div className="brand"><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
