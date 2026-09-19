import Image from "next/image";
import { ArrowDown, Check, Download, ImagePlus, Layers3, Play, ShieldCheck, Sparkles } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

const appVersion = "1.13.71";
// Public Worker endpoints. The Worker streams private R2 objects and never redirects
// the browser to a bucket hostname or exposes predictable object keys.
const downloadBase = "https://downloads.leemockups.com/d";
const downloads = {
  windows: `${downloadBase}/windows`,
  macArm64: `${downloadBase}/mac-arm64`,
  macX64: `${downloadBase}/mac-x64`,
};

const DownloadIcon = ({ kind }: { kind: "windows" | "apple" }) => kind === "windows" ? (
  <span className="windows-mark" aria-hidden="true"><i /><i /><i /><i /></span>
) : <svg className="apple-mark" aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.22.07 2.07.67 2.79.72 1.08-.22 2.11-.85 3.27-.77 1.39.11 2.44.66 3.15 1.65-2.87 1.72-2.19 5.5.44 6.56-.57 1.5-1.3 2.99-2.5 4.05zM12.03 7.25C11.88 5.02 13.69 3.18 15.77 3c.29 2.58-2.34 4.5-3.74 4.25z" /></svg>;

export default function Home() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'LeeMockups',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Windows, macOS',
    softwareVersion: appVersion,
    description: 'Desktop software for turning LeeMockups templates and artwork into animated product videos and still images.',
    url: 'https://www.leemockups.com/',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
    <SiteNav />

    <section className="hero shell" id="top">
      <div className="hero-copy">
        <div className="eyebrow"><span><Sparkles size={13} /></span> Made for creative product sellers</div>
        <h1>Your design.<br /><em>Beautifully in motion.</em></h1>
        <p>Turn a LeeMockups template and your artwork into polished product videos—right on your desktop. No editing experience needed.</p>
        <div className="hero-actions"><a className="button primary" href="#download"><Download size={18} /> Download LeeMockups</a><a className="text-link" href="#how"><Play size={15} fill="currentColor" /> See how it works</a></div>
        <div className="micro-trust"><ShieldCheck size={16} /><span>Private by design</span><b>•</b><span>Your artwork stays on your computer</span></div>
      </div>

      <div className="product-stage" aria-label="LeeMockups desktop app preview">
        <div className="glow glow-one" /><div className="glow glow-two" />
        <div className="app-window">
          <div className="window-bar"><div className="window-brand"><Image src="/leemockups-symbol.png" width={25} height={25} alt="" /><span>LeeMockups</span></div><div className="window-dots"><i /><i /><i /></div></div>
          <div className="app-body">
            <aside className="app-sidebar"><small>MY LIBRARY</small><div className="mini-card active"><div className="mini-thumb" /><span>Gallery Frame</span></div><div className="mini-card"><div className="mini-thumb soft" /><span>Studio Poster</span></div><div className="privacy"><span />Artwork stays local</div></aside>
            <div className="app-preview"><div className="preview-image"><Image src="/room-mockup.webp" fill sizes="620px" alt="Living room frame mockup shown in LeeMockups" /></div><div className="timeline"><span className="play"><Play size={10} fill="currentColor" /></span><i><b /></i><time>00:07 / 00:10</time></div></div>
            <aside className="app-controls"><span className="control-kicker">YOUR ARTWORK</span><button><ImagePlus size={18} /><span><strong>Choose your image</strong><small>PNG or JPG</small></span></button><div className="control-grid"><span><small>OUTPUT</small><strong>2000 × 2000</strong></span><span><small>FORMAT</small><strong>MP4</strong></span></div><div className="control-label"><span>Video quality</span><b>High</b></div><div className="quality"><i /><i className="selected" /><i /></div><div className="export"><Sparkles size={15} /> Export my mockup</div></aside>
          </div>
        </div>
        <div className="floating-card float-left"><span className="ok"><Check size={14} /></span><div><b>Mockup ready</b><small>10-second product video</small></div></div>
        <div className="floating-card float-right"><Layers3 size={18} /><div><b>Drop. Preview. Export.</b><small>It really is that simple.</small></div></div>
      </div>
    </section>

    <section className="proof"><div className="shell proof-inner"><span>Built for the way you sell</span><b>PRODUCT LISTING READY</b><i /><b>WINDOWS &amp; macOS</b><i /><b>NO SUBSCRIPTION</b><i /><b>LOCAL &amp; PRIVATE</b></div></section>

    <section className="steps shell" id="how"><div className="section-heading"><span>SIMPLE ON PURPOSE</span><h2>From download to listing video<br />in three calm steps.</h2></div><div className="step-grid">
      <article><span className="step-num">01</span><div className="step-icon"><Download /></div><h3>Open your mockup</h3><p>Download your mockup, then drag the <code>.mockup</code> file into LeeMockups.</p></article>
      <article><span className="step-num">02</span><div className="step-icon coral"><ImagePlus /></div><h3>Add your artwork</h3><p>Choose a PNG or JPG. See it mapped into the scene instantly, including motion and perspective.</p></article>
      <article><span className="step-num">03</span><div className="step-icon green"><Play /></div><h3>Export and sell</h3><p>Create a polished MP4 listing video plus ready-to-use still images in a few clicks.</p></article>
    </div></section>

    <section className="feature-band" id="features"><div className="shell feature-grid"><div className="feature-copy"><span className="section-tag">THE QUIETLY POWERFUL PART</span><h2>Professional results.<br />None of the learning curve.</h2><p>LeeMockups handles perspective, motion, and export settings for you. Your only creative decision is the artwork.</p><ul><li><Check /> Real-time video preview</li><li><Check /> High-resolution MP4 and stills</li><li><Check /> Works completely offline after download</li><li><Check /> Your files never leave your device</li></ul></div><div className="feature-visual"><div className="frame-stack back" /><div className="frame-stack middle" /><div className="frame-stack front"><Image src="/room-mockup.webp" fill sizes="480px" alt="Interior wall art mockup" /></div><div className="badge"><Sparkles />Ready for your shop</div></div></div></section>

    <section className="download shell" id="download"><div className="download-card"><div className="download-copy"><span className="section-tag">GET THE DESKTOP APP</span><h2>Bring your mockup to life.</h2><p>Choose your computer to download LeeMockups. The app is free to use with every compatible LeeMockups template.</p></div><div className="download-options">
      <a className="platform main-download" id="windows-download" href={downloads.windows}><DownloadIcon kind="windows" /><span><small>DOWNLOAD FOR</small><strong>Windows <b>v{appVersion}</b></strong><em>Windows 10 or later · 64-bit Windows · Portable ZIP</em></span><ArrowDown /></a>
      <a className="platform" id="mac-apple-silicon" href={downloads.macArm64}><DownloadIcon kind="apple" /><span><small>MAC · RECOMMENDED FOR MOST</small><strong>Apple Silicon <b>v{appVersion}</b></strong><em>M1, M2, M3, M4 or newer · arm64 ZIP</em></span><ArrowDown /></a>
      <a className="platform" id="mac-intel" href={downloads.macX64}><DownloadIcon kind="apple" /><span><small>MAC · OLDER MODELS</small><strong>Intel <b>v{appVersion}</b></strong><em>Shows “Processor: Intel” · x64 ZIP</em></span><ArrowDown /></a>
      <a className="which-mac" href="/help#choose-mac">Not sure which Mac version? Check in 20 seconds →</a>
      <p><ShieldCheck /> Direct Cloudflare download · No account required</p>
    </div></div></section>

    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><p>Professional Mockups. Smarter Marketing.</p><span>© 2026 LeeMockups</span></footer>
  </main>;
}
