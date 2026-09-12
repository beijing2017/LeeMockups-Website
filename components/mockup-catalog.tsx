"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import { mockupCategories, publicMockups } from "@/lib/mockups";

export function MockupCatalog() {
  const [category, setCategory] = useState<(typeof mockupCategories)[number]>("All");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => publicMockups.filter((mockup) =>
    (category === "All" || mockup.category === category) &&
    `${mockup.title} ${mockup.category} ${mockup.description}`.toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query]);

  return <section className="catalog shell" aria-label="Browse mockups">
    <div className="catalog-toolbar">
      <div className="catalog-search"><Search size={18} aria-hidden="true" /><input aria-label="Search mockups" type="search" placeholder="Search mockups" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <span className="catalog-count"><SlidersHorizontal size={15} aria-hidden="true" /> {filtered.length} {filtered.length === 1 ? "mockup" : "mockups"}</span>
    </div>
    <div className="catalog-categories" role="group" aria-label="Filter by category">{mockupCategories.map((item) => <button key={item} type="button" className={category === item ? "selected" : ""} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    {filtered.length ? <div className="mockup-grid">{filtered.map((mockup) => <article className="mockup-card" key={mockup.slug}>
      <div className="mockup-card-image"><Image src={mockup.image} alt={mockup.imageAlt} fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw" /></div>
      <div className="mockup-card-body"><span>{mockup.category}</span><h2>{mockup.title}</h2><p>{mockup.description}</p><div className="mockup-card-actions">{mockup.detailUrl && <Link href={mockup.detailUrl}>View mockup <ArrowUpRight size={15} /></Link>}<a href={mockup.etsyUrl} target="_blank" rel="noopener noreferrer">Buy on Etsy <ArrowUpRight size={15} /></a></div></div>
    </article>)}</div> : publicMockups.length === 0 ? <div className="catalog-empty"><div className="catalog-empty-copy"><span className="section-tag">IN THE MAKING</span><h2>Something lovely is on its way.</h2><p>Our first animated mockups are being prepared. Browse the collection here when it opens, or get the free desktop app ready in the meantime.</p><Link href="/#download" className="button primary">Get the desktop app <ArrowUpRight size={17} /></Link></div><div className="catalog-empty-art"><Image src="/room-mockup.webp" alt="Preview of a LeeMockups interior scene" fill sizes="(max-width: 700px) 100vw, 450px" /><span>Preview of what’s coming</span></div></div> : <div className="catalog-no-results"><h2>No matching mockups yet.</h2><p>Try another search or category.</p><button type="button" onClick={() => { setQuery(""); setCategory("All"); }}>Clear filters</button></div>}
  </section>;
}
