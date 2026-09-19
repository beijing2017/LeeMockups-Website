"use client";

import { FormEvent, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [failed, setFailed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const screenshot = data.get("Screenshot");
    if (screenshot instanceof File && screenshot.size > 0) {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(screenshot.type)) {
        setFailed(true);
        setStatus("Please attach a PNG, JPG, or WebP image.");
        return;
      }
      if (screenshot.size > 10 * 1024 * 1024) {
        setFailed(true);
        setStatus("The screenshot must be 10 MB or smaller.");
        return;
      }
    }
    setBusy(true);
    setStatus("Sending your feedback…");
    setFailed(false);
    try {
      data.set("_subject", `LeeMockups website feedback: ${data.get("Type") || "Message"}`);
      data.set("Page", window.location.href);
      const response = await fetch("https://formsubmit.co/ajax/deaspliang@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      if (!response.ok) throw new Error();
      formRef.current?.reset();
      setStatus("Thank you — your feedback was sent.");
    } catch {
      setFailed(true);
      setStatus("We couldn’t send this message. Please email deaspliang@gmail.com.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="site-feedback-trigger" type="button" onClick={() => { setOpen(true); setStatus(""); setFailed(false); }}><MessageCircle size={17} /> Feedback</button>
    {open && <div className="site-feedback-dialog" role="dialog" aria-modal="true" aria-labelledby="feedback-title" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <form className="site-feedback-card" ref={formRef} onSubmit={submit}>
        <div className="site-feedback-heading"><div><span>WE’D LOVE TO HEAR FROM YOU</span><h2 id="feedback-title">Send feedback</h2></div><button type="button" aria-label="Close feedback form" onClick={() => setOpen(false)}><X /></button></div>
        <p>Found a problem, have an idea, or need help? Tell us below. A screenshot is optional.</p>
        <label>Type<select name="Type" defaultValue="Question"><option>Bug report</option><option>Question</option><option>Suggestion</option></select></label>
        <label>What happened?<textarea name="Message" rows={5} maxLength={5000} required placeholder="Please include what you expected and what you saw." /></label>
        <label>Email for reply<input name="Email" type="email" maxLength={254} required placeholder="you@example.com" /></label>
        <label>Screenshot <small>Optional · PNG, JPG, or WebP · up to 10 MB</small><input name="Screenshot" type="file" accept="image/png,image/jpeg,image/webp" /></label>
        <p className="site-feedback-privacy">Only the information entered here, the optional screenshot, and the current page address are sent to LeeMockups support.</p>
        {status && <p className={`site-feedback-status${failed ? " error" : ""}`} role="status">{status}</p>}
        <div className="site-feedback-actions"><button type="button" onClick={() => setOpen(false)}>Cancel</button><button className="primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Send feedback"}</button></div>
      </form>
    </div>}
  </>;
}
