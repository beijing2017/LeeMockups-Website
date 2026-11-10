import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteNav } from "@/components/site-nav";
import { PolicyLinks } from "@/components/policy-links";
import { guideBySlug, guides } from "@/lib/guides";

type PageProps = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${slug}/` },
    openGraph: { title: guide.title, description: guide.description, url: `/guides/${slug}/`, type: "article" },
  };
}

export default async function GuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = guideBySlug(slug);
  if (!guide) notFound();
  const related = guides.filter((item) => item.slug !== slug && item.category === guide.category).slice(0, 2);
  return <main className="guides-page">
    <SiteNav current="guides" />
    <div className="shell guide-layout">
      <nav className="guide-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><Link href="/guides/">Guides</Link></nav>
      <article className="guide-article">
        <header><span className="section-tag">{guide.category.toUpperCase()}</span><h1>{guide.title}</h1><p className="guide-lead">{guide.answer}</p><span className="guide-byline">By LeeMockups</span></header>
        {guide.sections.map((section) => <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          {section.steps && <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        </section>)}
        {guide.sources && <aside className="guide-sources"><h2>Check the source</h2><p>Platform requirements may change. Review the current rules before publishing.</p><ul>{guide.sources.map((source) => <li key={source.href}><a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul></aside>}
        <div className="guide-next"><h2>Put it into practice</h2><p>Try the workflow with a mockup that matches your product.</p><Link className="button primary" href={guide.action.href}>{guide.action.label}</Link></div>
      </article>
      <aside className="guide-related"><h2>More on this topic</h2>{related.map((item) => <Link href={`/guides/${item.slug}/`} key={item.slug}>{item.title}<span aria-hidden="true">→</span></Link>)}<Link href="/guides/">Browse all guides <span aria-hidden="true">→</span></Link></aside>
    </div>
    <footer className="shell"><div className="brand"><Image src="/leemockups-symbol.png" width={34} height={34} alt="" /><span>LeeMockups</span></div><PolicyLinks /><span>© 2026 LeeMockups</span></footer>
  </main>;
}

