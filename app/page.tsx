import type { Metadata } from "next";
import Image from "next/image";
import { AlertTriangle, Check, Download, ImagePlus, Play, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { DownloadOptions } from "@/components/download-options";
import { MockupCatalog } from "@/app/mockups/mockup-catalog";
import { getSeoCatalog } from "@/lib/catalog-seo";

const homeTitle = "Video Mockups for POD Sellers | LeeMockups";
const homeDescription = "Create T-shirt, mug, and other video mockups for print-on-demand (POD) product listings. Export videos and still images for Etsy, Shopify, and your own store.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  openGraph: { title: homeTitle, description: homeDescription },
  twitter: { title: homeTitle, description: homeDescription },
};

const appVersion = "1.13.81";
// Public Worker endpoints. The Worker streams private R2 objects and never redirects
// the browser to a bucket hostname or exposes predictable object keys.
const downloadBase = "https://downloads.leemockups.com/d";
const downloads = {
  windows: `${downloadBase}/windows`,
  macArm64: `${downloadBase}/mac-arm64`,
  macX64: `${downloadBase}/mac-x64`,
};

export default async function Home() {
  const seoSkus = (await getSeoCatalog()).map((product) => product.sku);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LeeMockups',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows, macOS',
    softwareVersion: appVersion,
    description: 'Desktop software for turning LeeMockups video mockup templates and artwork into product videos and still images.',
    url: 'https://www.leemockups.com/',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return <main className="home-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <SiteNav />

    <section className="hero product-first-hero shell" id="top">
      <svg className="hero-logo-watermark" viewBox="0 0 1600 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
        <defs><linearGradient id="hero-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8255f3" /><stop offset="1" stopColor="#ff7771" /></linearGradient></defs>
        <rect x="322" y="-54" width="870" height="584" rx="74" transform="rotate(-17 757 238)" fill="none" stroke="#8255f3" strokeOpacity=".12" strokeWidth="6" />
        <rect x="487" y="24" width="870" height="584" rx="74" transform="rotate(-12 922 316)" fill="none" stroke="#a778ee" strokeOpacity=".11" strokeWidth="6" />
        <rect x="611" y="74" width="870" height="584" rx="74" transform="rotate(-9 1046 366)" fill="none" stroke="url(#hero-logo-gradient)" strokeOpacity=".16" strokeWidth="7" />
        <circle cx="1258" cy="223" r="55" fill="url(#hero-logo-gradient)" opacity=".09" />
        <path d="M934 647 1134 366l129 161 112-130 126 170" fill="none" stroke="url(#hero-logo-gradient)" strokeOpacity=".09" strokeWidth="95" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="hero-copy">
        <div className="eyebrow">Made for print-on-demand sellers</div>
        <h1>Video mockups.<br /><em>Ready for your designs.</em></h1>
        <p>Create product videos and still images for your print-on-demand (POD) listings on Etsy, Shopify, and your own store—without filming every item.</p>
        <div className="hero-actions"><a className="button primary" href="#library">Browse Mockups</a><a className="text-link" href="#how"><Play size={15} fill="currentColor" /> See how it works</a></div>
      </div>
    </section>

    <section className="home-library" id="library" aria-labelledby="home-library-title">
      <div className="shell home-library-heading"><div><span className="section-tag">THE MOCKUP LIBRARY</span><h2 id="home-library-title">Find your next mockup</h2><p>Explore T-shirt, mug, and other video mockups for print-on-demand (POD) product listings—or try a free sample.</p></div><a href="/mockups/">View full library →</a></div>
      <MockupCatalog seoSkus={seoSkus} previewLimit={4} />
    </section>

    <section className="proof"><div className="shell proof-inner"><span>Built for the way you sell</span><b>PRODUCT LISTING READY</b><i /><b>WINDOWS &amp; macOS</b><i /><b>NO SUBSCRIPTION</b><i /><b>LOCAL &amp; PRIVATE</b></div></section>

    <section className="steps shell" id="how"><div className="section-heading"><span>SIMPLE ON PURPOSE</span><h2>From download to listing video<br />in three calm steps.</h2></div><div className="step-grid">
      <article><span className="step-num">01</span><div className="step-icon"><Download /></div><h3>Open your mockup</h3><p>Download your mockup, then drag the <code>.mockup</code> file into LeeMockups.</p></article>
      <article><span className="step-num">02</span><div className="step-icon coral"><ImagePlus /></div><h3>Add your artwork</h3><p>Choose a PNG or JPG. See it mapped into the scene instantly, including motion and perspective.</p></article>
      <article><span className="step-num">03</span><div className="step-icon green"><Play /></div><h3>Export for your shop</h3><p>Save an MP4 video and ready-to-use still images, then upload them to your product listings.</p></article>
    </div></section>

    <section className="feature-band" id="features"><div className="shell feature-grid"><div className="feature-copy"><span className="section-tag">THE QUIETLY POWERFUL PART</span><h2>Professional results.<br />None of the learning curve.</h2><p>LeeMockups handles perspective, motion, and export settings for you. Your only creative decision is the artwork.</p><ul><li><Check /> Real-time video preview</li><li><Check /> High-resolution MP4 and stills</li><li><Check /> Works completely offline after download</li><li><Check /> Your files never leave your device</li></ul></div><div className="feature-visual"><div className="frame-stack back" /><div className="frame-stack middle" /><div className="frame-stack front"><Image src="/room-mockup.webp" fill sizes="480px" alt="Interior wall art mockup" /></div><div className="badge"><Sparkles />Ready for your shop</div></div></div></section>

    <section className="download shell" id="download"><div className="download-card"><div className="download-copy"><span className="section-tag">GET THE DESKTOP APP</span><h2>Bring your mockup to life.</h2><p>Choose your computer to download LeeMockups. The app is free to use with every compatible LeeMockups template.</p><div className="download-security-note"><AlertTriangle size={18}/><span><strong>Early-access security notice</strong>The current apps are not yet code-signed, so Windows or macOS may show a warning the first time you open them. Download only from this official page.</span></div></div><DownloadOptions version={appVersion} {...downloads}/></div></section>

    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
