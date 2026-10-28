"use client";

import { Play, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { openPurchasedComposer } from "@/lib/browser-composer";

type DownloadItem = { sku: string; name: string; url: string };
const lastOrderKey = "leemockups:last-order-reference";

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
        body: JSON.stringify({ provider: "CREEM", transactionId: orderNumber, email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not verify this order.");
      const verifiedDownloads: DownloadItem[] = body.downloads || [];
      for (const item of verifiedDownloads) {
        localStorage.setItem(`leemockups-purchase:${item.sku}`, JSON.stringify({ transactionId: orderNumber, claimToken: "", email }));
      }
      localStorage.setItem(lastOrderKey, orderNumber);
      setDownloads(verifiedDownloads);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not verify this order.");
    } finally {
      setBusy(false);
    }
  }

  function beginCreate(item: DownloadItem) {
    try { openPurchasedComposer(item); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The creator could not open."); }
  }

  return <main className="order-page">
    <SiteNav current="order-download" />
    <section className="order-shell shell">
      <div className="order-copy"><span className="section-tag">PURCHASE ACCESS</span><h1>Create your mockup.</h1><p>Enter the order number from your Creem receipt. We’ll verify your purchase and open the online creator.</p><ul><li><ShieldCheck /> Secure, time-limited access</li><li><KeyRound /> No LeeMockups account required</li></ul></div>
      <div className="order-card">
        <form onSubmit={redeem}>
          <label>Order number<input required autoComplete="off" value={orderNumber} onFocus={() => { if (!orderNumber) setOrderNumber(localStorage.getItem(lastOrderKey) || ""); }} onChange={(event) => setOrderNumber(event.target.value.trim())} placeholder="e.g. ORD-1A0CA4D195542817" /></label>
          <label>Email used at checkout<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          {downloads.length > 0
            ? <button className="button primary purchase-primary purchased" type="button" onClick={() => beginCreate(downloads[0])}><Play size={17} /> Create video online</button>
            : <button className="button primary" disabled={busy}>{busy ? "Verifying purchase…" : "Verify my purchase"}</button>}
        </form>
        {error && <div className="order-message error" role="alert">{error}</div>}
        <p className="order-help">Need help? Email <a href="mailto:support@leemockups.com">support@leemockups.com</a> with your order details.</p>
      </div>
    </section>
    <footer className="shell"><div className="brand"><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
