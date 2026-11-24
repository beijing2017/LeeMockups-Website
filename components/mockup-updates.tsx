"use client";

import { useEffect, useState, type FormEvent } from "react";

const api = "https://downloads.leemockups.com/updates";
const visitedKey = "leemockups:seen-mockups:v1";

export function MockupUpdates({ skus }: { skus: string[] }) {
  const [added, setAdded] = useState(0);
  const [mailEnabled, setMailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const previous = JSON.parse(localStorage.getItem(visitedKey) || "null");
      if (Array.isArray(previous)) setAdded(skus.filter((sku) => !previous.includes(sku)).length);
      localStorage.setItem(visitedKey, JSON.stringify(skus));
    } catch { /* Private browsing can block local storage. */ }
    fetch(`${api}/config`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => setMailEnabled(data?.enabled === true))
      .catch(() => undefined);
  }, [skus]);

  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setMessage("");
    setResult(null);
    try {
      const response = await fetch(`${api}/subscribe`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again later.");
      setMessage(result.message || "You're subscribed. We'll email you when new mockups arrive.");
      setResult("success");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again later.");
      setResult("error");
    } finally {
      setSending(false);
    }
  }

  if (!added && !mailEnabled) return null;
  return <section className="mockup-updates shell" aria-label="Mockup updates">
    {added > 0 && <div className="mockup-updates-visit"><strong>{added} {added === 1 ? "mockup" : "mockups"} added since your last visit</strong><a href="/mockups/">Browse the library <span aria-hidden="true">→</span></a></div>}
    {mailEnabled && <div className="mockup-updates-mail"><div><strong>Hear about new mockups</strong><p className={`mockup-updates-message${result ? ` is-${result}` : ""}`} role="status">{message || "Only product updates. Unsubscribe any time."}</p></div><form onSubmit={subscribe}><label className="sr-only" htmlFor="mockup-updates-email">Email address</label><input id="mockup-updates-email" type="email" autoComplete="email" required maxLength={254} placeholder="Your email address" value={email} onChange={(event) => { setEmail(event.target.value); setMessage(""); setResult(null); }} /><button className={result ? `is-${result}` : ""} type="submit" disabled={sending || result === "success"}>{sending ? "Sending…" : result === "success" ? "✓ Subscribed" : result === "error" ? "Try again" : "Notify me"}</button></form></div>}
  </section>;
}
