import type { Metadata } from "next"

import { JournalCard } from "@/components/journal-card"
import { getAllJournalEntries } from "@/lib/content/journal"

export const metadata: Metadata = {
  title: "The Journal",
  description:
    "Ongoing reports on officiating failures, retroactive corrections, and institutional patterns in professional sports.",
  alternates: { canonical: "/journal" },
}

export default function JournalIndexPage() {
  const entries = getAllJournalEntries()

  return (
    <div>
      <section className="border-b border-hair px-6 pb-6 pt-16">
        <div className="mx-auto max-w-5xl">
          <span className="mono mb-3.5 block text-xs text-crimson">The Journal</span>
          <h1 className="text-[clamp(34px,6vw,58px)] text-bone">The record, kept current.</h1>
          <p className="mt-[18px] max-w-[60ch] text-lg text-steel">
            Every report is sourced, dated, and filed. This is where the pattern gets tracked in
            real time.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-px border border-hair bg-hair md:grid-cols-3">
            {entries.map((entry) => (
              <JournalCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
