import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { siteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: "About LeeMockups — Built by an Independent Designer",
  description: "Meet the idea behind LeeMockups: browser-based video mockups for independent designers and print-on-demand sellers, without Photoshop or 3D software.",
  alternates: { canonical: "/about/" },
};

export default function AboutPage() {
  return <main className="about-page">
    <SiteNav />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "AboutPage", name: "About LeeMockups", url: `${siteUrl}/about/`, about: { "@type": "Organization", name: "LeeMockups", url: siteUrl, email: "support@leemockups.com" } }) }} />
    <header className="about-hero shell"><span className="section-tag">INDEPENDENTLY BUILT</span><h1>Your design deserves<br /><em>a little motion.</em></h1><p>LeeMockups is an independent designer’s project, made to help other creators show their work through product videos.</p></header>
    <section className="about-story shell"><div><span className="section-tag">WHY LEEMOCKUPS EXISTS</span><h2>More time for your designs.<br />Less time learning software.</h2></div><div><p>Creating a product video can mean filming a physical sample, editing footage, or learning a 3D workflow. For a seller working on a new print or collection, that can be a lot of work before the listing is even ready.</p><p>LeeMockups takes a simpler approach: start with a prepared moving scene, add your artwork, adjust its placement, and generate a video and matching still images in your browser.</p><p>The focus is practical: T-shirts, mugs, posters, and frames for print-on-demand shops, independent brands, and designers presenting their work.</p></div></section>
    <section className="about-values shell" aria-label="How LeeMockups works"><article><span>01</span><h2>Prepared scenes.<br />Your own artwork.</h2><p>The scene and movement are already made. You choose the design, size, and placement—without editing a PSD or building a 3D model.</p></article><article><span>02</span><h2>Buy the mockup<br />you need.</h2><p>Paid mockups are purchased individually with a one-time payment. Free mockups let you try the workflow before choosing a paid scene.</p></article><article><span>03</span><h2>Create in your<br />own browser.</h2><p>Your imported artwork is processed in your browser and is not automatically uploaded to LeeMockups. No separate creation software is required.</p></article></section>
    <section className="about-contact shell"><div><span className="section-tag">SEE IT FOR YOURSELF</span><h2>Try a scene. Ask a question.</h2><p>Watch the real workflow, test a free mockup, or get in touch about a product or an order.</p><div className="hero-actions"><Link className="button primary" href="/#try-free">Try a free mockup</Link><Link className="button secondary" href="/#demo">Watch the walkthrough</Link></div></div><div className="about-contact-card"><h3>Contact LeeMockups</h3><a href="mailto:support@leemockups.com">support@leemockups.com</a><p>For order questions, include your mockup name and Creem order number.</p><Link href="/help/">Help &amp; purchase access →</Link></div></section>
    <footer className="shell"><Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></Link><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
