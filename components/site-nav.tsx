import Image from "next/image";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { getSeoCatalogData } from "@/lib/catalog-seo";
import { getMockupCategories } from "@/lib/mockup-categories";

type SiteNavProps = { current?: "help" | "mockups" | "order-download" };

export async function SiteNav({ current }: SiteNavProps) {
  const { products } = await getSeoCatalogData();
  const categories = getMockupCategories(products);
  return <nav className="nav shell">
    <Link className="brand" href="/"><Image src="/leemockups-symbol.png" width={38} height={38} alt="" /><span>LeeMockups</span><span className="beta-badge" title="Preview release">BETA</span></Link>
    <div className="nav-links">
      <div className="nav-library">
        <div className="nav-library-menu">
          <button className="nav-library-trigger" type="button" aria-haspopup="true">Mockup Library <ChevronDown size={14} aria-hidden="true" /></button>
          <div className="nav-library-options">
            <Link href="/mockups/">All</Link>
            {categories.map(({ slug, label }) => <Link href={`/mockups/${slug}/`} key={slug}>{label}</Link>)}
          </div>
        </div>
      </div>
      <Link href="/#how">How it works</Link>
      <Link href="/#features">Features</Link>
      <Link href="/help/" aria-current={current === "help" ? "page" : undefined}>Help</Link>
    </div>
    <Link className="nav-cta" href="/mockups/">Browse Mockups</Link>
  </nav>;
}
