import type { Metadata } from "next";
import Image from "next/image";
import { Check, ImagePlus, Play, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupCatalog } from "@/app/mockups/mockup-catalog";
import { getSeoCatalogData } from "@/lib/catalog-seo";

const homeTitle = "Video Mockups for POD Sellers | LeeMockups";
const homeDescription = "Create T-shirt and mug video mockups for print-on-demand sellers. Make videos and still images for Etsy and eBay listings, Shopify and WooCommerce stores, and social posts.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  openGraph: { title: homeTitle, description: homeDescription },
  twitter: { title: homeTitle, description: homeDescription },
};

export default async function Home() {
  const { products, homeFeaturedSkus } = await getSeoCatalogData();
  const seoSkus = products.map((product) => product.sku);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LeeMockups',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any modern browser',
    description: 'Online tool for turning LeeMockups video mockups and artwork into product videos and still images.',
    url: 'https://www.leemockups.com/',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return <main className="home-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <div className="home-showcase">
      <svg className="hero-logo-watermark" viewBox="0 0 1600 1100" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
        <defs><linearGradient id="hero-logo-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#8255f3" /><stop offset="1" stopColor="#ff7771" /></linearGradient></defs>
        <g className="hero-mark-layer hero-mark-back"><rect x="270" y="-80" width="920" height="1080" rx="84" transform="rotate(-15 730 460)" fill="none" stroke="#8255f3" strokeOpacity=".10" strokeWidth="6" /></g>
        <g className="hero-mark-layer hero-mark-middle"><rect x="470" y="10" width="920" height="1050" rx="84" transform="rotate(-11 930 535)" fill="none" stroke="#a778ee" strokeOpacity=".10" strokeWidth="6" /></g>
        <g className="hero-mark-layer hero-mark-front"><rect x="620" y="60" width="900" height="1010" rx="84" transform="rotate(-8 1070 565)" fill="none" stroke="url(#hero-logo-gradient)" strokeOpacity=".13" strokeWidth="7" /></g>
        <g className="hero-mark-layer hero-mark-detail"><circle cx="1270" cy="215" r="55" fill="url(#hero-logo-gradient)" opacity=".07" /><path d="M915 1035 1120 690l142 180 125-143 143 221" fill="none" stroke="url(#hero-logo-gradient)" strokeOpacity=".06" strokeWidth="110" strokeLinejoin="round" strokeLinecap="round" /></g>
      </svg>
      <SiteNav />
      <section className="hero product-first-hero shell" id="top">
        <div className="hero-copy">
          <div className="eyebrow">Made for print-on-demand sellers</div>
          <h1>Video mockups. <br /><em>Ready for your designs.</em></h1>
          <p>Create product videos and still images for print-on-demand (POD) shops—from Etsy and eBay listings to Shopify and WooCommerce storefronts—without filming every item.</p>
          <div className="hero-actions"><a className="button primary" href="/mockups/">Browse Mockups</a></div>
        </div>
      </section>

      <div className="home-library" id="library">
        <MockupCatalog seoSkus={seoSkus} initialProducts={products} initialHomeFeaturedSkus={homeFeaturedSkus} previewLimit={8} />
      </div>
    </div>

    <section className="proof"><div className="shell proof-inner"><span>Built for the way you sell</span><b>PRODUCT LISTING READY</b><i /><b>CREATE ONLINE</b><i /><b>NO SUBSCRIPTION</b><i /><b>PRIVATE ARTWORK</b></div></section>

    <section className="steps shell" id="how"><div className="section-heading"><span>SIMPLE ON PURPOSE</span><h2>From design to listing video<br />in three simple steps.</h2></div><div className="step-grid">
      <article><span className="step-num">01</span><div className="step-icon"><Play /></div><h3>Choose a mockup</h3><p>Browse the library, select a product, and open the online creator.</p></article>
      <article><span className="step-num">02</span><div className="step-icon coral"><ImagePlus /></div><h3>Add your artwork</h3><p>Choose a PNG or JPG. See it mapped into the scene instantly, including motion and perspective.</p></article>
      <article><span className="step-num">03</span><div className="step-icon green"><Play /></div><h3>Export for your shop</h3><p>Save an MP4 video and ready-to-use still images, then upload them to your product listings.</p></article>
    </div></section>

    <section className="feature-band" id="features"><div className="shell feature-grid"><div className="feature-copy"><span className="section-tag">THE QUIETLY POWERFUL PART</span><h2>Professional results.<br />None of the learning curve.</h2><p>LeeMockups handles perspective, motion, and export settings for you. Your only creative decision is the artwork.</p><ul><li><Check /> Live design preview</li><li><Check /> High-resolution MP4 and stills</li><li><Check /> Create directly in your browser</li><li><Check /> Your artwork stays in your browser</li></ul></div><div className="feature-visual"><div className="frame-stack back" /><div className="frame-stack middle" /><div className="frame-stack front"><Image src="/room-mockup.webp" fill sizes="480px" alt="Interior wall art mockup" /></div><div className="badge"><Sparkles />Ready for your shop</div></div></div></section>


    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}
