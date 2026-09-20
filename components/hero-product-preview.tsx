"use client";

import Image from "next/image";
import { Check, ImagePlus, Play, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

const mockups = [
  { name: "Gallery Frame", image: "/hero-mockups/frame.jpg?v=784ab8e" },
  { name: "Ceramic Mug", image: "/hero-mockups/mug.jpg?v=784ab8e" },
  { name: "Classic T-Shirt", image: "/hero-mockups/tshirt.jpg?v=784ab8e" },
  { name: "Canvas Tote Bag", image: "/hero-mockups/tote.jpg?v=784ab8e" },
  { name: "Pullover Hoodie", image: "/hero-mockups/hoodie.jpg?v=784ab8e" },
  { name: "Phone Case", image: "/hero-mockups/phone-case.jpg?v=784ab8e" },
  { name: "Studio Poster", image: "/hero-mockups/poster.jpg?v=784ab8e" },
];

const library = mockups.slice(0, 5);

export function HeroProductPreview() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(Math.floor(Math.random() * mockups.length));
  }, []);

  const active = mockups[activeIndex];

  return <div className="product-stage" aria-label="LeeMockups desktop app preview">
    <div className="glow glow-one" /><div className="glow glow-two" />
    <div className="app-window">
      <div className="window-bar"><div className="window-brand"><Image src="/leemockups-symbol.png" width={25} height={25} alt="" /><span>LeeMockups</span></div><div className="window-dots"><i /><i /><i /></div></div>
      <div className="app-body">
        <aside className="app-sidebar"><small>MY LIBRARY</small><div className="mini-list">{library.map((item, index) => <button type="button" key={item.name} className={`mini-card${activeIndex === index ? " active" : ""}`} onClick={() => setActiveIndex(index)}><span className="mini-thumb"><Image src={item.image} fill sizes="44px" alt="" /></span><span>{item.name}</span></button>)}</div><div className="privacy"><span />Artwork stays local</div></aside>
        <div className="app-preview"><div className="preview-image"><Image src={active.image} fill priority sizes="620px" alt={`${active.name} mockup shown in LeeMockups`} /></div><div className="timeline"><span className="play"><Play size={10} fill="currentColor" /></span><i><b /></i><time>00:07 / 00:10</time></div></div>
        <aside className="app-controls"><span className="control-kicker">YOUR DESIGN</span><button><ImagePlus size={18} /><span><strong>Choose your image</strong><small>PNG or JPG</small></span></button><div className="selected-mockup"><small>SELECTED MOCKUP</small><strong>{active.name}</strong></div><div className="control-grid"><span><small>LENGTH</small><strong>10 seconds</strong></span><span><small>OUTPUT</small><strong>MP4 + stills</strong></span></div><div className="export"><Sparkles size={15} /> Start rendering</div></aside>
      </div>
    </div>
    <div className="floating-card float-left"><span className="ok"><Check size={14} /></span><div><b>Design applied</b><small>Preview before rendering</small></div></div>
    <div className="floating-card float-right"><Sparkles size={18} /><div><b>Choose. Preview. Render.</b><small>Everything stays on your computer.</small></div></div>
  </div>;
}
