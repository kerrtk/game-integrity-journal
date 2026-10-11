import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { DocketView } from "@/components/docket/docket-view"
import { Aurora } from "@/components/fx/aurora"
import { getAllDockets, getDocket, prettyDocketDate } from "@/lib/docket"

export const dynamicParams = false

export function generateStaticParams() {
  return getAllDockets().map((d) => ({ date: d.date }))
}

export async function generateMetadata({ params }: { params: Promise<{ date: string }> }): Promise<Metadata> {
  const { date } = await params
  const docket = getDocket(date)
  if (!docket) return {}
  const title = `The Daily Docket: ${prettyDocketDate(docket.date)}`
  const description = docket.items
    .slice(0, 3)
    .map((i) => i.headline)
    .join(" · ")
  return {
    title,
    description,
    alternates: { canonical: `/docket/${docket.date}` },
    robots: docket.sample ? { index: false, follow: false } : undefined,
    openGraph: { type: "article", title, description, publishedTime: docket.generatedAt },
  }
}

export default async function DocketDatePage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const docket = getDocket(date)
  if (!docket) notFound()

  return (
    <div>
      <header className="relative overflow-hidden border-b border-line/60 px-6 pb-10 pt-24">
        <Aurora />
        <div className="mx-auto max-w-4xl">
          <Link
            href="/docket"
            className="mono mb-8 inline-flex items-center gap-2 text-[11px] text-steel transition-colors hover:text-bone"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> The Daily Docket
          </Link>
          <h1 className="font-display text-[clamp(2rem,5.5vw,3.6rem)] font-extrabold uppercase leading-[0.96] text-gradient-bone">
            The Daily Docket
          </h1>
        </div>
      </header>
      <section className="relative px-6 py-14">
        <DocketView docket={docket} archive={getAllDockets()} />
      </section>
    </div>
  )
}
