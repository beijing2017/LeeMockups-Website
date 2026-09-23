import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupQueryClient } from "./mockup-query-client";

export const metadata: Metadata = {
  title: "Video Mockup Details",
  description: "Explore LeeMockups video mockup templates. Review the preview, included MP4 and still images, compatibility, and purchase details.",
  robots: { index: false, follow: true },
};

export default function MockupPage() {
  return <main className="mockup-product-page"><SiteNav current="mockups" /><Suspense fallback={<div className="mockup-detail-state shell">Loading mockup details…</div>}><MockupQueryClient /></Suspense><footer className="legal-footer shell"><strong>LeeMockups</strong><PolicyLinks /><span>© 2026 LeeMockups</span></footer></main>;
}
