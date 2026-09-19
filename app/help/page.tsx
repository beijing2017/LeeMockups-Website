import Image from "next/image";
import { AlertTriangle, CheckCircle2, Download, ExternalLink, FileImage, FolderOpen, HelpCircle, MousePointer2, Play, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";

const faqs = [
  ["What do I need before I start?", "Install LeeMockups for your computer, download your .mockup file, and have your artwork ready as a PNG or JPG. You do not need Blender, Photoshop, or video-editing software."],
  ["How do I open my mockup?", "Open LeeMockups, then drag the .mockup file into the app. You can also use the Import mockup button. The template will appear in My Library, so you can use it again later."],
  ["Why can’t I select my ZIP file?", "First unzip the download. The file LeeMockups needs ends in .mockup. Keep the original ZIP as a backup."],
  ["My artwork looks cropped. What should I do?", "Check the recommended artwork size shown inside LeeMockups. Use the same aspect ratio for the best fit. You can export your artwork again without changing the mockup."],
  ["Where are my finished files?", "After export, LeeMockups opens the output folder. Your MP4 video and full-resolution still images are stored there. If the folder does not open, check the location shown beside the Export button."],
  ["Does LeeMockups upload my artwork?", "No. Mockup preview and export happen on your own computer. Your artwork is not sent to LeeMockups or any marketplace."],
  ["Can I use one purchase on another computer?", "You can install the matching Windows or macOS app on your own computers and import your purchased .mockup again. Keep the original download somewhere safe."],
  ["The app or mockup does not open. What should I send to support?", "Tell us whether you use Windows, Apple Silicon Mac, or Intel Mac; include your LeeMockups version, the mockup name, and a screenshot of the message you see. Never send private artwork unless you choose to."],
];

export const metadata = {
  title: "Help & First Steps — LeeMockups",
  description: "Simple setup, download, Mac security, and troubleshooting instructions for LeeMockups customers.",
  alternates: { canonical: "/help/" },
  openGraph: { title: "Help & First Steps — LeeMockups", description: "Setup, Mac download choices, first-open guidance, and answers for LeeMockups customers.", images: [] },
  twitter: { title: "Help & First Steps — LeeMockups", description: "Setup, Mac download choices, first-open guidance, and answers for LeeMockups customers.", images: [] },
};

export default function HelpPage(){return <main className="help-page">
  <SiteNav current="help" />
  <header className="help-hero shell"><span className="help-mark"><HelpCircle/></span><div><p>LEEMOCKUPS HELP CENTER</p><h1>Start with confidence.</h1><span>Everything you need—from the right download to the first finished video.</span></div></header>

  <section className="quick-start shell"><div className="section-heading"><span>FIRST TIME HERE?</span><h2>Your first mockup, step by step.</h2></div><div className="quick-grid">
    <article><b>1</b><Download/><h3>Install LeeMockups</h3><p>Choose Windows, Apple Silicon Mac, or Intel Mac. Unzip the download before opening it.</p></article>
    <article><b>2</b><FolderOpen/><h3>Import your mockup</h3><p>Unzip your download and drag the file ending in <code>.mockup</code> into the app.</p></article>
    <article><b>3</b><FileImage/><h3>Choose your artwork</h3><p>Select a PNG or JPG. Your design appears in the animated scene immediately.</p></article>
    <article><b>4</b><Play/><h3>Preview and export</h3><p>Press play, choose quality, then export your MP4 video and still images.</p></article>
  </div></section>

  <section className="mac-help" id="choose-mac"><div className="shell"><div className="mac-heading"><span className="section-tag">DOWNLOADING FOR MAC</span><h2>Choose the version made for your Mac.</h2><p>Click the Apple menu <strong> → About This Mac</strong>, then look for one of these two labels.</p></div><div className="mac-choice-grid">
    <article className="recommended"><span>RECOMMENDED FOR MOST MACS</span><h3>Apple Silicon</h3><p>Choose this version if About This Mac shows <strong>Chip: Apple M1, M2, M3, M4</strong> or newer.</p><a href="/#mac-apple-silicon">Download Apple Silicon <Download/></a></article>
    <article><span>OLDER INTEL-BASED MACS</span><h3>Intel</h3><p>Choose this version if About This Mac shows <strong>Processor: Intel</strong>.</p><a href="/#mac-intel">Download Intel <Download/></a></article>
  </div><p className="source-note">Apple explains that “Chip” identifies Apple silicon, while “Processor” identifies Intel Macs. <a href="https://support.apple.com/en-us/116943" target="_blank" rel="noreferrer">View Apple’s guide <ExternalLink/></a></p></div></section>

  <section className="mac-open shell"><div className="mac-open-copy"><span className="section-tag">FIRST OPEN ON macOS</span><h2>If double-clicking does not open the app.</h2><p>Because this portable build is distributed directly, macOS may ask you to confirm that you trust it. Only continue when you downloaded LeeMockups from this official page.</p></div><ol>
    <li><span>1</span><div><strong>Unzip the download</strong><p>Move <b>LeeMockups.app</b> into your Applications folder.</p></div></li>
    <li><span>2</span><div><strong>Control-click the app</strong><p>Hold the <kbd>Control</kbd> key, click LeeMockups once, then choose <b>Open</b>. This is not Command-click and not a normal double-click.</p></div></li>
    <li><span>3</span><div><strong>If Open is still blocked</strong><p>Try opening once, then go to <b>System Settings → Privacy &amp; Security</b>. Scroll down and choose <b>Open Anyway</b>, then confirm Open.</p></div></li>
    <li><span>4</span><div><strong>Open normally next time</strong><p>After you approve it once, you can launch LeeMockups with a normal double-click.</p></div></li>
  </ol><div className="safety-note"><ShieldCheck/><p><strong>Why does macOS show this?</strong><br/>Gatekeeper warns when an app is not notarized by Apple. Never bypass this warning for a file from an unknown website.</p></div></section>

  <section className="faq shell"><div className="section-heading"><span>QUICK ANSWERS</span><h2>Common questions.</h2></div><div className="faq-list">{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
  <section className="support shell"><AlertTriangle/><div><h2>Still stuck?</h2><p>Take a screenshot of what you see and contact LeeMockups support with your order details and app version.</p></div></section>
  <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt=""/><span>LeeMockups</span></div><p>Professional Mockups. Smarter Marketing.</p><span>© 2026 LeeMockups</span></footer>
  </main>}
