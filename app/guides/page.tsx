import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "POD, Etsy & Video Mockup Guides",
  description: "Practical guides for POD sellers: Etsy listing videos, T-shirt and mug mockups, artwork placement, and creating product videos without filming or Photoshop.",
  alternates: { canonical: "/guides/" },
};

export default function GuidesPage() {
  return <main className="guides-page">
    <SiteNav current="guides" />
    <div className="shell guides-shell">
      <div className="guides-intro">
        <span className="section-tag">LEEMOCKUPS GUIDES</span>
        <h1>Make product mockups that help buyers see your design.</h1>
        <p>Practical answers for Etsy and print-on-demand sellers. Learn how to choose a scene, place artwork, make listing videos, and review the result before you publish.</p>
      </div>
      {(["Etsy listings", "POD selling", "Make a mockup"] as const).map((category) => <section className="guides-group" key={category}>
        <h2>{category}</h2>
        <div className="guides-grid">
          {guides.filter((guide) => guide.category === category).map((guide) => <Link className="guide-card" href={`/guides/${guide.slug}/`} key={guide.slug}>
            <span>{guide.category}</span><h3>{guide.title}</h3><p>{guide.description}</p><strong>Read guide <span aria-hidden="true">→</span></strong>
          </Link>)}
        </div>
      </section>)}
    </div>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}

