import Image from "next/image";
import Link from "next/link";
import { FileImage, HelpCircle, Play, ShieldCheck } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";

const faqs = [
  ["What do I need before I start?", "Choose a mockup and prepare your artwork as a PNG or JPG. Generation runs in your browser; there is no app to install."],
  ["How do I create a paid mockup?", "Complete checkout, then use Create video online from your verified purchase. Keep your order details in case you need to restore access later."],
  ["My artwork looks cropped. What should I do?", "Use the artwork placement controls to move and resize your design. The recommended image size is shown beside the upload area."],
  ["Where are my finished files?", "After creation, use Download video. The five still images appear beside or below the video preview and can be saved separately."],
  ["Does LeeMockups upload my artwork?", "Your selected artwork stays in your browser while you preview and create your video. It is not uploaded to LeeMockups."],
  ["The creator does not load. What should I send to support?", "Include the mockup name, your browser, the error message or a screenshot, and your order number if it is a paid mockup. Please do not send private artwork unless you choose to."],
];

export const metadata = {
  title: "Help & First Steps — LeeMockups",
  description: "Learn how to make video mockups online, add artwork, and save your finished video and still images.",
  alternates: { canonical: "/help/" },
};

export default function HelpPage() { return <main className="help-page">
  <SiteNav current="help" />
  <header className="help-hero shell"><span className="help-mark"><HelpCircle/></span><div><p>LEEMOCKUPS HELP CENTER</p><h1>Start with confidence.</h1><span>From choosing a mockup to your first finished video.</span></div></header>
  <section className="quick-start shell"><div className="section-heading"><span>FIRST TIME HERE?</span><h2>Your first mockup, step by step.</h2></div><div className="quick-grid">
    <article><b>1</b><Play/><h3>Choose a mockup</h3><p><Link href="/mockups/">Browse the library</Link> and choose a free or paid design.</p></article>
    <article><b>2</b><FileImage/><h3>Add your artwork</h3><p>Open the online creator and select a PNG or JPG. Move and resize your design in the placement area.</p></article>
    <article><b>3</b><Play/><h3>Create your video</h3><p>Check the preview, then create your MP4 video and five still images in the browser.</p></article>
    <article><b>4</b><ShieldCheck/><h3>Save your files</h3><p>Download your finished video and stills for your product listings.</p></article>
  </div></section>
  <section className="faq shell"><div className="section-heading"><span>QUICK ANSWERS</span><h2>Common questions.</h2></div><div className="faq-list">{faqs.map(([q,a],i)=><details key={q} open={i===0}><summary>{q}<span>+</span></summary><p>{a}</p></details>)}</div></section>
  <section className="support shell"><HelpCircle/><div><h2>Still stuck?</h2><p>Take a screenshot of what you see and email <a href="mailto:support@leemockups.com">support@leemockups.com</a> with the mockup name and your order details if applicable.</p></div></section>
  <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt=""/><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
</main> }
