import type { Metadata } from "next";
import Image from "next/image";
import { Check, ImagePlus, Play, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { MockupCatalog } from "@/app/mockups/mockup-catalog";
import { getSeoCatalogData } from "@/lib/catalog-seo";
import { getMockupCategories } from "@/lib/mockup-categories";
import { siteUrl } from "@/lib/site-url";
import { featuredGuideSlugs, guideBySlug } from "@/lib/guides";
import { MockupUpdates } from "@/components/mockup-updates";

const homeTitle = "Product Mockups & Video Mockups | LeeMockups";
const homeDescription = "Shop product mockups for T-shirts, mugs, posters, and picture frames. Add your artwork with the online mockup generator and download MP4 videos and matching still images.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: { title: homeTitle, description: homeDescription, url: "/", images: [{ url: "/leemockups-social-2026.png", width: 1622, height: 970, alt: "LeeMockups video mockups for mugs, shirts, and frames" }] },
  twitter: { card: "summary_large_image", title: homeTitle, description: homeDescription, images: ["/leemockups-social-2026.png"] },
};

export default async function Home() {
  const { products, homeFeaturedSkus } = await getSeoCatalogData();
  const seoSkus = products.map((product) => product.sku);
  const categories = getMockupCategories(products);
  const freeSample = products.find((product) => product.isFree);
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'LeeMockups',
    description: homeDescription,
    url: `${siteUrl}/`,
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
          <h1>Product Mockups <br /><em>for Your Designs</em></h1>
          <p>Shop video mockups for your products, add your artwork online, <span className="hero-description-tail">and download MP4 videos and matching still images for your listings.</span></p>
          <div className="hero-actions"><a className="button primary" href="/mockups/">Browse Video Mockups</a><a className="button hero-generator-button" href="/composer/">Mockup Generator</a></div>
        </div>
      </section>

      <div className="home-library" id="library">
        {categories.length > 0 && <nav className="catalog-categories shell" aria-label="Browse product mockups by category">
          {categories.map(({ slug, label }) => <a href={`/mockups/${slug}/`} key={slug}>{label} Mockups</a>)}
        </nav>}
        <MockupCatalog seoSkus={seoSkus} initialProducts={products} initialHomeFeaturedSkus={homeFeaturedSkus} previewLimit={8} />
      </div>
    </div>

    <MockupUpdates skus={seoSkus} />

    <section className="proof"><div className="shell proof-inner"><span>Built for the way you sell</span><b>PRODUCT LISTING READY</b><i /><b>CREATE ONLINE</b><i /><b>NO SUBSCRIPTION</b><i /><b>PRIVATE ARTWORK</b></div></section>

    <section className="home-guides shell" aria-labelledby="home-guides-title"><div className="home-guides-heading"><div><span className="section-tag">SELLER GUIDES</span><h2 id="home-guides-title">Questions sellers ask before they create</h2><p>Clear answers for Etsy listings, POD products, and browser-based video mockups.</p></div><a href="/guides/">View all guides <span aria-hidden="true">→</span></a></div><div className="home-guides-grid">{featuredGuideSlugs.map((slug) => { const guide = guideBySlug(slug); return guide && <a className="home-guide-card" href={`/guides/${slug}/`} key={slug}><span>{guide.category}</span><h3>{guide.title}</h3><strong>Read guide <span aria-hidden="true">→</span></strong></a>; })}</div></section>

    <section className="steps shell" id="how"><div className="section-heading"><span>CREATE IN YOUR BROWSER</span><h2>Online Mockup Generator</h2><p>Turn your artwork into a listing video in three steps.</p>{freeSample && <a className="button secondary" href={`/composer/?sku=${encodeURIComponent(freeSample.sku)}`}>Try the Mockup Generator</a>}</div><div className="step-grid">
      <article><span className="step-num">01</span><div className="step-icon"><Play /></div><h3>Choose a mockup</h3><p>Browse the library, select a product, and open the online creator.</p></article>
      <article><span className="step-num">02</span><div className="step-icon coral"><ImagePlus /></div><h3>Add your artwork</h3><p>Choose a PNG or JPG. See it mapped into the scene instantly, including motion and perspective.</p></article>
      <article><span className="step-num">03</span><div className="step-icon green"><Play /></div><h3>Export for your shop</h3><p>Save an MP4 video and ready-to-use still images, then upload them to your product listings.</p></article>
    </div></section>

    <section className="feature-band" id="features"><div className="shell feature-grid"><div className="feature-copy"><span className="section-tag">THE QUIETLY POWERFUL PART</span><h2>Professional results.<br />None of the learning curve.</h2><p>LeeMockups handles perspective, motion, and export settings for you. Your only creative decision is the artwork.</p><ul><li><Check /> Live design preview</li><li><Check /> High-resolution MP4 and stills</li><li><Check /> Create directly in your browser</li><li><Check /> Your artwork stays in your browser</li></ul></div><div className="feature-visual"><div className="frame-stack back" /><div className="frame-stack middle" /><div className="frame-stack front"><Image src="/room-mockup.webp" fill sizes="480px" alt="Interior wall art mockup" /></div><div className="badge"><Sparkles />Ready for your shop</div></div></div></section>


    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}


