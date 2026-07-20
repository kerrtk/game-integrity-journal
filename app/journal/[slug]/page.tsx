import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { ShareBar } from "@/components/journal/share-bar"
import { Button } from "@/components/ui/button"
import { getAllJournalEntries, getAllJournalSlugs, getJournalEntryBySlug } from "@/lib/content/journal"
import { articleJsonLd, breadcrumbJsonLd, SITE_URL } from "@/lib/json-ld"
import { ArticleBody } from "@/lib/mdx"

export function generateStaticParams() {
  return getAllJournalSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = getJournalEntryBySlug(slug)
  if (!entry) return {}
  return {
    title: entry.title,
    description: entry.dek,
    alternates: { canonical: `/journal/${entry.slug}` },
    openGraph: {
      type: "article",
      title: entry.title,
      description: entry.dek,
      publishedTime: entry.publishedAt.toISOString(),
    },
  }
}

export default async function JournalEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = getJournalEntryBySlug(slug)
  if (!entry) notFound()

  const url = `${SITE_URL}/journal/${entry.slug}`
  const related = getAllJournalEntries()
    .filter((e) => e.slug !== entry.slug)
    .slice(0, 2)

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            articleJsonLd({
              title: entry.title,
              dek: entry.dek,
              slug: entry.slug,
              publishedAt: entry.publishedAt,
              updatedAt: entry.updatedAt,
            })
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: "Home", url: SITE_URL },
              { name: "Journal", url: `${SITE_URL}/journal` },
              { name: entry.title, url },
            ])
          ),
        }}
      />

      {/* Cinematic masthead */}
      <header className="relative overflow-hidden border-b border-line/60 px-6 pb-12 pt-24">
        <Aurora />
        <div className="mx-auto max-w-3xl">
          <Reveal variant="blur">
            <Link
              href="/journal"
              className="mono mb-8 inline-flex items-center gap-2 text-[11px] text-steel transition-colors hover:text-bone"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> The Journal
            </Link>
            <p className="mono mb-5 text-[11px] text-gold-soft">
              File No. {entry.fileNo} &middot; {entry.category}
            </p>
            <h1 className="font-display text-[clamp(2rem,5.5vw,3.9rem)] font-extrabold uppercase leading-[0.96] text-gradient-bone">
              {entry.title}
            </h1>
            <p className="mt-6 max-w-[60ch] text-xl leading-relaxed text-ash">{entry.dek}</p>
            <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-t border-line/60 pt-6">
              <p className="mono text-[11px] text-steel">
                Filed {format(entry.publishedAt, "MMMM d, yyyy")}
                {entry.updatedAt ? ` · Updated ${format(entry.updatedAt, "MMMM d, yyyy")}` : ""}
              </p>
              <ShareBar title={entry.title} url={url} />
            </div>
          </Reveal>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto max-w-3xl px-6">
        <Reveal className="prose-article py-14">
          <ArticleBody source={entry.content} />
        </Reveal>

        {/* CTA */}
        <Reveal className="mb-16 overflow-hidden rounded-xl glass-strong p-8">
          <p className="mono mb-2 text-[11px] text-crimson-soft">From the case file</p>
          <p className="max-w-xl text-lg leading-relaxed text-bone">{entry.ctaText}</p>
          <div className="mt-6">
            <Button asChild variant="gold">
              <Link href="/unwhistled">Get the book</Link>
            </Button>
          </div>
        </Reveal>
      </div>

      {/* Related reports */}
      {related.length > 0 && (
        <section className="border-t border-line/60 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mb-10">
              <p className="mono mb-3 text-[11px] text-gold-soft">Keep reading</p>
              <h2 className="font-display text-[clamp(1.6rem,4vw,2.4rem)] font-extrabold uppercase text-bone">
                More from the record
              </h2>
            </Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              {related.map((e, i) => (
                <Reveal key={e.slug} delay={i * 0.08}>
                  <Link
                    href={`/journal/${e.slug}`}
                    className="group flex h-full flex-col rounded-xl glass p-7 transition-colors hover:border-gold/40"
                  >
                    <span className="mono mb-3 text-[10px] text-crimson-soft">
                      File No. {e.fileNo} &middot; {e.category}
                    </span>
                    <h3 className="text-2xl leading-tight text-bone transition-colors group-hover:text-gold-soft">
                      {e.title}
                    </h3>
                    <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-steel">{e.dek}</p>
                    <span className="mono mt-5 inline-flex items-center gap-1.5 text-[11px] text-gold-soft">
                      Read report <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
