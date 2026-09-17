"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, KeyRound, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

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
      const response = await fetch("https://downloads.leemockups.com/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderNumber, email }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "We could not verify this order.");
      setDownloads(body.downloads || []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "We could not verify this order.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="order-page">
    <nav className="nav shell">
      <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span><span className="beta-badge">BETA</span></Link>
      <div className="nav-links"><Link href="/mockups/">Mockup Library</Link><Link href="/help/">Help</Link><Link href="/#download">Get the app</Link></div>
      <Link className="nav-cta" href="/#download"><Download size={15} /> Get the app</Link>
    </nav>
    <section className="order-shell shell">
      <div className="order-copy"><span className="section-tag">ETSY PURCHASE DOWNLOAD</span><h1>Get your mockup.</h1><p>Enter the Etsy order number and the email used at checkout. We’ll verify your purchase and create a private download link.</p><ul><li><ShieldCheck /> Secure, time-limited download</li><li><KeyRound /> No LeeMockups account required</li></ul></div>
      <div className="order-card">
        <form onSubmit={redeem}>
          <label>Etsy order number<input required inputMode="numeric" autoComplete="off" value={orderNumber} onChange={(event) => setOrderNumber(event.target.value.replace(/\D/g, ""))} placeholder="e.g. 1234567890" /></label>
          <label>Email used at checkout<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <button className="button primary" disabled={busy}>{busy ? "Verifying purchase…" : "Get my download"}</button>
        </form>
        {error && <div className="order-message error" role="alert">{error}</div>}
        {downloads.length > 0 && <div className="order-results" aria-live="polite"><strong>Purchase verified</strong><p>Your private links expire in 30 minutes.</p>{downloads.map((item) => <a className="button primary" key={item.sku} href={item.url}><Download size={17} /> Download {item.name}</a>)}</div>}
        <p className="order-help">Need help? Contact us from your Etsy order page so we can verify the purchase safely.</p>
      </div>
    </section>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><p>The term “Etsy” is a trademark of Etsy, Inc. This application uses the Etsy API but is not endorsed or certified by Etsy, Inc.</p><span>© 2026 LeeMockups</span></footer>
  </main>;
}
