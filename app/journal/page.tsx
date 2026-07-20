import type { Metadata } from "next"

import { Aurora } from "@/components/fx/aurora"
import { Reveal } from "@/components/fx/reveal"
import { JournalBrowser, type JournalSummary } from "@/components/journal/journal-browser"
import { getAllJournalEntries } from "@/lib/content/journal"

export const metadata: Metadata = {
  title: "The Journal",
  description:
    "Investigations into fairness, accountability, and transparency across sport — sourced, dated, and filed.",
  alternates: { canonical: "/journal" },
}

export default function JournalIndexPage() {
  // Map to a lightweight summary so we never ship full MDX content to the client.
  const entries: JournalSummary[] = getAllJournalEntries().map((e) => ({
    title: e.title,
    dek: e.dek,
    slug: e.slug,
    fileNo: e.fileNo,
    category: e.category,
    publishedAt: e.publishedAt.toISOString(),
  }))

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line/60 px-6 pb-12 pt-24">
        <Aurora />
        <div className="mx-auto max-w-5xl">
          <Reveal variant="blur">
            <p className="mono mb-5 text-[11px] text-gold-soft">The Journal</p>
            <h1 className="font-display text-[clamp(2.4rem,6vw,4.6rem)] font-extrabold uppercase leading-[0.92] text-gradient-bone">
              The record, <span className="text-gradient-gold">kept current.</span>
            </h1>
            <p className="mt-5 max-w-[60ch] text-lg leading-relaxed text-ash">
              Every report is sourced, dated, and filed. Filter by beat or search the archive — this is
              where the pattern gets tracked in real time.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="relative px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <JournalBrowser entries={entries} />
        </div>
      </section>
    </div>
  )
}
