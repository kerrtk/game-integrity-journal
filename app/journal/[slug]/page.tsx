import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { getAllJournalSlugs, getJournalEntryBySlug } from "@/lib/content/journal"
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

  return (
    <article className="mx-auto max-w-3xl px-6 py-0">
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

      <div className="border-b border-hair pb-8 pt-14">
        <span className="mono text-crimson">
          File No. {entry.fileNo} &middot; {entry.category}
        </span>
        <h1 className="my-3.5 max-w-[18ch] text-[clamp(32px,5.5vw,54px)] text-bone">
          {entry.title}
        </h1>
        <p className="text-steel">Filed {format(entry.publishedAt, "MMMM yyyy")}</p>
      </div>

      <div className="prose-article py-10">
        <ArticleBody source={entry.content} />
      </div>

      <div className="mb-14 border border-crimson bg-crimson-dim p-6">
        <p className="mono mb-3.5 text-[13px] normal-case tracking-normal text-bone">
          {entry.ctaText}
        </p>
        <Button asChild>
          <Link href="/unwhistled">Get the book</Link>
        </Button>
      </div>
    </article>
  )
}
