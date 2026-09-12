import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { MockupCatalog } from "@/components/mockup-catalog";

export const metadata: Metadata = {
  title: "Animated Mockup Library",
  description: "Explore LeeMockups animated product mockups for Etsy listings. Add your artwork in the free desktop app and export polished videos and still images.",
  alternates: { canonical: "/mockups/" },
};

export default function MockupsPage() {
  return <main className="mockups-page">
    <nav className="nav shell"><Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span></Link><div className="nav-links"><Link href="/">Home</Link><Link href="/mockups/" aria-current="page">Mockup library</Link><Link href="/help/">Help</Link></div><Link className="nav-cta" href="/#download">Get the app <ArrowUpRight size={15} /></Link></nav>
    <header className="mockups-hero"><div className="shell"><span className="mockups-eyebrow"><Sparkles size={14} /> THE MOCKUP LIBRARY</span><h1>Make every listing<br /><em>move beautifully.</em></h1><p>Animated mockups made for your products and your shop. Choose a scene, add your artwork in LeeMockups, and create a video worth watching.</p></div></header>
    <MockupCatalog />
    <section className="catalog-bottom shell"><div><span className="section-tag">NEW TO LEEMOCKUPS?</span><h2>One free app. Every mockup you own.</h2><p>Buy the scenes you love, then use them in the same private desktop app on Windows or Mac.</p></div><Link className="button primary" href="/#how">See how it works <ArrowUpRight size={17} /></Link></section>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><p>Professional Mockups. Smarter Marketing.</p><span>© 2026 LeeMockups</span></footer>
  </main>;
}
