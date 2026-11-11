"use client";

import { useEffect, useState, type FormEvent } from "react";

const api = "https://downloads.leemockups.com/updates";
const visitedKey = "leemockups:seen-mockups:v1";

export function MockupUpdates({ skus }: { skus: string[] }) {
  const [added, setAdded] = useState(0);
  const [mailEnabled, setMailEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
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
    try {
      const response = await fetch(`${api}/subscribe`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Please try again later.");
      setMessage(result.message || "Check your inbox to confirm your subscription.");
      setEmail("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again later.");
    } finally {
      setSending(false);
    }
  }

  if (!added && !mailEnabled) return null;
  return <section className="mockup-updates shell" aria-label="Mockup updates">
    {added > 0 && <div className="mockup-updates-visit"><strong>{added} {added === 1 ? "mockup" : "mockups"} added since your last visit</strong><a href="/mockups/">Browse the library <span aria-hidden="true">→</span></a></div>}
    {mailEnabled && <div className="mockup-updates-mail"><div><strong>Hear about new mockups</strong><p>Only product updates. Confirm by email; unsubscribe any time.</p></div><form onSubmit={subscribe}><label className="sr-only" htmlFor="mockup-updates-email">Email address</label><input id="mockup-updates-email" type="email" autoComplete="email" required maxLength={254} placeholder="Your email address" value={email} onChange={(event) => setEmail(event.target.value)} /><button type="submit" disabled={sending}>{sending ? "Sending…" : "Notify me"}</button></form>{message && <p className="mockup-updates-message" role="status">{message}</p>}</div>}
  </section>;
}
