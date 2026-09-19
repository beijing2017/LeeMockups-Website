import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupDetailClient } from "./mockup-detail-client";

export const metadata: Metadata = {
  title: "Mockup details",
  description: "Review compatibility, included files, usage instructions, and purchase details before choosing a LeeMockups template.",
  alternates: { canonical: "/mockup/" },
};

export default function MockupPage() {
  return <main className="mockup-product-page"><SiteNav current="mockups" /><Suspense fallback={<div className="mockup-detail-state shell">Loading mockup details…</div>}><MockupDetailClient /></Suspense><footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer></main>;
}
